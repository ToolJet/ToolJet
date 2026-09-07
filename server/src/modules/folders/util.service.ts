import { Injectable } from '@nestjs/common';
import { EntityManager, In, SelectQueryBuilder } from 'typeorm';
import { User } from '@entities/user.entity';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { IFoldersUtilService } from './interfaces/IUtilService';
import { CreateFolderDto } from './dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { catchDbException } from '@helpers/utils.helper';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { decamelizeKeys } from 'humps';
@Injectable()
export class FoldersUtilService implements IFoldersUtilService {
  constructor() {}
  async allFolders(user: User, manager: EntityManager, type = 'front-end'): Promise<Folder[]> {
    return this.getAllFoldersQuery(user.organizationId, manager, type).getMany();
  }
  async findOne(folderId: string, manager: EntityManager): Promise<Folder> {
    return await manager.findOneOrFail(Folder, { where: { id: folderId } });
  }

  // Returns the names of every branch that has at least one app in this folder,
  // so the delete-blocked error can tell the user exactly where to look.
  async findBranchNamesWithApps(folderId: string, manager: EntityManager): Promise<string[]> {
    const rows = await manager
      .createQueryBuilder(FolderApp, 'folder_apps')
      .select('DISTINCT folder_apps.branchId', 'branchId')
      .where('folder_apps.folderId = :folderId', { folderId })
      .andWhere('folder_apps.branchId IS NOT NULL')
      .getRawMany();
    const branchIds = rows.map((row) => row.branchId).filter(Boolean);
    if (branchIds.length === 0) return [];

    const branches = await manager.find(WorkspaceBranch, {
      where: { id: In(branchIds) },
      select: ['name'],
    });
    return branches.map((branch) => branch.name);
  }

  async findByName(folderName: string, organizationId: string): Promise<Folder> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(Folder, { where: { name: folderName, organizationId } });
    });
  }

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
            createdBy: user?.id,
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

  private getAllFoldersQuery(
    organizationId: string,
    manager: EntityManager,
    type = 'front-end'
  ): SelectQueryBuilder<Folder> {
    const query = manager.createQueryBuilder(Folder, 'folders');
    query
      .andWhere('folders.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere('folders.type = :type', {
        type,
      })
      .orderBy('folders.name', 'ASC');

    return query;
  }
}
