import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { AppsUtilService } from '@modules/apps/util.service';
import { FOLDER_RESOURCE_TYPE_BY_APP_TYPE } from '@modules/folder-apps/ability';
import { getPermissionResourceForAppType } from '@modules/folder-apps/util.service';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { appActions, folderActions, resolveFolderAccess } from './actions';
import {
  BuiltQuery,
  DashboardScope,
  EntryRow,
  folderHeaderQuery,
  folderPageQuery,
  rootCountsQuery,
  rootPageQuery,
  searchCountsQuery,
  searchPageQuery,
} from './queries';
import { DashboardEntryDto, ListAppsV2QueryDto, ListAppsV2ResponseDto, RefDto } from './dto/list.dto';

type Counts = { pinned: number; folders: number; apps: number };

type UserNameRow = { id: string; first_name: string | null; last_name: string | null };
type NameRow = { id: string; name: string };

const displayName = (u: UserNameRow) => [u.first_name, u.last_name].filter(Boolean).join(' ');

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly abilityService: AbilityService,
    private readonly appsUtilService: AppsUtilService,
    private readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService
  ) {}

  // The single permission resolve for the request; every query below reads from the scope.
  async resolveScope(
    user: User,
    type: APP_TYPES,
    branchId?: string
  ): Promise<{ scope: DashboardScope; permissions: UserPermissions }> {
    const folderResource = FOLDER_RESOURCE_TYPE_BY_APP_TYPE[type] ?? MODULES.FOLDER;
    const permissions = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: getPermissionResourceForAppType(type) }, { resource: folderResource }],
      organizationId: user.organizationId,
    });
    const git = await this.gitSyncConfigsUtilService.getDetails(user.organizationId);
    const resolvedBranchId = branchId ?? git.options.defaultBranch.id;
    const visibleAppIds = await this.appsUtilService.findVisibleAppIds(
      user,
      type,
      permissions,
      this.dataSource.manager
    );
    const scope: DashboardScope = {
      organizationId: user.organizationId,
      userId: user.id,
      type,
      branchId: resolvedBranchId,
      visibleAppIds,
      // End users see only released items, every type (2026-10-07).
      releasedOnly: permissions.isEndUser,
      activityColumn: permissions.isEndUser ? 'last_viewed_at' : 'last_edited_at',
      folderAccess: resolveFolderAccess(permissions, type, user.id),
      git: {
        enabled: git.isEnabled,
        multiBranch: git.isMultiBranchingEnabled,
        onDefaultBranch: resolvedBranchId === git.options.defaultBranch.id,
      },
    };
    return { scope, permissions };
  }

  async list(user: User, query: ListAppsV2QueryDto): Promise<ListAppsV2ResponseDto> {
    const { scope, permissions } = await this.resolveScope(user, query.type, query.branch_id);
    const ctx = { scope, permissions };
    if (query.search) return this.search(ctx, query);
    if (query.folder_id) return this.folder(ctx, query);
    return this.root(ctx, query);
  }

  private async root(ctx: EntryContext, query: ListAppsV2QueryDto): Promise<ListAppsV2ResponseDto> {
    const [[counts], rows] = await Promise.all([
      this.run<Counts>(rootCountsQuery(ctx.scope)),
      this.run<EntryRow>(rootPageQuery(ctx.scope, query.page_size, this.offset(query))),
    ]);
    return this.response(query, {
      items: await this.toEntries(rows, ctx),
      total: counts.pinned + counts.folders + counts.apps,
      counts,
      folder: null,
    });
  }

  private async folder(ctx: EntryContext, query: ListAppsV2QueryDto): Promise<ListAppsV2ResponseDto> {
    const [[header], rows] = await Promise.all([
      this.run<{ id: string; name: string; total: number; pinned: number }>(
        folderHeaderQuery(ctx.scope, query.folder_id)
      ),
      this.run<EntryRow>(folderPageQuery(ctx.scope, query.folder_id, query.page_size, this.offset(query))),
    ]);
    if (!header) throw new NotFoundException('Folder not found');
    return this.response(query, {
      items: await this.toEntries(rows, ctx),
      total: header.total,
      counts: { pinned: header.pinned, folders: 0, apps: header.total - header.pinned },
      folder: { id: header.id, name: header.name },
    });
  }

  private async search(ctx: EntryContext, query: ListAppsV2QueryDto): Promise<ListAppsV2ResponseDto> {
    const [[counts], rows] = await Promise.all([
      this.run<Counts>(searchCountsQuery(ctx.scope, query.search)),
      this.run<EntryRow>(searchPageQuery(ctx.scope, query.search, query.page_size, this.offset(query))),
    ]);
    return this.response(query, {
      items: await this.toEntries(rows, ctx),
      total: counts.pinned + counts.folders + counts.apps,
      counts,
      folder: null,
    });
  }

  private offset(query: ListAppsV2QueryDto): number {
    return (query.page - 1) * query.page_size;
  }

  private run<T>(q: BuiltQuery): Promise<T[]> {
    return this.dataSource.query(q.sql, q.params);
  }

  private response(
    query: ListAppsV2QueryDto,
    data: { items: DashboardEntryDto[]; total: number; counts: Counts; folder: RefDto | null }
  ): ListAppsV2ResponseDto {
    return Object.assign(new ListAppsV2ResponseDto(), { ...data, page: query.page, pageSize: query.page_size });
  }

  // Page first, then names for only those rows (≤ 2 × page_size ids per lookup).
  private async toEntries(rows: EntryRow[], ctx: EntryContext): Promise<DashboardEntryDto[]> {
    if (rows.length === 0) return [];
    const ids = (pick: (r: EntryRow) => string | null) => [
      ...new Set(rows.map(pick).filter((id): id is string => !!id)),
    ];
    const [users, versions, folders] = await Promise.all([
      this.names<UserNameRow>(
        `SELECT id, first_name, last_name FROM users WHERE id = ANY($1::uuid[])`,
        [...ids((r) => r.owner_id), ...ids((r) => r.modified_by_id)],
        displayName
      ),
      this.names<NameRow>(
        `SELECT id, name FROM app_versions WHERE id = ANY($1::uuid[])`,
        ids((r) => r.current_version_id),
        (v) => v.name
      ),
      this.names<NameRow>(
        `SELECT id, name FROM folders WHERE id = ANY($1::uuid[])`,
        ids((r) => r.folder_id),
        (f) => f.name
      ),
    ]);
    const ref = (map: Map<string, string>, id: string | null): RefDto | null =>
      id && map.has(id) ? { id, name: map.get(id) } : null;
    const { scope, permissions } = ctx;
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
        return Object.assign(new DashboardEntryDto(), {
          ...common,
          appCount: r.app_count,
          actions: folderActions(
            permissions,
            scope.type,
            scope.userId,
            { id: r.id, ownerId: r.owner_id, appCount: r.app_count },
            scope.git
          ),
        });
      }
      return Object.assign(new DashboardEntryDto(), {
        ...common,
        slug: r.slug,
        icon: r.icon,
        folder: ref(folders, r.folder_id),
        releasedVersion: r.current_version_id ? (versions.get(r.current_version_id) ?? null) : null,
        actions: appActions(permissions, scope.type, scope.userId, {
          id: r.id,
          ownerId: r.owner_id,
          folderId: r.folder_id,
          currentVersionId: r.current_version_id,
          isMaintenanceOn: !!r.is_maintenance_on,
        }),
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

interface EntryContext {
  scope: DashboardScope;
  permissions: UserPermissions;
}
