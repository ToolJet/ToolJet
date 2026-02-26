import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '../../entities/folder_app.entity';
import { AppGitSync } from '../../entities/app_git_sync.entity';
import { decamelizeKeys } from 'humps';
import { CreateFolderDto, UpdateFolderDto } from '@modules/folders/dto';
import { IFoldersService } from './interfaces/IService';
import { catchDbException } from '@helpers/utils.helper';
import { DeleteResult } from 'typeorm';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { FoldersUtilService } from './util.service';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { MODULES } from '@modules/app/constants/modules';
@Injectable()
export class FoldersService implements IFoldersService {
  constructor(
    protected foldersUtilService: FoldersUtilService,
    protected abilityService: AbilityService
  ) {}
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
            createdBy: user?.id, // Set the creator
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
      // Load the folder to check ownership and validate org
      const folder = await manager.findOneOrFail(Folder, {
        where: { id: folderId, organizationId: user.organizationId },
      });

      // Check if user has permission to rename this folder
      await this.checkFolderUpdatePermission(user, folder, manager);

      const gitSyncedAppInFolder = await manager
        .createQueryBuilder(AppGitSync, 'ags')
        .innerJoin(FolderApp, 'fa', 'fa.app_id = ags.app_id')
        .where('fa.folder_id = :folderId', { folderId })
        .select('ags.id')
        .getOne();

      if (gitSyncedAppInFolder) {
        throw new BadRequestException('Folders with git-synced apps cannot be edited');
      }

      const result = await catchDbException(async () => {
        return manager.update(Folder, { id: folderId }, { name: folderName });
      }, [
        {
          dbConstraint: DataBaseConstraints.FOLDER_NAME_UNIQUE,
          message: 'This folder name is already taken.',
        },
      ]);
      return decamelizeKeys(result);
    });
  }

  /**
   * Check if the user has permission to rename/update this folder.
   * Requires: admin, OR granular canEditFolder for this folder, OR folder ownership with folderCreate.
   */
  protected async checkFolderUpdatePermission(user, folder: Folder, manager: EntityManager): Promise<void> {
    const userPermissions = await this.abilityService.resourceActionsPermission(
      user,
      {
        resources: [{ resource: MODULES.FOLDER }],
        organizationId: user.organizationId,
      },
      manager
    );

    // Admins/SuperAdmins can always rename
    if (userPermissions.isAdmin || userPermissions.isSuperAdmin) {
      return;
    }

    // Folder owner can rename their own folders (if they have folderCreate)
    if (folder.createdBy === user.id && userPermissions.folderCreate) {
      return;
    }

    // Check granular canEditFolder permission
    const folderPerms = userPermissions[MODULES.FOLDER];
    if (folderPerms) {
      if (folderPerms.isAllEditable) {
        return;
      }
      if (folderPerms.editableFoldersId?.includes(folder.id)) {
        return;
      }
    }

    throw new ForbiddenException('You do not have permission to update this folder');
  }
  async deleteFolder(user, id): Promise<DeleteResult> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await manager.findOneOrFail(Folder, {
        where: { id, organizationId: user.organizationId },
      });

      const gitSyncedAppInFolder = await manager
        .createQueryBuilder(AppGitSync, 'ags')
        .innerJoin(FolderApp, 'fa', 'fa.app_id = ags.app_id')
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
