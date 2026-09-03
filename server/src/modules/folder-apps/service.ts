import { BadRequestException, Injectable } from '@nestjs/common';
import { FolderApp } from '../../entities/folder_app.entity';
import { dbTransactionWrap, getConnectionInstance } from '@helpers/database.helper';
import { EntityManager, Equal, IsNull, Or } from 'typeorm';
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
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { skipAppEditingVersionHydration } from '@modules/apps/subscribers/apps.subscriber';
import { FOLDER_RESOURCE_TYPE_BY_APP_TYPE } from './ability';
@Injectable()
export class FolderAppsService implements IFolderAppsService {
  constructor(
    protected abilityService: AbilityService,
    protected foldersUtilService: FoldersUtilService,
    protected folderAppsUtilService: FolderAppsUtilService,
    protected gitSyncConfigsUtilService: GitSyncConfigsUtilService
  ) {}

  async create(folderId: string, appId: string, branchId?: string, organizationId?: string): Promise<FolderApp> {
    const { branchId: resolvedBranchId, isDefaultFallback } = await this.resolveEffectiveBranchId(
      appId,
      branchId,
      organizationId
    );
    return this.folderAppsUtilService.create(folderId, appId, resolvedBranchId, isDefaultFallback);
  }

  async bulkCreate(
    folderId: string,
    appIds: string[],
    branchId?: string,
    organizationId?: string
  ): Promise<FolderApp[]> {
    const { branchId: resolvedBranchId, isDefaultFallback } = await this.resolveEffectiveBranchIdForBulk(
      appIds,
      branchId,
      organizationId
    );
    return this.folderAppsUtilService.bulkCreate(folderId, appIds, resolvedBranchId, isDefaultFallback);
  }

  async remove(folderId: string, appId: string, branchId?: string, organizationId?: string): Promise<void> {
    const { branchId: resolvedBranchId, isDefaultFallback } = await this.resolveEffectiveBranchId(
      appId,
      branchId,
      organizationId
    );
    return dbTransactionWrap(async (manager: EntityManager) => {
      const where = resolvedBranchId
        ? { folderId, appId, branchId: isDefaultFallback ? Or(Equal(resolvedBranchId), IsNull()) : resolvedBranchId }
        : { folderId, appId, branchId: IsNull() };
      return await manager.delete(FolderApp, where);
    });
  }

  // branch_id is mandatory on folder_apps for every app type (workflows included — they are
  // pinned to the org's default branch). When the caller doesn't pass an explicit branch, resolve
  // the org's default branch so writes land on the same branch_id as the read path.
  // isDefaultFallback flags that resolution so callers also match any pre-existing branch_id=NULL
  // rows for this app — otherwise those legacy rows are invisible to the (app_id, defaultBranchId)
  // lookup and get orphaned. (The backfill migration converts historical NULL rows, so in steady
  // state there are none; the fallback stays as a belt-and-braces guard.)
  private async resolveEffectiveBranchId(
    appId: string,
    branchId?: string,
    organizationId?: string
  ): Promise<{ branchId?: string; isDefaultFallback: boolean }> {
    if (branchId || !organizationId || !appId) return { branchId, isDefaultFallback: false };
    const { options } = await this.gitSyncConfigsUtilService.getDetails(organizationId);
    return { branchId: options.defaultBranch?.id, isDefaultFallback: !!options.defaultBranch?.id };
  }

  private async resolveEffectiveBranchIdForBulk(
    appIds: string[],
    branchId?: string,
    organizationId?: string
  ): Promise<{ branchId?: string; isDefaultFallback: boolean }> {
    if (branchId || !organizationId || !appIds.length) return { branchId, isDefaultFallback: false };
    const { options } = await this.gitSyncConfigsUtilService.getDetails(organizationId);
    return { branchId: options.defaultBranch?.id, isDefaultFallback: !!options.defaultBranch?.id };
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
    // Workflows are not branched by the user, but their folder_apps rows now live on the org's
    // default branch (not NULL). Null out any client-supplied branchId for them so the default
    // branch is resolved below and the listing matches those rows.
    let branchId = type === APP_TYPES.WORKFLOW ? undefined : query.branchId;

    // AppsSubscriber.afterLoad would otherwise fire one AppVersion query per loaded App
    // entity (N+1), including App entities loaded
    // internally by abilityService.resourceActionsPermission. The list response doesn't
    // need editingVersion hydration, so opt out for the duration of this read.
    return skipAppEditingVersionHydration.run(true, async () => {
      // Resolve the org's default branch whenever no branch is in scope — front-end apps and
      // modules without a branch switcher, and workflows (nulled out above). getDetails always
      // resolves options.defaultBranch (every org has one), so this scopes to the default branch
      // on gitsync-off workspaces too, matching the backfilled branch_id on folder_apps rows.
      if (!branchId) {
        const { options } = await this.gitSyncConfigsUtilService.getDetails(user.organizationId);
        branchId = options.defaultBranch?.id;
      }
      const resourceType = this.getResourceTypefromAppType(type as APP_TYPES);
      // Module/workflow folders are gated by their own MODULE_FOLDER/WORKFLOW_FOLDER bucket,
      // not the generic front-end FOLDER bucket — same mapping the ability guard uses.
      const folderResourceType = FOLDER_RESOURCE_TYPE_BY_APP_TYPE[type as APP_TYPES] ?? MODULES.FOLDER;
      const userPermissions = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: resourceType }, { resource: folderResourceType }],
        organizationId: user.organizationId,
      });
      const userAppPermissions = userPermissions?.[resourceType] ?? userPermissions?.[MODULES.APP];
      const userFolderPermissions = userPermissions?.[folderResourceType];

      const folders = await this.foldersUtilService.allFolders(user, manager, type);
      if (folders.length === 0) {
        return decamelizeKeys({ folders: [] });
      }

      const folderIds = folders.map((f) => f.id);
      const folderApps = await this.folderAppsUtilService.findFolderAppsForFolders(
        folderIds,
        userAppPermissions,
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

      return folders.filter((f) => accessibleFolderIds.has(f.id) || f.createdBy === user.id || f.folderApps.length > 0);
    }

    // No folder permissions object at all (CE / unconfigured EE) → show all folders
    return folders;
  }
}
