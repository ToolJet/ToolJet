import { BadRequestException, Injectable } from '@nestjs/common';
import { FolderApp } from '../../entities/folder_app.entity';
import { dbTransactionWrap, getConnectionInstance } from '@helpers/database.helper';
import { EntityManager, IsNull } from 'typeorm';
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
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { skipAppEditingVersionHydration } from '@modules/apps/subscribers/apps.subscriber';
@Injectable()
export class FolderAppsService implements IFolderAppsService {
  constructor(
    protected abilityService: AbilityService,
    protected foldersUtilService: FoldersUtilService,
    protected folderAppsUtilService: FolderAppsUtilService
  ) {}

  async create(folderId: string, appId: string, branchId?: string): Promise<FolderApp> {
    return this.folderAppsUtilService.create(folderId, appId, branchId);
  }

  async bulkCreate(folderId: string, appIds: string[], branchId?: string): Promise<FolderApp[]> {
    return this.folderAppsUtilService.bulkCreate(folderId, appIds, branchId);
  }

  async remove(folderId: string, appId: string, branchId?: string): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // TODO: folder under user.organizationId
      const where = branchId ? { folderId, appId, branchId } : { folderId, appId, branchId: IsNull() };
      return await manager.delete(FolderApp, where);
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
    const manager = getConnectionInstance().manager;
    const type = query.type;
    const searchKey = query.searchKey;
    // workflows are not git-synced; their folder_apps rows always have branch_id = NULL
    let branchId = type === APP_TYPES.WORKFLOW ? undefined : query.branchId;

    // AppsSubscriber.afterLoad would otherwise fire one AppVersion query per loaded App
    // entity (N+1), including App entities loaded
    // internally by abilityService.resourceActionsPermission. The list response doesn't
    // need editingVersion hydration, so opt out for the duration of this read.
    return skipAppEditingVersionHydration.run(true, async () => {
      // End users without branch switcher fall back to the org default branch so folders
      // reflect only default-branch apps. Applies to both front-end apps and modules.
      // When no branchId is provided (e.g. end users without branch switcher) and the
      // workspace has git-sync configured, fall back to the default branch so folders
      // reflect only default-branch apps. Non-git-sync workspaces have no orgGit and
      // branchId stays undefined; downstream queries handle that path natively.
      if (!branchId && (type === APP_TYPES.FRONT_END || type === APP_TYPES.MODULE)) {
        const orgGit = await manager.findOne(OrganizationGitSync, {
          where: { organizationId: user.organizationId },
        });
        if (orgGit) {
          const defaultBranch = await manager.findOne(WorkspaceBranch, {
            where: { organizationId: user.organizationId, isDefault: true },
            select: ['id'],
          });
          branchId = defaultBranch?.id;
        }
      }
      const resourceType = this.getResourceTypefromAppType(type as APP_TYPES);
      const userPermissions = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: resourceType }, { resource: MODULES.FOLDER }],
        organizationId: user.organizationId,
      });
      const userAppPermissions = userPermissions?.[resourceType] ?? userPermissions?.[MODULES.APP];
      const userFolderPermissions = userPermissions?.[MODULES.FOLDER];

      const isModuleBuilderAccess =
        type === APP_TYPES.MODULE && (userPermissions?.isBuilder || userPermissions?.isAdmin);
      const effectiveAppPermissions = isModuleBuilderAccess
        ? { ...userAppPermissions, isAllEditable: true }
        : userAppPermissions;

      const folders = await this.foldersUtilService.allFolders(user, manager, type);
      if (folders.length === 0) {
        return decamelizeKeys({ folders: [] });
      }

      const folderIds = folders.map((f) => f.id);
      const folderApps = await this.folderAppsUtilService.findFolderAppsForFolders(
        folderIds,
        effectiveAppPermissions,
        manager,
        type as APP_TYPES,
        searchKey,
        branchId
      );

      const folderAppsByFolder = new Map<string, FolderApp[]>();
      for (const fa of folderApps) {
        const bucket = folderAppsByFolder.get(fa.folderId) ?? [];
        bucket.push(fa);
        folderAppsByFolder.set(fa.folderId, bucket);
      }
      for (const folder of folders) {
        folder.folderApps = folderAppsByFolder.get(folder.id) ?? [];
        folder.generateCount();
      }

      const visibleFolders = this.filterFoldersByPermissions(
        folders,
        user,
        isModuleBuilderAccess || userPermissions?.isAdmin,
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
      return folders.filter((folder) => folder.folderApps.length > 0);
    }

    // For builders: filter based on granular folder permissions
    if (folderPermissions) {
      // If user has "all" level access for any permission tier, show all folders
      if (folderPermissions.isAllEditable || folderPermissions.isAllEditApps || folderPermissions.isAllViewable) {
        return folders.filter((f) => f.createdBy === user.id || f.folderApps.length >= 0);
      }

      const accessibleFolderIds = new Set([
        ...(folderPermissions.editableFoldersId || []),
        ...(folderPermissions.editAppsInFoldersId || []),
        ...(folderPermissions.viewableFoldersId || []),
      ]);

      return folders.filter(
        (f) => accessibleFolderIds.has(f.id) || f.createdBy === user.id || f.folderApps.length > 0
      );
    }

    // No folder permissions object at all (CE / unconfigured EE) → show all folders
    return folders;
  }
}
