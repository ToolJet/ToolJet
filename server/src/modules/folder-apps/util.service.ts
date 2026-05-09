import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { IFolderAppsUtilService } from './interfaces/IUtilService';
import { AppBase } from '@entities/app_base.entity';
import { dbTransactionWrap, getConnectionInstance } from '@helpers/database.helper';
import { FolderApp } from '@entities/folder_app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { UserAppsPermissions, UserWorkflowPermissions } from '@modules/ability/types';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { APP_TYPES } from '@modules/apps/constants';

export function applyAppPermissionFilter(
  query: SelectQueryBuilder<FolderApp>,
  userAppPermissions: UserAppsPermissions
): void {
  const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;
  if (isAllEditable) return;

  const hiddenNonEditable = userAppPermissions.hiddenAppsId.filter(
    (id) => !userAppPermissions.editableAppsId.includes(id)
  );
  const explicitVisibleApps = Array.from(
    new Set([...userAppPermissions.editableAppsId, ...userAppPermissions.viewableAppsId])
  );
  const viewableApps = hideAll
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
    _branchId?: string
  ): Promise<FolderApp[]> {
    if (folderIds.length === 0) return [];

    const query = this.buildFolderAppsQuery(manager, folderIds, searchKey);
    applyAppPermissionFilter(query, userAppPermissions as UserAppsPermissions);
    return query.getMany();
  }

  protected buildFolderAppsQuery(
    manager: EntityManager,
    folderIds: string[],
    searchKey?: string
  ): SelectQueryBuilder<FolderApp> {
    const query = manager
      .createQueryBuilder(FolderApp, 'folder_apps')
      .leftJoin('folder_apps.app', 'app')
      .where('folder_apps.folderId IN (:...folderIds)', { folderIds });

    if (searchKey) {
      query.andWhere('LOWER(app.name) LIKE :searchKey', {
        searchKey: `%${searchKey.toLowerCase()}%`,
      });
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
      query.innerJoinAndSelect('apps.appVersions', 'appVersions', 'appVersions.branchId = :branchId', { branchId });
    }

    if (searchKey) {
      query.andWhere('LOWER(apps.name) LIKE :searchKey', {
        searchKey: `%${searchKey.toLowerCase()}%`,
      });
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
    const folderApps = await manager
        .createQueryBuilder(FolderApp, 'folderApp')
        .innerJoin('folderApp.app', 'app', 'folderApp.folderId = :id', {
          id: folder.id,
        })
        .where('LOWER(app.name) LIKE :name', { name: `%${(searchKey ?? '').toLowerCase()}%` })
        .getMany();

      const userPermission = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: MODULES.APP }],
        organizationId: user.organizationId,
      });
      const userAppPermissions = userPermission?.[MODULES.APP];

      const folderAppIds = folderApps.map((folderApp) => folderApp.appId);
      if (folderAppIds.length == 0) {
        return {
          viewableApps: [],
          totalCount: 0,
        };
      }

      const viewableAppsInFolder = this.getBaseAppsQuery(manager, folderAppIds, searchKey, branchId);
      this.addViewableFrontendFilter(viewableAppsInFolder, folderAppIds, userAppPermissions);

      if (branchId) {
        viewableAppsInFolder.andWhere(
          `(
            NOT EXISTS (
              SELECT 1 FROM app_versions av
              WHERE av.app_id = apps.id
              AND av.branch_id IS NOT NULL
            )
            OR EXISTS (
              SELECT 1 FROM app_versions av
              WHERE av.app_id = apps.id
              AND av.branch_id = :folderAppsBranchId
            )
          )`,
          { folderAppsBranchId: branchId }
        );
      }

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
