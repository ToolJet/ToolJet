import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { FolderAppsUtilService } from '@modules/folder-apps/util.service';
import { canMoveApp } from './actions';
import { DashboardService } from './dashboard.service';
import { BulkMoveAppsDto, BulkResultResponseDto, bulkResult } from './dto/bulk.dto';

// Not @Injectable: provided by a factory in apps/module.ts (edition-resolved FolderAppsUtilService).
export class BulkMoveService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DashboardService,
    private readonly folderAppsUtilService: FolderAppsUtilService
  ) {}

  async move(user: User, dto: BulkMoveAppsDto): Promise<BulkResultResponseDto> {
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
    const result = bulkResult(
      dto,
      allowedIds,
      dto.app_ids.filter((id) => !allowed.has(id))
    );
    if (result.applied && allowedIds.length > 0) {
      const branchId = await this.dashboardService.resolveBranchId(user, dto.branch_id);
      await this.folderAppsUtilService.bulkCreate(folder.id, allowedIds, branchId, !dto.branch_id);
    }
    return result;
  }
}
