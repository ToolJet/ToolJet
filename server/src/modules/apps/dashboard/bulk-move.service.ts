import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { FolderAppsUtilService } from '@modules/folder-apps/util.service';
import { canMoveApp, canRemoveApp } from './actions';
import { DashboardService } from './dashboard.service';
import { BulkMoveAppsDto, BulkRemoveAppsDto, BulkResultResponseDto, bulkResult } from './dto/bulk.dto';

// Not @Injectable: provided by a factory in apps/module.ts (edition-resolved FolderAppsUtilService).
export class BulkMoveService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DashboardService,
    private readonly folderAppsUtilService: FolderAppsUtilService
  ) {}

  async move(user: User, dto: BulkMoveAppsDto): Promise<BulkResultResponseDto> {
    await this.dashboardService.assertFolderWritable(user, dto.branch_id);
    const [folder]: { id: string; type: APP_TYPES; owner_id: string | null }[] = await this.dataSource.query(
      `SELECT id, type, created_by AS owner_id FROM folders WHERE id = $1 AND organization_id = $2`,
      [dto.folder_id, user.organizationId]
    );
    if (!folder) throw new NotFoundException('Folder not found');
    const apps: { id: string; type: APP_TYPES; owner_id: string }[] = await this.dataSource.query(
      `SELECT id, type, user_id AS owner_id FROM apps WHERE id = ANY($1::uuid[]) AND organization_id = $2`,
      [dto.app_ids, user.organizationId]
    );
    const permissions = await this.dashboardService.permissions(user, folder.type);
    const target = { id: folder.id, type: folder.type, ownerId: folder.owner_id };
    const allowed = new Set(
      apps
        .filter((app) => canMoveApp(permissions, user.id, target, { type: app.type, ownerId: app.owner_id }))
        .map((app) => app.id)
    );
    const allowedIds = dto.app_ids.filter((id) => allowed.has(id));
    const blockedIds = dto.app_ids.filter((id) => !allowed.has(id));
    if (blockedIds.length) return bulkResult(blockedIds);
    const branchId = await this.dashboardService.resolveBranchId(user, dto.branch_id);
    await this.folderAppsUtilService.bulkCreate(folder.id, allowedIds, branchId, !dto.branch_id);
    return bulkResult([]);
  }

  async remove(user: User, dto: BulkRemoveAppsDto): Promise<BulkResultResponseDto> {
    await this.dashboardService.assertFolderWritable(user, dto.branch_id);
    const branchId = await this.dashboardService.resolveBranchId(user, dto.branch_id);
    const rows: {
      id: string;
      type: APP_TYPES;
      folder_id: string | null;
      folder_type: APP_TYPES;
      folder_owner_id: string | null;
    }[] = await this.dataSource.query(
      `SELECT a.id, a.type, f.id AS folder_id, f.type AS folder_type, f.created_by AS folder_owner_id
       FROM apps a
       LEFT JOIN folder_apps fa ON fa.app_id = a.id AND fa.branch_id = $3
       LEFT JOIN folders f ON f.id = fa.folder_id
       WHERE a.id = ANY($1::uuid[]) AND a.organization_id = $2`,
      [dto.app_ids, user.organizationId, branchId]
    );
    const permissions = await this.dashboardService.permissions(user, dto.type);
    const canRemove = (row: (typeof rows)[number]) =>
      row.type === dto.type &&
      (!row.folder_id ||
        canRemoveApp(
          permissions,
          user.id,
          { id: row.folder_id, type: row.folder_type, ownerId: row.folder_owner_id },
          { type: row.type }
        ));
    const found = new Set(rows.map((row) => row.id));
    const denied = new Set(rows.filter((row) => !canRemove(row)).map((row) => row.id));
    const blockedIds = dto.app_ids.filter((id) => !found.has(id) || denied.has(id));
    if (blockedIds.length) return bulkResult(blockedIds);
    await this.folderAppsUtilService.bulkRemove(dto.app_ids, branchId);
    return bulkResult([]);
  }
}
