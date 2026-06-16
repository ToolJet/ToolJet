import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Folder } from '@entities/folder.entity';
import { decamelizeKeys } from 'humps';
import { CreateFolderDto, UpdateFolderDto } from '@modules/folders/dto';
import { IFoldersService } from './interfaces/IService';
import { catchDbException } from '@helpers/utils.helper';
import { DeleteResult, EntityManager } from 'typeorm';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { FoldersUtilService } from './util.service';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class FoldersService implements IFoldersService {
  constructor(
    protected foldersUtilService: FoldersUtilService,
    protected abilityService: AbilityService,
    protected organizationGitSyncRepository: OrganizationGitSyncRepository
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

      await this.checkFolderManagePermission(user, folder, manager, 'update');

      // Workspace-level git sync: any folder in a git-synced org is locked.
      if (await this.organizationGitSyncRepository.isOrganizationGitSynced(user.organizationId, manager)) {
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

  protected async checkFolderManagePermission(
    user,
    folder: Folder,
    manager: EntityManager,
    action: 'update' | 'delete'
  ): Promise<void> {
    const userPermissions = await this.abilityService.resourceActionsPermission(
      user,
      {
        resources: [{ resource: MODULES.FOLDER }],
        organizationId: user.organizationId,
      },
      manager
    );

    if (userPermissions.isAdmin || userPermissions.isSuperAdmin) {
      return;
    }

    if (folder.createdBy === user.id) {
      return;
    }

    if (action === 'delete' && userPermissions.folderDelete) {
      return;
    }

    const folderPerms = userPermissions[MODULES.FOLDER];
    if (action === 'update' && folderPerms) {
      if (folderPerms.isAllEditable) {
        return;
      }
      if (folderPerms.editableFoldersId?.includes(folder.id)) {
        return;
      }
    }

    if (action === 'update' && userPermissions.isBuilder && folder.type === APP_TYPES.MODULE) {
      return;
    }

    throw new ForbiddenException('You do not have access to perform this action');
  }

  async deleteFolder(user, id): Promise<DeleteResult> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await manager.findOneOrFail(Folder, {
        where: { id, organizationId: user.organizationId },
      });

      await this.checkFolderManagePermission(user, folder, manager, 'delete');

      if (await this.organizationGitSyncRepository.isOrganizationGitSynced(user.organizationId, manager)) {
        throw new BadRequestException(
          "Folders with apps synced to git can't be deleted. Delete the git apps and try again."
        );
      }

      return manager.delete(Folder, { id: folder.id, organizationId: user.organizationId });
    });
  }
}
