import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';
import type { AbilityService } from '@modules/ability/interfaces/IService';
import { UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { skipAppEditingVersionHydration } from '@modules/apps/subscribers/apps.subscriber';
import type { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
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
    private readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService
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

  async resolveBranchId(user: User, branchId?: string): Promise<string> {
    return branchId ?? (await this.gitSyncConfigsUtilService.getDetails(user.organizationId)).options.defaultBranch.id;
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
