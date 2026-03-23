import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Folder } from '@entities/folder.entity';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class FolderDataSourcesUtilService {
  async allFoldersWithDsCount(organizationId: string, searchKey?: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      let query = manager
        .createQueryBuilder(Folder, 'folders')
        .leftJoin('folders.folderDataSources', 'fds')
        .addSelect('COUNT(fds.id)', 'ds_count')
        .where('folders.organizationId = :organizationId', { organizationId })
        .andWhere('folders.type = :type', { type: 'data_source' })
        .groupBy('folders.id')
        .orderBy('folders.name', 'ASC');

      if (searchKey) {
        query = query.andWhere('folders.name ILIKE :search', { search: `%${searchKey}%` });
      }

      const rawResults = await query.getRawAndEntities();
      return rawResults.entities.map((folder, i) => ({
        ...folder,
        count: parseInt(rawResults.raw[i].ds_count, 10) || 0,
      }));
    });
  }

  async getDataSourcesForFolder(folderId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const folderDataSources = await manager.find(FolderDataSource, {
        where: { folderId },
        relations: ['dataSource'],
      });
      return folderDataSources.map((fds) => fds.dataSource);
    });
  }
}
