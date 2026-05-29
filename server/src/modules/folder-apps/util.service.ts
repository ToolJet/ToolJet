import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { Injectable } from '@nestjs/common';
import { EntityManager, In, IsNull, SelectQueryBuilder } from 'typeorm';
import { IFolderAppsUtilService } from './interfaces/IUtilService';
import { AppBase } from '@entities/app_base.entity';
import { dbTransactionWrap, getConnectionInstance } from '@helpers/database.helper';
import { FolderApp } from '@entities/folder_app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { UserAppsPermissions, UserWorkflowPermissions } from '@modules/ability/types';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { APP_TYPES } from '@modules/apps/constants';
import { AppVersionType } from '@entities/app_version.entity';

export function applyAppPermissionFilter(
  query: SelectQueryBuilder<FolderApp>,
  userAppPermissions: UserAppsPermissions
): void {
  // No resolved app permissions → user can see nothing.
  if (!userAppPermissions) {
    query.andWhere('1=0');
    return;
  }
  const {
    isAllEditable,
    isAllViewable,
    hideAll,
    hiddenAppsId = [],
    editableAppsId = [],
    viewableAppsId = [],
  } = userAppPermissions;
  if (isAllEditable) return;

  const hiddenNonEditable = hiddenAppsId.filter((id) => !editableAppsId.includes(id));
  const explicitVisibleApps = Array.from(new Set([...editableAppsId, ...viewableAppsId]));
  const viewableApps = hideAll
    ? [null, ...explicitVisibleApps]
    : [
        null,
        ...Array.from(new Set([...editableAppsId, ...viewableAppsId.filter((id) => !hiddenNonEditable.includes(id))])),
      ];

  if (!isAllViewable) {
    query.andWhere('folder_apps.appId IN (:...viewableApps)', { viewableApps });
    return;
  }
  if (!hideAll && hiddenNonEditable.length > 0) {
    query.andWhere('folder_apps.appId NOT IN (:...hiddenApps)', { hiddenApps: hiddenNonEditable });
    return;
  }
  if (hideAll) {
    if (explicitVisibleApps.length > 0) {
      query.andWhere('folder_apps.appId IN (:...viewableApps)', { viewableApps });
    } else {
      query.andWhere('1=0');
    }
  }
}

@Injectable()
export class FolderAppsUtilService implements IFolderAppsUtilService {
  constructor(protected readonly abilityService: AbilityService) {}

  async findFolderAppsForFolders(
    folderIds: string[],
    userAppPermissions: UserAppsPermissions | UserWorkflowPermissions,
    manager: EntityManager,
    _type: APP_TYPES = APP_TYPES.FRONT_END,
    searchKey?: string,
    branchId?: string
  ): Promise<FolderApp[]> {
    if (folderIds.length === 0) return [];

    const query = this.buildFolderAppsQuery(manager, folderIds, searchKey, branchId);
    applyAppPermissionFilter(query, userAppPermissions as UserAppsPermissions);
    return query.getMany();
  }

  protected buildFolderAppsQuery(
    manager: EntityManager,
    folderIds: string[],
    searchKey?: string,
    branchId?: string
  ): SelectQueryBuilder<FolderApp> {
    // Non-git orgs (and workflows) store folder_apps with branch_id = NULL. SQL `col = NULL`
    // is never true, so the null case must use `IS NULL` or the rows silently disappear.
    const query = manager
      .createQueryBuilder(FolderApp, 'folder_apps')
      .leftJoin('apps', 'app_search', 'folder_apps.app_id = app_search.id')
      .where(
        branchId
          ? 'folder_apps.folderId IN (:...folderIds) AND folder_apps.branchId = :branchId'
          : 'folder_apps.folderId IN (:...folderIds) AND folder_apps.branchId IS NULL',
        branchId ? { folderIds, branchId } : { folderIds }
      );

    if (branchId) {
      query.leftJoin(
        'app_versions',
        'av_search',
        'av_search.app_id = app_search.id AND av_search.branch_id = :searchBranchId',
        { searchBranchId: branchId }
      );
    } else {
      query.leftJoin(
        'app_versions',
        'av_search',
        'av_search.app_id = app_search.id AND av_search.branch_id IS NULL AND av_search.version_type = :versionType',
        { versionType: AppVersionType.VERSION }
      );
    }

    if (searchKey) {
      if (branchId) {
        query.andWhere(
          '(LOWER(av_search.app_name) LIKE :searchKey OR (app_search.type = :workflowType AND LOWER(app_search.name) LIKE :searchKey))',
          {
            searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
            workflowType: APP_TYPES.WORKFLOW,
          }
        );
      } else {
        query.andWhere(
          `(EXISTS (SELECT 1 FROM app_versions av_s WHERE av_s.app_id = app_search.id AND LOWER(av_s.app_name) LIKE :searchKey) OR (app_search.type = :workflowType AND LOWER(app_search.name) LIKE :searchKey))`,
          {
            searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
            workflowType: APP_TYPES.WORKFLOW,
          }
        );
      }
    }
    return query;
  }

  protected getBaseAppsQuery(
    manager: EntityManager,
    searchKey?: string,
    branchId?: string
  ): SelectQueryBuilder<AppBase> {
    const query = manager
      .createQueryBuilder(AppBase, 'apps')
      .innerJoin('apps.user', 'user')
      .addSelect(['user.firstName', 'user.lastName']);

    if (branchId) {
      // App must exist in app_versions on this branch — INNER JOIN enforces that.
      query.innerJoinAndSelect('apps.appVersions', 'appVersions', 'appVersions.branchId = :branchId', { branchId });
    }

    if (searchKey) {
      if (branchId) {
        // Non-workflow apps match against the branched app_versions.app_name,
        // falling back to apps.name when the version row's app_name is NULL
        // (un-backfilled stubs, pull-created rows, etc.). Workflows keep their
        // name on apps.* and match against apps.name explicitly.
        query.andWhere(
          '(LOWER(appVersions.app_name) LIKE :searchKey OR (apps.type = :workflowType AND LOWER(apps.name) LIKE :searchKey))',
          {
            searchKey: `%${searchKey.toLowerCase()}%`,
            workflowType: APP_TYPES.WORKFLOW,
          }
        );
      } else {
        // gitsync off: non-workflows match against any app_version's app_name;
        // workflows match against apps.name.
        query.andWhere(
          `(EXISTS (SELECT 1 FROM app_versions av_s WHERE av_s.app_id = apps.id AND LOWER(av_s.app_name) LIKE :searchKey) OR (apps.type = :workflowType AND LOWER(apps.name) LIKE :searchKey))`,
          {
            searchKey: `%${searchKey.toLowerCase()}%`,
            workflowType: APP_TYPES.WORKFLOW,
          }
        );
      }
    }

    return query;
  }

  async getAppsFor(
    user: User,
    folder: Folder,
    page: number,
    searchKey: string,
    type: APP_TYPES,
    branchId?: string
  ): Promise<{
    viewableApps: AppBase[];
    totalCount: number;
  }> {
    // Read-only — no txn needed.
    const manager = getConnectionInstance().manager;
    // Non-git orgs store folder_apps with branch_id = NULL; `branch_id = NULL` never matches,
    // so the null case must use `IS NULL` or the folder appears empty.
    const folderAppsQuery = manager
      .createQueryBuilder(FolderApp, 'folderApp')
      .innerJoin(
        'folderApp.app',
        'app',
        branchId
          ? 'folderApp.folderId = :id AND folderApp.branch_id = :branchId'
          : 'folderApp.folderId = :id AND folderApp.branch_id IS NULL',
        branchId ? { id: folder.id, branchId } : { id: folder.id }
      );

    if (branchId) {
      // INNER JOIN — folder apps are kept only if they have an app_versions row on
      // this branch. Apps not present on the branch are dropped here.
      folderAppsQuery.innerJoin(
        'app_versions',
        'av_folder',
        'av_folder.app_id = app.id AND av_folder.branch_id = :folderBranchId',
        { folderBranchId: branchId }
      );
    }

    // Only apply the name filter when the caller actually typed something.
    // Empty `searchKey` becomes `LIKE '%%'`, which evaluates to NULL (not true)
    // against rows where av_folder.app_name IS NULL and drops them.
    const hasSearch = !!(searchKey && searchKey.trim());
    if (hasSearch) {
      folderAppsQuery.where(
        branchId
          ? // Non-workflows match against the branched app_versions.app_name,
            // (un-backfilled or pull-created rows). Workflows keep name on apps.*.
            '(LOWER(av_folder.app_name) LIKE :name OR (app.type = :workflowType AND LOWER(app.name) LIKE :name))'
          : // gitsync off: non-workflows match any app_version's name;
            // workflows match app.name.
            `(EXISTS (SELECT 1 FROM app_versions av_n WHERE av_n.app_id = app.id AND LOWER(av_n.app_name) LIKE :name) OR (app.type = :workflowType AND LOWER(app.name) LIKE :name))`,
        { name: `%${searchKey.toLowerCase()}%`, workflowType: APP_TYPES.WORKFLOW }
      );
    }

    const folderApps = await folderAppsQuery.getMany();

    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.APP }],
      organizationId: user.organizationId,
    });
    const userAppPermissions = userPermission?.[MODULES.APP];

    // Builders have admin-level access to modules — skip app-level permission filtering.
    const isModuleBuilderAccess = type === APP_TYPES.MODULE && (userPermission?.isBuilder || userPermission?.isAdmin);
    const effectiveAppPermissions = isModuleBuilderAccess
      ? { ...userAppPermissions, isAllEditable: true }
      : userAppPermissions;

    const folderAppIds = folderApps.map((folderApp) => folderApp.appId);
    if (folderAppIds.length == 0) {
      return {
        viewableApps: [],
        totalCount: 0,
      };
    }

    const viewableAppsInFolder = this.getBaseAppsQuery(manager, searchKey, branchId);
    this.addViewableFrontendFilter(viewableAppsInFolder, folderAppIds, effectiveAppPermissions);

    // Branch presence is already enforced by the INNER JOIN in getBaseAppsQuery
    // (appVersions.branchId = :branchId). No secondary filter needed.

    // Listing order — mirrors AppsUtilService. Stubs sink to the bottom; among
    // non-stubs, last-edited first.
    //   - branchId → appVersions.isStub ASC, then appVersions.updatedAt DESC.
    //     The `appVersions` join is added by getBaseAppsQuery when branchId is set.
    //   - no branchId → fall back to apps.updatedAt (stubs are a pull-flow artifact
    //     and don't exist in non-git workspaces).
    if (branchId) {
      viewableAppsInFolder
        .orderBy('appVersions.isStub', 'ASC')
        .addOrderBy('appVersions.updatedAt', 'DESC')
        .addOrderBy('apps.createdAt', 'DESC');
    } else {
      viewableAppsInFolder.orderBy('apps.updatedAt', 'DESC').addOrderBy('apps.createdAt', 'DESC');
    }

    // Clone before paginating so the paginated getMany and the full-count getCount
    // operate on independent builders. The clone inherits the ordering set above.
    const paginatedQuery = viewableAppsInFolder.clone();
    if (page !== 0) {
      paginatedQuery.take(9).skip(9 * (page - 1));
    }

    const [viewableApps, totalCount] = await Promise.all([paginatedQuery.getMany(), viewableAppsInFolder.getCount()]);

    return {
      viewableApps,
      totalCount,
    };
  }

  async bulkCreate(folderId: string, appIds: string[], branchId?: string): Promise<FolderApp[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const branchFilter = branchId ? { branchId } : { branchId: IsNull() };
      const existing = await manager.find(FolderApp, { where: { appId: In(appIds), ...branchFilter } });
      const alreadyInFolder = new Set(existing.filter((fa) => fa.folderId === folderId).map((fa) => fa.appId));
      const toRemove = existing.filter((fa) => fa.folderId !== folderId);

      if (toRemove.length > 0) {
        await manager.delete(FolderApp, { id: In(toRemove.map((fa) => fa.id)) });
      }

      const toCreate = appIds.filter((id) => !alreadyInFolder.has(id));
      if (toCreate.length === 0) return [];

      const newFolderApps = toCreate.map((appId) =>
        manager.create(FolderApp, { folderId, appId, branchId: branchId || null })
      );
      return manager.save(FolderApp, newFolderApps);
    });
  }

  async create(folderId: string, appId: string, branchId?: string): Promise<FolderApp> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const branchFilter = branchId ? { branchId } : { branchId: IsNull() };
      const existingFolderApp = await manager.findOne(FolderApp, {
        where: { appId, ...branchFilter },
      });

      // idempotent: git-sync pull paths call create() repeatedly on re-pull
      if (existingFolderApp?.folderId === folderId) return existingFolderApp;
      // app is in a different folder on this branch — move it
      if (existingFolderApp) await manager.delete(FolderApp, { id: existingFolderApp.id });

      // TODO: check if folder under user.organizationId and user has edit permission on app

      const newFolderApp = manager.create(FolderApp, {
        folderId,
        appId,
        branchId: branchId || null,
      });
      return await manager.save(FolderApp, newFolderApp);
    });
  }

  protected addViewableFrontendFilter(
    query: SelectQueryBuilder<AppBase>,
    folderAppIds: string[],
    userAppPermissions: UserAppsPermissions
  ): SelectQueryBuilder<AppBase> {
    // No resolved app permissions → user can see nothing.
    if (!userAppPermissions) {
      query.andWhere('1=0');
      return query;
    }
    const {
      isAllEditable,
      isAllViewable,
      hideAll,
      hiddenAppsId = [],
      editableAppsId = [],
      viewableAppsId = [],
    } = userAppPermissions;

    const hiddenNonEditable = hiddenAppsId.filter((id) => !editableAppsId.includes(id));

    const explicitVisibleApps = Array.from(new Set([...editableAppsId, ...viewableAppsId]));

    const viewableAppsTotal = isAllEditable
      ? [null, ...folderAppIds]
      : hideAll
        ? [null, ...explicitVisibleApps] // key fix: include folder-derived viewable IDs
        : isAllViewable
          ? [null, ...folderAppIds].filter((id) => !hiddenNonEditable.includes(id))
          : [
              null,
              ...Array.from(
                new Set([...editableAppsId, ...viewableAppsId.filter((id) => !hiddenNonEditable.includes(id))])
              ),
            ];

    // Keep only apps in this folder
    const viewableAppIds = [null, ...viewableAppsTotal.filter((id) => folderAppIds.includes(id))];

    // andWhere — `.where()` would reset the WHERE buffer and drop the search predicate
    // added by getBaseAppsQuery. Stacking lets folder visibility filter on top of search.
    query.andWhere('apps.id IN (:...viewableAppIds)', {
      viewableAppIds,
    });

    return query;
  }
}
