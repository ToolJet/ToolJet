import { HttpException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import { FoldersService } from '@modules/folders/service';
import { DataSourcesBulkService } from './bulk.service';
import { DataSourcesDashboardService } from './dashboard.service';
import { BulkDeleteDataSourceFoldersDto, BulkResultResponseDto, bulkResult } from './dto/bulk.dto';

type FolderPlan = { folder: Folder; toDelete: string[] };

// Not @Injectable: provided by a factory in data-sources/module.ts (edition-resolved FoldersService).
export class DataSourcesBulkFolderDeleteService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DataSourcesDashboardService,
    private readonly foldersService: FoldersService,
    private readonly bulkService: DataSourcesBulkService
  ) {}

  async delete(user: User, dto: BulkDeleteDataSourceFoldersDto): Promise<BulkResultResponseDto> {
    const ctx = await this.dashboardService.resolveScope(user, dto.branch_id);
    const branchId = dto.branch_id && ctx.scope.branchId;
    const withDataSources = dto.mode === 'folder_and_data_sources';

    const plans: FolderPlan[] = [];
    const blockedIds: string[] = [];
    for (const id of dto.folder_ids) {
      const folder = await this.dataSource.manager.findOne(Folder, {
        where: { id, organizationId: user.organizationId },
      });
      if (folder && folder.type === DATA_SOURCE_FOLDER_TYPE && (await this.passesFolderChecks(user, folder))) {
        plans.push({ folder, toDelete: [] });
      } else {
        blockedIds.push(id);
      }
    }

    // Data sources failing a delete check stay and go to root with the folder; they never block it.
    if (withDataSources) {
      for (const plan of plans) {
        const rows: { data_source_id: string }[] = await this.dataSource.query(
          `SELECT data_source_id FROM folder_data_sources WHERE folder_id = $1 AND branch_id = $2`,
          [plan.folder.id, ctx.scope.branchId]
        );
        const ids = rows.map((row) => row.data_source_id);
        plan.toDelete = (await this.bulkService.splitDeletable(user, ctx, ids, branchId)).allowed;
      }
    }

    if (blockedIds.length) return bulkResult(blockedIds);

    const refused: string[] = [];
    for (const plan of plans) {
      for (const id of plan.toDelete) {
        await this.bulkService.deleteOne(id, user, branchId);
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
