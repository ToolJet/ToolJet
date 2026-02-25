import { Injectable } from '@nestjs/common';
import { Folder } from '@entities/folder.entity';
import { decamelizeKeys } from 'humps';
import { CreateFolderDto, UpdateFolderDto } from '@modules/folders/dto';
import { IFoldersService } from './interfaces/IService';
import { catchDbException } from '@helpers/utils.helper';
import { DeleteResult } from 'typeorm';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { FoldersUtilService } from './util.service';
@Injectable()
export class FoldersService implements IFoldersService {
  constructor(protected foldersUtilService: FoldersUtilService) {}
  async createFolder(user, createFolderDto: CreateFolderDto) {
    return this.foldersUtilService.createFolder(user, createFolderDto);
  }
  async updateFolder(user, id, updateFolderDto: UpdateFolderDto) {
    const folderId = id;
    const folderName = updateFolderDto.name;
    return dbTransactionWrap(async (manager: EntityManager) => {
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

      return manager.delete(Folder, { id: folder.id, organizationId: user.organizationId });
    });
  }
}
