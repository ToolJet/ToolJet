import { BadRequestException, Injectable } from '@nestjs/common';
import { FolderApp } from '../../entities/folder_app.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { decamelizeKeys } from 'humps';
import { FoldersUtilService } from '@modules/folders/util.service';
import { FolderAppsUtilService } from './util.service';
import { IFolderAppsService } from './interfaces/IService';
import { MODULES } from '@modules/app/constants/modules';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { User } from '@entities/user.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { APP_TYPES } from '@modules/apps/constants';
import { UserFolderPermissions } from '@modules/ability/types';
@Injectable()
export class FolderAppsService implements IFolderAppsService {
  constructor(
    protected abilityService: AbilityService,
    protected foldersUtilService: FoldersUtilService,
    protected folderAppsUtilService: FolderAppsUtilService
  ) {}

  async create(folderId: string, appId: string): Promise<FolderApp> {
    return this.folderAppsUtilService.create(folderId, appId);
  }

  async remove(folderId: string, appId: string): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // TODO: folder under user.organizationId
      return await manager.delete(FolderApp, { folderId, appId });
    });
  }

  private getResourceTypefromAppType(type: APP_TYPES) {
    switch (type) {
      case APP_TYPES.FRONT_END:
        return MODULES.APP;
      case APP_TYPES.WORKFLOW:
        return MODULES.WORKFLOWS;
      case APP_TYPES.MODULE:
        return MODULES.MODULES;
      default:
        throw new BadRequestException('Invalid resource type');
    }
  }

  async getFolders(user: User, query) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const type = query.type;
      const searchKey = query.searchKey;
      const branchId = query.branchId;
      const resourceType = this.getResourceTypefromAppType(type as APP_TYPES);
      const userPermissions = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: resourceType }, { resource: MODULES.FOLDER }],
        organizationId: user.organizationId,
      });
      const userAppPermissions = userPermissions?.[resourceType];
      const userFolderPermissions = userPermissions?.[MODULES.FOLDER];

      const allFolderList = await this.foldersUtilService.allFolders(user, manager, type);
      if (allFolderList.length === 0) {
        return { folders: [] };
      }
      const folders = await this.folderAppsUtilService.allFoldersWithAppCount(
        user,
        userAppPermissions,
        manager,
        type,
        searchKey,
        branchId
      );
      allFolderList.forEach((folder, index) => {
        const currentFolder = folders.find((f) => f.id === folder.id);
        if (currentFolder) {
          allFolderList[index].folderApps = [...(currentFolder?.folderApps || [])];
          allFolderList[index].generateCount();
        } else {
          allFolderList[index].folderApps = [];
          allFolderList[index].generateCount();
        }
      });

      // Filter folders based on user role and permissions
      const visibleFolders = this.filterFoldersByPermissions(
        allFolderList,
        user,
        userPermissions?.isAdmin,
        userFolderPermissions
      );

      return decamelizeKeys({ folders: visibleFolders });
    });
  }

  /**
   * Filters the folder list based on user role and folder permissions.
   * - Admin: sees all folders
   * - End user: sees only folders with apps they can access
   * - Builder: if folder permissions are configured, sees only folders they have access to;
   *   otherwise sees all folders (CE / unconfigured EE fallback)
   */
  protected filterFoldersByPermissions(
    folders: any[],
    user: User,
    isAdmin: boolean,
    folderPermissions: UserFolderPermissions
  ): any[] {
    if (isAdmin) return folders;

    if (user.roleGroup === USER_ROLE.END_USER) {
      if (folderPermissions) {
        if (folderPermissions.isAllViewable) {
          return folders.filter((folder) => folder.folderApps.length > 0);
        }

        const viewableFolderIds = new Set(folderPermissions.viewableFoldersId || []);
        return folders.filter((folder) => viewableFolderIds.has(folder.id) && folder.folderApps.length > 0);
      }

      return folders.filter((folder) => folder.folderApps.length > 0);
    }

    // For builders: filter based on granular folder permissions
    if (folderPermissions) {
      // If user has "all" level access for any permission tier, show all folders
      if (folderPermissions.isAllEditable || folderPermissions.isAllEditApps || folderPermissions.isAllViewable) {
        return folders.filter((f) => f.createdBy === user.id || f.folderApps.length > 0);
      }

      const accessibleFolderIds = new Set([
        ...(folderPermissions.editableFoldersId || []),
        ...(folderPermissions.editAppsInFoldersId || []),
        ...(folderPermissions.viewableFoldersId || []),
      ]);

      // Show folders with explicit granular access OR folders created by this user.
      // When accessibleFolderIds is empty (no granular access), only show user-created folders.
      return folders.filter((f) => accessibleFolderIds.has(f.id) || f.createdBy === user.id);
    }

    // No folder permissions object at all (CE / unconfigured EE) → show all folders
    return folders;
  }
}
