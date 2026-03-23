import { Injectable } from '@nestjs/common';
import { Folder } from '@entities/folder.entity';
import { decamelizeKeys } from 'humps';
import { CreateDsFolderDto, UpdateDsFolderDto } from './dto';
import { IFolderDataSourcesService } from './interfaces/IService';
import { catchDbException } from '@helpers/utils.helper';
import { DeleteResult, EntityManager } from 'typeorm';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class FolderDataSourcesService implements IFolderDataSourcesService {
  async createFolder(user, createDsFolderDto: CreateDsFolderDto) {
    const folderName = createDsFolderDto.name;
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
              creatorId: user?.id,
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

  async renameFolder(user, id: string, updateDsFolderDto: UpdateDsFolderDto) {
    const folderName = updateDsFolderDto.name;
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
}
