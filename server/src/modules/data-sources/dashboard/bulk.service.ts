import { HttpException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as requestIp from 'request-ip';
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';
import { UserPermissions } from '@modules/ability/types';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { MODULES } from '@modules/app/constants/modules';
import { FolderDataSourcesUtilService } from '@modules/folder-data-sources/util.service';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import type { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { assertGitSyncEditAllowedForOrg } from '@modules/git-sync-configs/guards/git-sync-edit-guard';
import { RequestContext } from '@modules/request-context/service';
import { DataSourcesService } from '../service';
import { DataSourceTypes, FEATURE_KEY } from '../constants';
import { FEATURES } from '../constants/feature';
import { canDeleteDataSource, canManageFolderDataSources } from './actions';
import { DataSourceDashboardScope, visibleIdsQuery } from './queries';
import { DataSourcesDashboardService } from './dashboard.service';
import {
  BulkDeleteDataSourcesDto,
  BulkMoveDataSourcesDto,
  BulkRemoveDataSourcesDto,
  BulkResultResponseDto,
  bulkResult,
} from './dto/bulk.dto';

export interface BulkDeleteContext {
  scope: DataSourceDashboardScope;
  permissions: UserPermissions;
}

type DeleteTargetRow = { id: string; type: string; is_synced: boolean | null; version_branch_id: string | null };

// Not @Injectable: provided by a factory in data-sources/module.ts (edition-resolved
// DataSourcesService / FolderDataSourcesUtilService / GitSyncConfigsUtilService).
export class DataSourcesBulkService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DataSourcesDashboardService,
    private readonly dataSourcesService: DataSourcesService,
    private readonly folderDataSourcesUtilService: FolderDataSourcesUtilService,
    private readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async delete(user: User, dto: BulkDeleteDataSourcesDto): Promise<BulkResultResponseDto> {
    const ctx = await this.dashboardService.resolveScope(user, dto.branch_id);
    const branchId = dto.branch_id && ctx.scope.branchId;
    const { allowed, blocked } = await this.splitDeletable(user, ctx, dto.data_source_ids, branchId);
    if (blocked.length) return bulkResult(blocked);
    const refused: string[] = [];
    for (const id of allowed) {
      if (!(await this.deleteOne(id, user, branchId))) refused.push(id);
    }
    return bulkResult(refused);
  }

  // Every bulk-delete check per id; the folder bulk delete reuses it for folder_and_data_sources.
  async splitDeletable(
    user: User,
    ctx: BulkDeleteContext,
    ids: string[],
    branchId?: string
  ): Promise<{ allowed: string[]; blocked: string[] }> {
    if (ids.length === 0) return { allowed: [], blocked: [] };
    const listed = await this.listedIds(ctx.scope, ids);
    const targets = await this.deleteTargets(
      ctx.scope,
      ids.filter((id) => listed.has(id))
    );
    const rows = new Map(targets.map((row) => [row.id, row]));
    const allowed: string[] = [];
    const blocked: string[] = [];
    for (const id of ids) {
      if (await this.canDelete(user, ctx, rows.get(id), branchId)) allowed.push(id);
      else blocked.push(id);
    }
    return { allowed, blocked };
  }

  // DataSourcesService.delete + its audit entry; false on an HttpException refusal. An absent
  // branch id is passed on as absent on purpose: without one, v1 delete removes the whole data source.
  async deleteOne(id: string, user: User, branchId?: string): Promise<boolean> {
    try {
      await this.dataSourcesService.delete(id, user, branchId);
      this.emitDeleteAuditLogEntry();
      return true;
    } catch (error) {
      if (!(error instanceof HttpException)) throw error;
      return false;
    }
  }

  async move(user: User, dto: BulkMoveDataSourcesDto): Promise<BulkResultResponseDto> {
    const { scope, permissions } = await this.dashboardService.resolveScope(user, dto.branch_id);
    await this.dashboardService.assertFolderWritable(user, dto.branch_id && scope.branchId);
    const [folder]: { id: string; owner_id: string | null }[] = await this.dataSource.query(
      `SELECT id, created_by AS owner_id FROM folders WHERE id = $1 AND organization_id = $2 AND type = $3`,
      [dto.folder_id, user.organizationId, DATA_SOURCE_FOLDER_TYPE]
    );
    const visibleQuery = folder && visibleIdsQuery(scope, { data_source: [], folder: [folder.id] });
    const visible = visibleQuery ? await this.dataSource.query(visibleQuery.sql, visibleQuery.params) : [];
    if (!visible.length) throw new NotFoundException('Folder not found');
    const found = await this.listedIds(scope, dto.data_source_ids);
    const permitted = canManageFolderDataSources(permissions, user.id, { id: folder.id, ownerId: folder.owner_id });
    const blockedIds = dto.data_source_ids.filter((id) => !found.has(id) || !permitted);
    if (blockedIds.length) return bulkResult(blockedIds);
    await this.folderDataSourcesUtilService.bulkCreate(folder.id, dto.data_source_ids, scope.branchId);
    return bulkResult([]);
  }

  async remove(user: User, dto: BulkRemoveDataSourcesDto): Promise<BulkResultResponseDto> {
    const { scope, permissions } = await this.dashboardService.resolveScope(user, dto.branch_id);
    await this.dashboardService.assertFolderWritable(user, dto.branch_id && scope.branchId);
    const rows: { id: string; folder_id: string | null; folder_owner_id: string | null }[] =
      await this.dataSource.query(
        `SELECT ds.id, f.id AS folder_id, f.created_by AS folder_owner_id
         FROM data_sources ds
         LEFT JOIN folder_data_sources fds ON fds.data_source_id = ds.id AND fds.branch_id = $3
         LEFT JOIN folders f ON f.id = fds.folder_id
         WHERE ds.id = ANY($1::uuid[]) AND ds.organization_id = $2`,
        [dto.data_source_ids, user.organizationId, scope.branchId]
      );
    const found = await this.listedIds(scope, dto.data_source_ids);
    const denied = new Set(
      rows
        .filter(
          (row) =>
            row.folder_id &&
            !canManageFolderDataSources(permissions, user.id, { id: row.folder_id, ownerId: row.folder_owner_id })
        )
        .map((row) => row.id)
    );
    const blockedIds = dto.data_source_ids.filter((id) => !found.has(id) || denied.has(id));
    if (blockedIds.length) return bulkResult(blockedIds);
    await this.folderDataSourcesUtilService.bulkRemove(dto.data_source_ids, scope.branchId);
    return bulkResult([]);
  }

  private async canDelete(
    user: User,
    ctx: BulkDeleteContext,
    row: DeleteTargetRow | undefined,
    branchId?: string
  ): Promise<boolean> {
    if (!row || row.type === DataSourceTypes.SAMPLE || !canDeleteDataSource(ctx.permissions)) return false;
    const linked = await this.dataSourcesService.findQueriesLinkedToDatasource(row.id, user.organizationId, branchId);
    if (linked.dependent_queries) return false;
    try {
      await assertGitSyncEditAllowedForOrg(
        this.gitSyncConfigsUtilService,
        user.organizationId,
        {
          branchId: ctx.scope.branchId,
          isSynced: row.version_branch_id === ctx.scope.branchId && !!row.is_synced,
          secretsOnly: false,
        },
        'data source'
      );
      return true;
    } catch (error) {
      if (error instanceof HttpException) return false;
      throw error;
    }
  }

  // The data source's row on the branch: its active row there, else (no row at all there) the
  // default branch's active row.
  private deleteTargets(scope: DataSourceDashboardScope, ids: string[]): Promise<DeleteTargetRow[]> {
    return this.dataSource.query(
      `SELECT ds.id, ds.type, dsv.is_synced, dsv.branch_id AS version_branch_id
       FROM data_sources ds
       LEFT JOIN LATERAL (
         SELECT v.is_synced, v.branch_id FROM data_source_versions v
         WHERE v.data_source_id = ds.id AND v.is_active AND (
           v.branch_id = $3
           OR (v.branch_id = $4 AND NOT EXISTS (
             SELECT 1 FROM data_source_versions v2 WHERE v2.data_source_id = ds.id AND v2.branch_id = $3
           ))
         )
         ORDER BY (v.branch_id = $3) DESC
         LIMIT 1
       ) dsv ON true
       WHERE ds.id = ANY($1::uuid[]) AND ds.organization_id = $2`,
      [ids, scope.organizationId, scope.branchId, scope.defaultBranchId]
    );
  }

  // Ids the list shows an admin on the branch (global, not sample, not static); anything else is blocked.
  private async listedIds(scope: DataSourceDashboardScope, ids: string[]): Promise<Set<string>> {
    const query = visibleIdsQuery({ ...scope, visibleDataSourceIds: null }, { data_source: ids, folder: [] });
    const rows: { id: string }[] = await this.dataSource.query(query.sql, query.params);
    return new Set(rows.map((row) => row.id));
  }

  // dataSourcesService.delete sets one audit-log local per call, read once by the response
  // interceptor at the end of the request; emit and clear it here so each data source gets its entry.
  private emitDeleteAuditLogEntry(): void {
    const context = RequestContext.currentContext;
    const logsData = context?.res?.locals?.[AUDIT_LOGS_REQUEST_CONTEXT_KEY];
    if (!logsData?.userId) return;

    this.eventEmitter.emit('auditLogEntry', {
      ...logsData,
      ipAddress: requestIp.getClientIp(context.req),
      userAgent: context.req?.headers['user-agent'],
      resourceType: MODULES.GLOBAL_DATA_SOURCE,
      actionType: FEATURES[MODULES.GLOBAL_DATA_SOURCE][FEATURE_KEY.DELETE].auditLogsKey,
    });

    delete context.res.locals[AUDIT_LOGS_REQUEST_CONTEXT_KEY];
  }
}
