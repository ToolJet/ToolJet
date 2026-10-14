import { HttpException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { App } from '@entities/app.entity';
import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { AppsRepository } from '@modules/apps/repository';
import { FoldersService } from '@modules/folders/service';
import { BulkDeleteService } from './bulk-delete.service';
import { DashboardService } from './dashboard.service';
import { AppRefDto, BulkDeleteFoldersDto, BulkDeleteFoldersResponseDto, bulkResult } from './dto/bulk.dto';

type FolderPlan = { folder: Folder; toDelete: App[]; toRoot: App[] };

// Not @Injectable: provided by a factory in apps/module.ts (edition-resolved FoldersService / AppsRepository).
export class BulkFolderDeleteService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DashboardService,
    private readonly foldersService: FoldersService,
    private readonly bulkDeleteService: BulkDeleteService,
    private readonly appsRepository: AppsRepository
  ) {}

  async delete(user: User, dto: BulkDeleteFoldersDto): Promise<BulkDeleteFoldersResponseDto> {
    const permissions = await this.dashboardService.permissions(user, dto.type);
    const branchId = await this.dashboardService.resolveBranchId(user, dto.branch_id);
    const withApps = dto.mode === 'folder_and_apps';

    const plans: FolderPlan[] = [];
    const blockedIds: string[] = [];
    for (const id of dto.folder_ids) {
      const folder = await this.dataSource.manager.findOne(Folder, {
        where: { id, organizationId: user.organizationId },
      });
      if (folder && folder.type === dto.type && (await this.passesFolderChecks(user, folder))) {
        plans.push({ folder, toDelete: [], toRoot: [] });
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
          } else {
            plan.toRoot.push(app);
          }
        }
      }
    }

    const base = bulkResult(
      dto,
      plans.map((plan) => plan.folder.id),
      blockedIds
    );
    const result = Object.assign(new BulkDeleteFoldersResponseDto(), base, { appsToRoot: [], hiddenAppsToRoot: 0 });

    if (!result.applied) {
      const visible = await this.visibleAppIds(user, dto.type, branchId, plans);
      for (const plan of plans) this.addToRoot(result, plan.toRoot, visible);
      return result;
    }

    let done = 0;
    const deleted: FolderPlan[] = [];
    for (const plan of plans) {
      for (const app of plan.toDelete) {
        if (!(await this.bulkDeleteService.deleteOne(app, user, dto.branch_id))) plan.toRoot.push(app);
      }
      try {
        await this.foldersService.deleteFolder(user, plan.folder.id);
        deleted.push(plan);
        done++;
      } catch (error) {
        if (!(error instanceof HttpException)) throw error;
        result.blockedIds.push(plan.folder.id);
        result.counts.allowed--;
        result.counts.blocked++;
      }
    }
    result.counts.done = done;
    const visible = await this.visibleAppIds(user, dto.type, branchId, deleted);
    for (const plan of deleted) this.addToRoot(result, plan.toRoot, visible);
    return result;
  }

  private visibleAppIds(user: User, type: BulkDeleteFoldersDto['type'], branchId: string, plans: FolderPlan[]) {
    const app = plans.flatMap((plan) => plan.toRoot.map((a) => a.id));
    return this.dashboardService.visibleIds(user, type, branchId, { app, folder: [] });
  }

  private addToRoot(result: BulkDeleteFoldersResponseDto, apps: App[], visible: Set<string>): void {
    for (const app of apps) {
      if (visible.has(app.id)) result.appsToRoot.push(Object.assign(new AppRefDto(), { id: app.id, name: app.name }));
      else result.hiddenAppsToRoot++;
    }
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
