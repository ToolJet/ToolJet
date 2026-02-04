import { Injectable, BadRequestException } from '@nestjs/common';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '../../entities/folder_app.entity';
import { AppGitSync } from '../../entities/app_git_sync.entity'
import { decamelizeKeys } from 'humps';
import { CreateFolderDto, UpdateFolderDto } from '@modules/folders/dto';
import { IFoldersService } from './interfaces/IService';
import { catchDbException } from '@helpers/utils.helper';
import { DeleteResult } from 'typeorm';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
@Injectable()
export class FoldersService implements IFoldersService {
  async createFolder(user, createFolderDto: CreateFolderDto) {
    const folderName = createFolderDto.name;
    const type = createFolderDto.type;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await catchDbException(async () => {
        return await manager.save(
          manager.create(Folder, {
            name: folderName,
            createdAt: new Date(),
            updatedAt: new Date(),
            organizationId: user?.organizationId,
            type,
          })
        );
      }, [
        {
          dbConstraint: DataBaseConstraints.FOLDER_NAME_UNIQUE,
          message: 'This folder name is already taken.',
        },
      ]);

      return decamelizeKeys(folder);
    });
  }
  async updateFolder(user, id, updateFolderDto: UpdateFolderDto) {
    const folderId = id;
    const folderName = updateFolderDto.name;
    return dbTransactionWrap(async (manager: EntityManager) => {

    const gitSyncedAppInFolder = await manager
      .createQueryBuilder(AppGitSync, 'ags')
      .innerJoin(FolderApp, 'fa', 'fa.app_id = ags.app_id')
      .where('fa.folder_id = :folderId', { folderId })
      .select('ags.id')
      .getOne();

    if (gitSyncedAppInFolder) {
      throw new BadRequestException(
        'Folders with git-synced apps cannot be edited'
      );
    }

      const folder = await catchDbException(async () => {
        return manager.update(Folder, { id: folderId }, { name: folderName });
      }, [
        {
          dbConstraint: DataBaseConstraints.FOLDER_NAME_UNIQUE,
          message: 'This folder name is already taken.',
        },
      ]);
      return decamelizeKeys(folder);
    });
  }
  async deleteFolder(user, id): Promise<DeleteResult> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await manager.findOneOrFail(Folder, {
        where: { id, organizationId: user.organizationId },
      });

    const gitSyncedAppInFolder = await manager
      .createQueryBuilder(AppGitSync, 'ags')
      .innerJoin(
        FolderApp,
        'fa',
        'fa.app_id = ags.app_id'
      )
      .where('fa.folder_id = :folderId', { folderId: folder.id })
      .select('ags.id')
      .getOne();

    if (gitSyncedAppInFolder) {
      throw new BadRequestException(
        "Folders with apps synced to git can't be deleted. Delete the git apps and try again."
      );
    }

      return manager.delete(Folder, { id: folder.id, organizationId: user.organizationId });
    });
  }
}
