import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Folder } from '@entities/folder.entity';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { DataSource } from '@entities/data_source.entity';
import { decamelizeKeys } from 'humps';
import { AddDataSourceToFolderDto, BulkMoveDataSourcesDto, CreateFolderDataSourceDto, UpdateFolderDataSourceDto } from './dto';
import { IFolderDataSourcesService } from './interfaces/IService';
import { catchDbException } from '@helpers/utils.helper';
import { DeleteResult, EntityManager, In } from 'typeorm';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { FolderDataSourcesUtilService } from './util.service';

@Injectable()
export class FolderDataSourcesService implements IFolderDataSourcesService {
  constructor(protected folderDataSourcesUtilService: FolderDataSourcesUtilService) {}
  async createFolder(user, dto: CreateFolderDataSourceDto) {
    const folderName = dto.name;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await catchDbException(
        async () => {
          return await manager.save(
            manager.create(Folder, {
              name: folderName,
              type: 'data_source',
              createdAt: new Date(),
              updatedAt: new Date(),
              organizationId: user?.organizationId,
              createdBy: user?.id,
            })
          );
        },
        [
          {
            dbConstraint: DataBaseConstraints.FOLDER_NAME_UNIQUE,
            message: 'This folder name is already taken.',
          },
        ]
      );

      return decamelizeKeys(folder);
    });
  }

  async renameFolder(user, id: string, dto: UpdateFolderDataSourceDto) {
    const folderName = dto.name;
    return dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await catchDbException(
        async () => {
          return manager.update(
            Folder,
            { id, organizationId: user.organizationId, type: 'data_source' },
            { name: folderName }
          );
        },
        [
          {
            dbConstraint: DataBaseConstraints.FOLDER_NAME_UNIQUE,
            message: 'This folder name is already taken.',
          },
        ]
      );
      return decamelizeKeys(folder);
    });
  }

  async deleteFolder(user, id: string): Promise<DeleteResult> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await manager.findOneOrFail(Folder, {
        where: { id, organizationId: user.organizationId, type: 'data_source' },
      });
      return manager.delete(Folder, { id: folder.id, organizationId: user.organizationId });
    });
  }

  async addDataSourceToFolder(user, folderId: string, dto: AddDataSourceToFolderDto) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.findOneOrFail(Folder, {
        where: { id: folderId, organizationId: user.organizationId, type: 'data_source' },
      });

      const dataSource = await manager.findOne(DataSource, {
        where: { id: dto.dataSourceId, organizationId: user.organizationId },
      });

      if (!dataSource) {
        throw new NotFoundException('Data source not found');
      }

      if (dataSource.scope !== 'global') {
        throw new BadRequestException('Only global-scope data sources can be added to folders');
      }

      // A data source can belong to at most one folder
      await manager.delete(FolderDataSource, { dataSourceId: dto.dataSourceId });

      const folderDs = manager.create(FolderDataSource, {
        folderId,
        dataSourceId: dto.dataSourceId,
      });
      const saved = await manager.save(folderDs);
      return decamelizeKeys(saved);
    });
  }

  async removeDataSourceFromFolder(user, folderId: string, dataSourceId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.findOneOrFail(Folder, {
        where: { id: folderId, organizationId: user.organizationId, type: 'data_source' },
      });

      const result = await manager.delete(FolderDataSource, { folderId, dataSourceId });

      if (result.affected === 0) {
        throw new NotFoundException('Data source not found in this folder');
      }

      return result;
    });
  }

  async bulkMoveDataSources(user, folderId: string, dto: BulkMoveDataSourcesDto) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.findOneOrFail(Folder, {
        where: { id: folderId, organizationId: user.organizationId, type: 'data_source' },
      });

      const dataSources = await manager.find(DataSource, {
        where: { id: In(dto.dataSourceIds), organizationId: user.organizationId },
      });

      if (dataSources.length !== dto.dataSourceIds.length) {
        throw new NotFoundException('One or more data sources not found');
      }

      const nonGlobal = dataSources.filter((ds) => ds.scope !== 'global');
      if (nonGlobal.length > 0) {
        throw new BadRequestException('Only global-scope data sources can be added to folders');
      }

      await manager.delete(FolderDataSource, { dataSourceId: In(dto.dataSourceIds) });

      const folderDataSources = dto.dataSourceIds.map((dsId) =>
        manager.create(FolderDataSource, {
          folderId,
          dataSourceId: dsId,
        })
      );
      const saved = await manager.save(folderDataSources);
      return decamelizeKeys(saved);
    });
  }

  async getFolders(user: any, searchKey?: string, includeDataSources?: boolean) {
    if (includeDataSources) {
      return this.folderDataSourcesUtilService.allFoldersWithDataSources(user.organizationId, searchKey);
    }
    return this.folderDataSourcesUtilService.allFoldersWithDsCount(user.organizationId, searchKey);
  }

  async getDataSourcesInFolder(user: any, folderId: string, page = 1, perPage = 25) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.findOneOrFail(Folder, {
        where: { id: folderId, organizationId: user.organizationId, type: 'data_source' },
      });
    });
    return this.folderDataSourcesUtilService.getDataSourcesForFolder(folderId, page, perPage);
  }
}
