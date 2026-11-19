import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { User } from '@entities/user.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import type { AbilityService } from '@modules/ability/interfaces/IService';
import { UserPermissions } from '@modules/ability/types';
import type { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { MODULES } from '@modules/app/constants/modules';
import { skipAppEditingVersionHydration } from '@modules/apps/subscribers/hydration-context';
import type { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { assertGitSyncCreateAllowedForOrg } from '@modules/git-sync-configs/guards/git-sync-edit-guard';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import type { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { FEATURE_KEY } from '../constants';
import { FEATURES } from '../constants/feature';
import { assertDataSourceEditAllowed } from '../guards/data-source-edit-rule';
import { redactEncryptedOptions } from '../audit-redaction';
import type { DataSourcesUtilService } from '../util.service';
import { emitRequestAuditLogEntry } from './audit-log';
import { dataSourceActions, folderActions, isEditCapable, resolveFolderAccess, visibleDataSourceIds } from './actions';
import {
  BuiltQuery,
  DataSourceDashboardScope,
  DataSourceEntryRow,
  folderHeaderQuery,
  folderPageQuery,
  PinIds,
  rootCountsQuery,
  rootPageQuery,
  searchCountsQuery,
  searchPageQuery,
  visibleIdsQuery,
} from './queries';
import {
  DataSourceDashboardEntryDto,
  ListDataSourcesV2QueryDto,
  ListDataSourcesV2ResponseDto,
  RefDto,
} from './dto/list.dto';
import { SaveAllDataSourceEnvironmentsDto, SaveDataSourceEnvironmentDto } from './dto/save-all.dto';

type Counts = { pinned: number; folders: number; data_sources: number };

type UserNameRow = { id: string; first_name: string | null; last_name: string | null };
type NameRow = { id: string; name: string };

const displayName = (u: UserNameRow) => [u.first_name, u.last_name].filter(Boolean).join(' ');

interface EntryContext {
  scope: DataSourceDashboardScope;
  permissions: UserPermissions;
}

export class DataSourcesDashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly abilityService: AbilityService,
    private readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService,
    private readonly dataSourcesUtilService: DataSourcesUtilService,
    private readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    private readonly licenseTermsService: LicenseTermsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  // Resolving permissions loads workspace apps; skip their version hydration as getFolders does.
  permissions(user: User): Promise<UserPermissions> {
    return skipAppEditingVersionHydration.run(true, () =>
      this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: MODULES.GLOBAL_DATA_SOURCE }, { resource: MODULES.DATA_SOURCE_FOLDER }],
        organizationId: user.organizationId,
      })
    );
  }

  // The single permission resolve for the request; every query below reads from the scope.
  async resolveScope(user: User, branchId?: string): Promise<EntryContext> {
    await this.assertBranchInWorkspace(user, branchId);
    const permissions = await this.permissions(user);
    const git = await this.gitSyncConfigsUtilService.getDetails(user.organizationId);
    const defaultBranchId = git.options.defaultBranch.id;
    const scope: DataSourceDashboardScope = {
      organizationId: user.organizationId,
      userId: user.id,
      branchId: branchId ?? defaultBranchId,
      defaultBranchId,
      visibleDataSourceIds: visibleDataSourceIds(permissions),
      activityColumn: isEditCapable(permissions) ? 'last_edited_at' : 'last_viewed_at',
      folderAccess: resolveFolderAccess(permissions, user.id),
      git: { enabled: git.isEnabled, multiBranch: git.isMultiBranchingEnabled },
    };
    return { scope, permissions };
  }

  assertFolderWritable(user: User, branchId?: string): Promise<void> {
    return assertGitSyncCreateAllowedForOrg(this.gitSyncConfigsUtilService, user.organizationId, branchId, 'folder');
  }

  async resolveBranchId(user: User, branchId?: string): Promise<string> {
    await this.assertBranchInWorkspace(user, branchId);
    return branchId ?? (await this.gitSyncConfigsUtilService.getDetails(user.organizationId)).options.defaultBranch.id;
  }

  private async assertBranchInWorkspace(user: User, branchId?: string): Promise<void> {
    if (!branchId) return;
    const branch = await this.dataSource.manager.findOne(WorkspaceBranch, {
      where: { id: branchId, organizationId: user.organizationId },
      select: ['id'],
    });
    if (!branch) throw new NotFoundException('Branch not found');
  }

  async visibleIds(user: User, branchId: string, ids: PinIds): Promise<Set<string>> {
    if (ids.data_source.length + ids.folder.length === 0) return new Set();
    const { scope } = await this.resolveScope(user, branchId);
    return new Set((await this.run<{ id: string }>(visibleIdsQuery(scope, ids))).map((row) => row.id));
  }

  async list(user: User, query: ListDataSourcesV2QueryDto): Promise<ListDataSourcesV2ResponseDto> {
    const ctx = await this.resolveScope(user, query.branch_id);
    if (query.search) return this.search(ctx, query);
    if (query.folder_id) return this.folder(ctx, query);
    return this.root(ctx, query);
  }

  private async root(ctx: EntryContext, query: ListDataSourcesV2QueryDto): Promise<ListDataSourcesV2ResponseDto> {
    const [[counts], rows] = await Promise.all([
      this.run<Counts>(rootCountsQuery(ctx.scope)),
      this.run<DataSourceEntryRow>(rootPageQuery(ctx.scope, query.page_size, this.offset(query))),
    ]);
    return this.response(query, {
      items: await this.toEntries(rows, ctx),
      total: counts.pinned + counts.folders + counts.data_sources,
      counts,
      folder: null,
    });
  }

  private async folder(ctx: EntryContext, query: ListDataSourcesV2QueryDto): Promise<ListDataSourcesV2ResponseDto> {
    const [[header], rows] = await Promise.all([
      this.run<{ id: string; name: string; total: number; pinned: number }>(
        folderHeaderQuery(ctx.scope, query.folder_id)
      ),
      this.run<DataSourceEntryRow>(folderPageQuery(ctx.scope, query.folder_id, query.page_size, this.offset(query))),
    ]);
    if (!header) throw new NotFoundException('Folder not found');
    return this.response(query, {
      items: await this.toEntries(rows, ctx),
      total: header.total,
      counts: { pinned: header.pinned, folders: 0, data_sources: header.total - header.pinned },
      folder: { id: header.id, name: header.name },
    });
  }

  private async search(ctx: EntryContext, query: ListDataSourcesV2QueryDto): Promise<ListDataSourcesV2ResponseDto> {
    const [[counts], rows] = await Promise.all([
      this.run<Counts>(searchCountsQuery(ctx.scope, query.search)),
      this.run<DataSourceEntryRow>(searchPageQuery(ctx.scope, query.search, query.page_size, this.offset(query))),
    ]);
    return this.response(query, {
      items: await this.toEntries(rows, ctx),
      total: counts.pinned + counts.folders + counts.data_sources,
      counts,
      folder: null,
    });
  }

  // Name + every listed environment in one transaction; each refusal names its environment.
  async saveAll(
    user: User,
    dataSourceId: string,
    dto: SaveAllDataSourceEnvironmentsDto,
    branchId?: string
  ): Promise<void> {
    const { organizationId } = user;
    const resolvedBranchId = await this.resolveBranchId(user, branchId);
    const dataSource = await this.dataSourcesUtilService.findUpdatable(dataSourceId, organizationId);
    const environmentNames = await this.environmentNames(organizationId, dto.environments);
    const multiEnvironment = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.MULTI_ENVIRONMENT,
      organizationId
    );
    if (!multiEnvironment && dto.environments.length !== 1) {
      throw new BadRequestException('Saving several environments at once needs multi-environment support');
    }
    if (dto.name) {
      await this.dataSourcesUtilService.ensureUniqueActiveNameForUpdate(
        dto.name,
        dataSourceId,
        organizationId,
        this.dataSource.manager,
        resolvedBranchId
      );
    }

    for (const environment of dto.environments) {
      await this.forEnvironment(environmentNames.get(environment.environment_id), async () => {
        await this.dataSourcesUtilService.validateNoConstantsOnDefaultBranch(
          resolvedBranchId,
          environment.options,
          organizationId
        );
        await assertDataSourceEditAllowed(this.gitSyncConfigsUtilService, this.appEnvironmentUtilService, {
          organizationId,
          dataSourceId,
          branchId: resolvedBranchId,
          environmentId: environment.environment_id,
          name: dto.name,
          options: environment.options,
        });
      });
    }

    try {
      await dbTransactionWrap(async (manager: EntityManager) => {
        for (const environment of dto.environments) {
          await this.forEnvironment(environmentNames.get(environment.environment_id), () =>
            this.dataSourcesUtilService.updateWithManager(
              manager,
              dataSource,
              organizationId,
              user.id,
              dto.name,
              environment.options,
              environment.environment_id,
              resolvedBranchId
            )
          );
        }
      });
    } finally {
      this.dataSourcesUtilService.clearCache();
    }

    for (const environment of dto.environments) this.emitUpdateAuditLogEntry(user, dataSource, dto, environment);
  }

  private async environmentNames(
    organizationId: string,
    environments: SaveDataSourceEnvironmentDto[]
  ): Promise<Map<string, string>> {
    const ids = environments.map((environment) => environment.environment_id);
    const rows: NameRow[] = await this.dataSource.query(
      `SELECT id, name FROM app_environments WHERE id = ANY($1::uuid[]) AND organization_id = $2`,
      [ids, organizationId]
    );
    if (rows.length !== ids.length) throw new NotFoundException('Environment not found');
    return new Map(rows.map((row) => [row.id, row.name]));
  }

  private async forEnvironment<T>(name: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (!(error instanceof HttpException)) throw error;
      throw new HttpException(`${name}: ${error.message}`, error.getStatus());
    }
  }

  // One DATA_SOURCE_UPDATE entry per environment, shaped like the v1 update's.
  private emitUpdateAuditLogEntry(
    user: User,
    dataSource: DataSourceEntity,
    dto: SaveAllDataSourceEnvironmentsDto,
    environment: SaveDataSourceEnvironmentDto
  ): void {
    const metadata = {
      ...(dto.name !== undefined && { name: dto.name }),
      options: redactEncryptedOptions(environment.options),
    };
    emitRequestAuditLogEntry(this.eventEmitter, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: dataSource.id,
      resourceName: dto.name,
      resourceData: {
        dataSourceKind: dataSource.kind,
        dataSourceScope: dataSource.scope,
        appId: dataSource.app?.id || null,
        appVersionId: dataSource.appVersionId,
        environmentId: environment.environment_id,
        updatedFields: Object.keys(metadata),
      },
      metadata,
      resourceType: MODULES.GLOBAL_DATA_SOURCE,
      actionType: FEATURES[MODULES.GLOBAL_DATA_SOURCE][FEATURE_KEY.UPDATE].auditLogsKey,
    });
  }

  private offset(query: ListDataSourcesV2QueryDto): number {
    return (query.page - 1) * query.page_size;
  }

  private run<T>(q: BuiltQuery): Promise<T[]> {
    return this.dataSource.query(q.sql, q.params);
  }

  private response(
    query: ListDataSourcesV2QueryDto,
    data: { items: DataSourceDashboardEntryDto[]; total: number; counts: Counts; folder: RefDto | null }
  ): ListDataSourcesV2ResponseDto {
    return Object.assign(new ListDataSourcesV2ResponseDto(), {
      ...data,
      page: query.page,
      pageSize: query.page_size,
    });
  }

  // Page first, then names for only those rows (≤ 2 × page_size ids per lookup).
  private async toEntries(rows: DataSourceEntryRow[], ctx: EntryContext): Promise<DataSourceDashboardEntryDto[]> {
    if (rows.length === 0) return [];
    const ids = (pick: (r: DataSourceEntryRow) => string | null) => [
      ...new Set(rows.map(pick).filter((id): id is string => !!id)),
    ];
    const { scope, permissions } = ctx;
    const [users, folders] = await Promise.all([
      this.names<UserNameRow>(
        `SELECT id, first_name, last_name FROM users WHERE id = ANY($1::uuid[])`,
        [...ids((r) => r.owner_id), ...ids((r) => r.modified_by_id)],
        displayName
      ),
      this.names<NameRow>(
        `SELECT id, name FROM folders WHERE id = ANY($1::uuid[])`,
        ids((r) => r.folder_id),
        (f) => f.name
      ),
    ]);
    const ref = (map: Map<string, string>, id: string | null): RefDto | null =>
      id && map.has(id) ? { id, name: map.get(id) } : null;
    return rows.map((r) => {
      const common = {
        kind: r.kind,
        id: r.id,
        name: r.name,
        lastModifiedAt: r.last_modified_at,
        modifiedBy: ref(users, r.modified_by_id),
        lastViewedAt: r.last_viewed_at,
        owner: ref(users, r.owner_id),
        pinned: r.pinned,
      };
      if (r.kind === 'folder') {
        return Object.assign(new DataSourceDashboardEntryDto(), {
          ...common,
          dataSourceCount: r.data_source_count,
          actions: folderActions(
            permissions,
            scope.userId,
            { id: r.id, ownerId: r.owner_id, hasDataSourcesOnAnyBranch: !!r.has_data_sources_on_any_branch },
            scope.git
          ),
        });
      }
      return Object.assign(new DataSourceDashboardEntryDto(), {
        ...common,
        dataSourceKind: r.data_source_kind,
        pluginId: r.plugin_id,
        folder: ref(folders, r.folder_id),
        actions: dataSourceActions(permissions, r.id),
      });
    });
  }

  private async names<R extends { id: string }>(
    sql: string,
    ids: string[],
    label: (row: R) => string
  ): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows: R[] = await this.dataSource.query(sql, [ids]);
    return new Map(rows.map((row) => [row.id, label(row)]));
  }
}
