import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Folder } from '@entities/folder.entity';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { DataSource } from '@entities/data_source.entity';
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

  async allFoldersWithDataSources(organizationId: string, searchKey?: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // Query 1: All folders for the org
      const folders = await manager.find(Folder, {
        where: { organizationId, type: 'data_source' },
        order: { name: 'ASC' },
      });

      const folderIds = folders.map((f) => f.id);

      // Query 2: All FolderDataSource rows with dataSource relation
      let folderDataSources: FolderDataSource[] = [];
      if (folderIds.length > 0) {
        folderDataSources = await manager.find(FolderDataSource, {
          where: folderIds.map((folderId) => ({ folderId })),
          relations: ['dataSource'],
        });
      }

      // Query 3: Ungrouped global DS
      let ungroupedQuery = manager
        .createQueryBuilder(DataSource, 'ds')
        .where('ds.scope = :scope', { scope: 'global' })
        .andWhere('ds.organizationId = :organizationId', { organizationId });

      if (folderIds.length > 0) {
        ungroupedQuery = ungroupedQuery.andWhere(
          'ds.id NOT IN (SELECT dsf.data_source_id FROM folder_data_sources dsf WHERE dsf.folder_id IN (:...folderIds))',
          { folderIds }
        );
      }

      const ungroupedDataSources = await ungroupedQuery.orderBy('ds.name', 'ASC').getMany();

      // Group by folder
      const dsByFolder = new Map<string, DataSource[]>();
      for (const fds of folderDataSources) {
        if (!fds.dataSource) continue;
        const arr = dsByFolder.get(fds.folderId) || [];
        arr.push(fds.dataSource);
        dsByFolder.set(fds.folderId, arr);
      }

      // Sort DS within each folder alphabetically
      for (const [, dataSources] of dsByFolder) {
        dataSources.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Build folder objects
      let result = folders.map((folder) => {
        const dataSources = dsByFolder.get(folder.id) || [];
        return {
          ...folder,
          count: dataSources.length,
          data_sources: dataSources,
        };
      });

      // Build ungrouped bucket
      let ungroupedBucket = {
        id: null as string | null,
        name: 'Ungrouped',
        count: ungroupedDataSources.length,
        data_sources: ungroupedDataSources,
      };

      // Apply search filter
      if (searchKey) {
        const search = searchKey.toLowerCase();
        result = result
          .map((folder) => {
            const folderNameMatches = folder.name.toLowerCase().includes(search);
            if (folderNameMatches) {
              return folder; // Include all DS
            }
            const matchingDs = folder.data_sources.filter((ds) => ds.name.toLowerCase().includes(search));
            if (matchingDs.length > 0) {
              return { ...folder, count: matchingDs.length, data_sources: matchingDs };
            }
            return null;
          })
          .filter(Boolean);

        ungroupedBucket = {
          ...ungroupedBucket,
          data_sources: ungroupedBucket.data_sources.filter((ds) => ds.name.toLowerCase().includes(search)),
          count: 0,
        };
        ungroupedBucket.count = ungroupedBucket.data_sources.length;
      }

      return [...result, ungroupedBucket];
    });
  }

  async getDataSourcesForFolder(folderId: string, page = 1, perPage = 25) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const [folderDataSources, totalCount] = await manager.findAndCount(FolderDataSource, {
        where: { folderId },
        relations: ['dataSource'],
        take: perPage,
        skip: (page - 1) * perPage,
      });
      return {
        data_sources: folderDataSources.map((fds) => fds.dataSource),
        meta: {
          total_count: totalCount,
          total_pages: Math.ceil(totalCount / perPage),
          current_page: page,
          per_page: perPage,
        },
      };
    });
  }
}
