import { BadRequestException, Injectable } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { FolderDataSourcesUtilService } from './util.service';
import { IFolderDataSourcesService } from './interfaces/IService';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { FoldersUtilService } from '@modules/folders/util.service';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { MODULES } from '@modules/app/constants/modules';
import { UserFolderPermissions, UserPermissions } from '@modules/ability/types';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import { getConnectionInstance } from '@helpers/database.helper';
import { skipAppEditingVersionHydration } from '@modules/apps/subscribers/apps.subscriber';

@Injectable()
export class FolderDataSourcesService implements IFolderDataSourcesService {
  constructor(
    protected readonly folderDataSourcesUtilService: FolderDataSourcesUtilService,
    protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService,
    protected readonly foldersUtilService: FoldersUtilService,
    protected readonly abilityService: AbilityService
  ) {}

  async getFolders(user: User, query: { searchKey?: string; branchId?: string }) {
    const manager = getConnectionInstance().manager;
    const searchKey = query.searchKey;

    // skipAppEditingVersionHydration: resolving permissions loads org apps and would otherwise
    // fire an AppVersion N+1 via AppsSubscriber.afterLoad. This read never needs that hydration.
    return skipAppEditingVersionHydration.run(true, async () => {
      // Every org has a default branch — resolve it when the client doesn't pass one, so the read
      // scopes to the same branch_id writes land on.
      let branchId = query.branchId;
      if (!branchId) {
        const { options } = await this.gitSyncConfigsUtilService.getDetails(user.organizationId);
        branchId = options.defaultBranch?.id;
      }

      // Resolve folder access (own DATA_SOURCE_FOLDER bucket) and data-source visibility
      // (GLOBAL_DATA_SOURCE) in one pass.
      const userPermissions = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: MODULES.DATA_SOURCE_FOLDER }, { resource: MODULES.GLOBAL_DATA_SOURCE }],
        organizationId: user.organizationId,
      });
      const folderPermissions = userPermissions?.[MODULES.DATA_SOURCE_FOLDER];
      const viewableDataSourceIds = this.resolveViewableDataSourceIds(userPermissions);

      const folders = await this.foldersUtilService.allFolders(user, manager, DATA_SOURCE_FOLDER_TYPE);
      if (folders.length === 0) return decamelizeKeys({ folders: [] });

      const folderIds = folders.map((f) => f.id);
      // branchId is effectively always resolved; guard keeps the query safe if an org somehow
      // lacks a default branch (folders then list with empty contents rather than throwing).
      const folderDataSources = branchId
        ? await this.folderDataSourcesUtilService.findFolderDataSourcesForFolders(
            folderIds,
            branchId,
            manager,
            searchKey,
            viewableDataSourceIds
          )
        : [];

      const byFolder = new Map<string, FolderDataSource[]>();
      for (const fds of folderDataSources) {
        const bucket = byFolder.get(fds.folderId) ?? [];
        bucket.push(fds);
        byFolder.set(fds.folderId, bucket);
      }

      const visibleFolders = this.filterFoldersByPermissions(
        folders,
        user,
        userPermissions?.isAdmin,
        folderPermissions
      ).map((folder) => {
        const contents = byFolder.get(folder.id) ?? [];
        return { ...folder, folderDataSources: contents, count: contents.length };
      });

      return decamelizeKeys({ folders: visibleFolders });
    });
  }

  // Which global data sources the user may see, as the `viewableDataSourceIds` filter for the
  // folder read. `null` = no restriction (see everything): admins/super-admins, and users with
  // blanket usable/configurable access. Otherwise the union of the specific ids they can use or
  // configure. Mirrors the visibility the data-source dashboard (allGlobalDS) applies.
  private resolveViewableDataSourceIds(userPermissions: UserPermissions): string[] | null {
    if (userPermissions?.isAdmin || userPermissions?.isSuperAdmin) return null;
    const dsPerms = userPermissions?.[MODULES.GLOBAL_DATA_SOURCE];
    if (!dsPerms) return [];
    if (dsPerms.isAllUsable || dsPerms.isAllConfigurable) return null;
    return [...new Set([...(dsPerms.usableDataSourcesId ?? []), ...(dsPerms.configurableDataSourceId ?? [])])];
  }

  // Data-source folders are admin/builder-facing (never end-user assignable). Admins see all;
  // others see folders they own or have a resolved grant on. With no folder-permission object
  // (CE / unconfigured EE) fall back to showing all, matching folder-apps.
  protected filterFoldersByPermissions(
    folders: Folder[],
    user: User,
    isAdmin: boolean,
    folderPermissions?: UserFolderPermissions
  ): Folder[] {
    if (isAdmin) return folders;
    if (folderPermissions) {
      if (folderPermissions.isAllEditable || folderPermissions.isAllViewable) return folders;
      const accessibleFolderIds = new Set([
        ...(folderPermissions.editableFoldersId ?? []),
        ...(folderPermissions.viewableFoldersId ?? []),
      ]);
      return folders.filter((f) => accessibleFolderIds.has(f.id) || f.createdBy === user.id);
    }
    return folders;
  }

  async create(
    folderId: string,
    dataSourceId: string,
    branchId?: string,
    organizationId?: string
  ): Promise<FolderDataSource> {
    const resolvedBranchId = await this.resolveEffectiveBranchId(branchId, organizationId);
    return this.folderDataSourcesUtilService.create(folderId, dataSourceId, resolvedBranchId);
  }

  async bulkCreate(
    folderId: string,
    dataSourceIds: string[],
    branchId?: string,
    organizationId?: string
  ): Promise<FolderDataSource[]> {
    const resolvedBranchId = await this.resolveEffectiveBranchId(branchId, organizationId);
    return this.folderDataSourcesUtilService.bulkCreate(folderId, dataSourceIds, resolvedBranchId);
  }

  async remove(folderId: string, dataSourceId: string, branchId?: string, organizationId?: string): Promise<void> {
    const resolvedBranchId = await this.resolveEffectiveBranchId(branchId, organizationId);
    return this.folderDataSourcesUtilService.remove(folderId, dataSourceId, resolvedBranchId);
  }

  // folder_data_sources.branch_id is NOT NULL, so every write needs a branch. When the caller
  // doesn't pass one, fall back to the org's default branch (every org has one) — matching the
  // branch the read path scopes to. Unlike folder-apps there is no legacy NULL-row reconciliation,
  // so no isDefaultFallback flag is needed.
  private async resolveEffectiveBranchId(branchId?: string, organizationId?: string): Promise<string> {
    if (branchId) return branchId;
    if (!organizationId) {
      throw new BadRequestException(
        'Cannot resolve branch for folder data source: branchId or organizationId required'
      );
    }
    const { options } = await this.gitSyncConfigsUtilService.getDetails(organizationId);
    const defaultBranchId = options.defaultBranch?.id;
    if (!defaultBranchId) {
      throw new BadRequestException('Organization has no default branch to scope the data source folder mapping to');
    }
    return defaultBranchId;
  }
}
