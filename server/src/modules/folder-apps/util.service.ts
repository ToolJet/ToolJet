import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { IFolderAppsUtilService } from './interfaces/IUtilService';
import { AppBase } from '@entities/app_base.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { FolderApp } from '@entities/folder_app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { UserAppsPermissions, UserWorkflowPermissions } from '@modules/ability/types';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class FolderAppsUtilService implements IFolderAppsUtilService {
  constructor(protected readonly abilityService: AbilityService) {}

  async allFoldersWithAppCount(
    user: User,
    userAppPermissions: UserAppsPermissions | UserWorkflowPermissions,
    manager: EntityManager,
    type = APP_TYPES.FRONT_END,
    searchKey?: string,
    branchId?: string
  ): Promise<Folder[]> {
    return this.getFolderQuery(
      user.organizationId,
      manager,
      userAppPermissions as UserAppsPermissions,
      type,
      searchKey,
      branchId
    )
      .distinct()
      .getMany();
  }

  protected getBaseFolderQuery(
    organizationId: string,
    manager: EntityManager,
    type: APP_TYPES,
    searchKey?: string,
    branchId?: string
  ): SelectQueryBuilder<Folder> {
    const query = manager.createQueryBuilder(Folder, 'folders');
    query.leftJoinAndSelect('folders.folderApps', 'folder_apps');
    query.leftJoin('folder_apps.app', 'app');

    if (branchId) {
      query.leftJoin('app_versions', 'av_search', 'av_search.app_id = app.id AND av_search.branch_id = :searchBranchId', { searchBranchId: branchId });
    }

    if (searchKey) {
      if (branchId) {
        query.andWhere('(LOWER(av_search.app_name) LIKE :searchKey OR (app.type = :workflowType AND LOWER(app.name) LIKE :searchKey))', {
          searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
          workflowType: APP_TYPES.WORKFLOW,
        });
      } else {
        query.andWhere(
          `(EXISTS (SELECT 1 FROM app_versions av_s WHERE av_s.app_id = app.id AND LOWER(av_s.app_name) LIKE :searchKey) OR (app.type = :workflowType AND LOWER(app.name) LIKE :searchKey))`,
          {
            searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
            workflowType: APP_TYPES.WORKFLOW,
          }
        );
      }
    }

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

  protected getFolderQuery(
    organizationId: string,
    manager: EntityManager,
    userAppPermissions: UserAppsPermissions,
    type = APP_TYPES.FRONT_END,
    searchKey?: string,
    branchId?: string
  ): SelectQueryBuilder<Folder> {
    const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;

    const hiddenNonEditable = userAppPermissions.hiddenAppsId.filter(
      (id) => !userAppPermissions.editableAppsId.includes(id)
    );

    const explicitVisibleApps = Array.from(
      new Set([...userAppPermissions.editableAppsId, ...userAppPermissions.viewableAppsId])
    );

    const viewableApps = userAppPermissions.hideAll
      ? [null, ...explicitVisibleApps]
      : [
          null,
          ...Array.from(
            new Set([
              ...userAppPermissions.editableAppsId,
              ...userAppPermissions.viewableAppsId.filter((id) => !hiddenNonEditable.includes(id)),
            ])
          ),
        ];

    const query = this.getBaseFolderQuery(organizationId, manager, type, searchKey, branchId);

    if (!isAllEditable) {
      // Not all apps are editable - filter with view privilege
      if (!isAllViewable) {
        // Not all apps are viewable
        query.andWhere('folder_apps.appId IN (:...viewableApps)', {
          viewableApps,
        });
      } else if (!hideAll && hiddenNonEditable?.length) {
        // Not all apps are hidden
        query.andWhere('folder_apps.appId NOT IN (:...hiddenApps)', {
          hiddenApps: hiddenNonEditable,
        });
      } else if (hideAll) {
        if (explicitVisibleApps.length > 0) {
          query.andWhere('folder_apps.appId IN (:...viewableApps)', {
            viewableApps,
          });
        } else {
          // No need to return any
          query.andWhere('1=0');
        }
      }
    }

    return query;
  }

  protected getBaseAppsQuery(
    manager: EntityManager,
    folderAppIds: string[],
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
          '(LOWER(COALESCE(appVersions.app_name, apps.name)) LIKE :searchKey OR (apps.type = :workflowType AND LOWER(apps.name) LIKE :searchKey))',
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
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const folderAppsQb = manager
        .createQueryBuilder(FolderApp, 'folderApp')
        .innerJoin('folderApp.app', 'app', 'folderApp.folderId = :id', {
          id: folder.id,
        });

      if (branchId) {
        // INNER JOIN — folder apps are kept only if they have an app_versions row on
        // this branch. Apps not present on the branch are dropped here.
        folderAppsQb.innerJoin(
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
        folderAppsQb.where(
          branchId
            ? // Non-workflows match against the branched app_versions.app_name,
              // falling back to app.name when the version row's app_name is NULL
              // (un-backfilled or pull-created rows). Workflows keep name on apps.*.
              '(LOWER(COALESCE(av_folder.app_name, app.name)) LIKE :name OR (app.type = :workflowType AND LOWER(app.name) LIKE :name))'
            : // gitsync off: non-workflows match any app_version's name;
              // workflows match app.name.
              `(EXISTS (SELECT 1 FROM app_versions av_n WHERE av_n.app_id = app.id AND LOWER(av_n.app_name) LIKE :name) OR (app.type = :workflowType AND LOWER(app.name) LIKE :name))`,
          { name: `%${searchKey.toLowerCase()}%`, workflowType: APP_TYPES.WORKFLOW }
        );
      }

      const folderApps = await folderAppsQb.getMany();

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

      const viewableAppsInFolder = this.getBaseAppsQuery(manager, folderAppIds, searchKey, branchId);
      this.addViewableFrontendFilter(viewableAppsInFolder, folderAppIds, effectiveAppPermissions);

      // Branch presence is already enforced by the INNER JOIN in getBaseAppsQuery
      // (appVersions.branchId = :branchId). No secondary filter needed.

      const [viewableApps, totalCount] = await Promise.all([
        viewableAppsInFolder
          .take(9)
          .skip(9 * (page - 1))
          .orderBy('apps.createdAt', 'DESC')
          .getMany(),
        viewableAppsInFolder.getCount(),
      ]);

      return {
        viewableApps,
        totalCount,
      };
    });
  }

  async create(folderId: string, appId: string, skipGitSyncCheck = false): Promise<FolderApp> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existingFolderApp = await manager.findOne(FolderApp, {
        where: { appId },
      });

      // If app is already in a folder, remove it first (apps can only be in one folder)
      if (existingFolderApp) {
        if (existingFolderApp.folderId === folderId && !skipGitSyncCheck) {
          throw new BadRequestException('App has already been added to the folder');
        }
        await manager.delete(FolderApp, { id: existingFolderApp.id });
      }

      // TODO: check if folder under user.organizationId and user has edit permission on app

      const newFolderApp = manager.create(FolderApp, {
        folderId,
        appId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await manager.save(FolderApp, newFolderApp);
    });
  }

  protected addViewableFrontendFilter(
    query: SelectQueryBuilder<AppBase>,
    folderAppIds: string[],
    userAppPermissions: UserAppsPermissions
  ): SelectQueryBuilder<AppBase> {
    const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;

    const hiddenNonEditable = userAppPermissions.hiddenAppsId.filter(
      (id) => !userAppPermissions.editableAppsId.includes(id)
    );

    const explicitVisibleApps = Array.from(
      new Set([...userAppPermissions.editableAppsId, ...userAppPermissions.viewableAppsId])
    );

    const viewableAppsTotal = isAllEditable
      ? [null, ...folderAppIds]
      : hideAll
        ? [null, ...explicitVisibleApps] // key fix: include folder-derived viewable IDs
        : isAllViewable
          ? [null, ...folderAppIds].filter((id) => !hiddenNonEditable.includes(id))
          : [
              null,
              ...Array.from(
                new Set([
                  ...userAppPermissions.editableAppsId,
                  ...userAppPermissions.viewableAppsId.filter((id) => !hiddenNonEditable.includes(id)),
                ])
              ),
            ];

    // Keep only apps in this folder
    const viewableAppIds = [null, ...viewableAppsTotal.filter((id) => folderAppIds.includes(id))];

    query.where('apps.id IN (:...viewableAppIds)', {
      viewableAppIds,
    });

    return query;
  }
}
