import { HttpException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { App } from '@entities/app.entity';
import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { AppsRepository } from '@modules/apps/repository';
import { FoldersService } from '@modules/folders/service';
import { BulkDeleteService } from './bulk-delete.service';
import { DashboardService } from './dashboard.service';
import { BulkDeleteFoldersDto, BulkResultResponseDto, bulkResult } from './dto/bulk.dto';

type FolderPlan = { folder: Folder; toDelete: App[] };

// Not @Injectable: provided by a factory in apps/module.ts (edition-resolved FoldersService / AppsRepository).
export class BulkFolderDeleteService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DashboardService,
    private readonly foldersService: FoldersService,
    private readonly bulkDeleteService: BulkDeleteService,
    private readonly appsRepository: AppsRepository
  ) {}

  async delete(user: User, dto: BulkDeleteFoldersDto): Promise<BulkResultResponseDto> {
    const permissions = await this.dashboardService.permissions(user, dto.type);
    const withApps = dto.mode === 'folder_and_apps';

    const plans: FolderPlan[] = [];
    const blockedIds: string[] = [];
    for (const id of dto.folder_ids) {
      const folder = await this.dataSource.manager.findOne(Folder, {
        where: { id, organizationId: user.organizationId },
      });
      if (folder && folder.type === dto.type && (await this.passesFolderChecks(user, folder))) {
        plans.push({ folder, toDelete: [] });
      } else {
        blockedIds.push(id);
      }
    }

    if (withApps) {
      for (const plan of plans) {
        const rows: { app_id: string }[] = await this.dataSource.query(
          `SELECT DISTINCT app_id FROM folder_apps WHERE folder_id = $1`,
          [plan.folder.id]
        );
        for (const { app_id } of rows) {
          const app = await this.appsRepository.findById(app_id, user.organizationId, undefined, dto.branch_id);
          if (!app) continue;
          if (await this.bulkDeleteService.canDelete(user, permissions, dto.type, app, dto.branch_id)) {
            plan.toDelete.push(app);
          }
        }
      }
    }

    if (blockedIds.length) return bulkResult(blockedIds);

    const refused: string[] = [];
    for (const plan of plans) {
      for (const app of plan.toDelete) {
        await this.bulkDeleteService.deleteOne(app, user, dto.branch_id);
      }
      try {
        await this.foldersService.deleteFolder(user, plan.folder.id);
      } catch (error) {
        if (!(error instanceof HttpException)) throw error;
        refused.push(plan.folder.id);
      }
    }
    return bulkResult(refused);
  }

  private async passesFolderChecks(user: User, folder: Folder): Promise<boolean> {
    try {
      await this.foldersService.assertFolderDeletable(user, folder, this.dataSource.manager);
      return true;
    } catch (error) {
      if (error instanceof HttpException) return false;
      throw error;
    }
  }
}
