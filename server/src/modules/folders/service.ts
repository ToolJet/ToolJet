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
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

// App type → the delete-permission key and MODULES bucket that gate its folders.
// Add an entry here (not another ternary arm) when a new folder-owning app type is introduced.
const FOLDER_PERMISSION_BY_APP_TYPE: Partial<Record<APP_TYPES, { deleteKey: string; resourceType: MODULES }>> = {
  [APP_TYPES.WORKFLOW]: { deleteKey: 'workflowFolderDelete', resourceType: MODULES.WORKFLOW_FOLDER },
  [APP_TYPES.MODULE]: { deleteKey: 'moduleFolderDelete', resourceType: MODULES.MODULE_FOLDER },
};

@Injectable()
export class FoldersService implements IFoldersService {
  constructor(
    protected foldersUtilService: FoldersUtilService,
    protected abilityService: AbilityService,
    protected gitSyncConfigsUtilService: GitSyncConfigsUtilService
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

      // Multi-branch mode: folders are locked because the same folder spans multiple branches.
      // Single-branch mode: editing is safe — only one branch exists.
      const { isEnabled: isGitSyncEnabled, isMultiBranchingEnabled } = await this.gitSyncConfigsUtilService.getDetails(
        user.organizationId
      );
      if (isGitSyncEnabled && isMultiBranchingEnabled) {
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
        resources: [
          { resource: MODULES.FOLDER },
          { resource: MODULES.WORKFLOW_FOLDER },
          { resource: MODULES.MODULE_FOLDER },
        ],
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

    const folderPermission = FOLDER_PERMISSION_BY_APP_TYPE[folder.type as APP_TYPES];
    const canDeleteFolder = folderPermission
      ? userPermissions[folderPermission.deleteKey]
      : userPermissions.folderDelete;

    if (action === 'delete' && canDeleteFolder) {
      return;
    }

    const folderResourceType = folderPermission?.resourceType ?? MODULES.FOLDER;
    const folderPerms = userPermissions[folderResourceType];
    if (action === 'update' && folderPerms) {
      if (folderPerms.isAllEditable) {
        return;
      }
      if (folderPerms.editableFoldersId?.includes(folder.id)) {
        return;
      }
    }

    throw new ForbiddenException('You do not have access to perform this action');
  }

  async deleteFolder(user, id): Promise<DeleteResult> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await manager.findOneOrFail(Folder, {
        where: { id, organizationId: user.organizationId },
      });

      await this.checkFolderManagePermission(user, folder, manager, 'delete');

      const { isEnabled: isGitSyncEnabled, isMultiBranchingEnabled } = await this.gitSyncConfigsUtilService.getDetails(
        user.organizationId
      );
      // Multi-branch: block deletion of any folder that has apps on any branch.
      // Single-branch: allow deletion only if the folder is empty (same check, same guard).
      if (isGitSyncEnabled && isMultiBranchingEnabled) {
        const branchNames = await this.foldersUtilService.findBranchNamesWithApps(folder.id, manager);
        if (branchNames.length > 0) {
          // AllExceptionsFilter collapses every error response down to { message, ... } and
          // drops any other fields on the exception body — so the branch list is JSON-encoded
          // into the message itself and parsed back out on the frontend (same pattern already
          // used for the SSO organizationId payload in handle-response.js).
          throw new BadRequestException(
            JSON.stringify({ message: 'Folder with apps cannot be deleted', branches: branchNames })
          );
        }
      }

      return manager.delete(Folder, { id: folder.id, organizationId: user.organizationId });
    });
  }
}
