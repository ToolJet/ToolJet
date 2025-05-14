import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { Injectable } from '@nestjs/common';
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
    userAppPermissions: UserAppsPermissions,
    manager: EntityManager,
    type = 'front-end',
    searchKey?: string
  ): Promise<Folder[]> {
    return this.getFolderQuery(user.organizationId, manager, userAppPermissions, type, searchKey).distinct().getMany();
  }

  private getFolderQuery(
    organizationId: string,
    manager: EntityManager,
    userAppPermissions: UserAppsPermissions,
    type = 'front-end',
    searchKey?: string
  ): SelectQueryBuilder<Folder> {
    const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;
    const viewableApps = userAppPermissions.hideAll
      ? [null, ...userAppPermissions.editableAppsId]
      : [
          null,
          ...Array.from(
            new Set([
              ...userAppPermissions.editableAppsId,
              ...userAppPermissions.viewableAppsId.filter((id) => !userAppPermissions.hiddenAppsId.includes(id)),
            ])
          ),
        ];
    const hiddenApps = [
      ...userAppPermissions.hiddenAppsId.filter((id) => !userAppPermissions.editableAppsId.includes(id)),
    ];
    const query = manager.createQueryBuilder(Folder, 'folders');
    query.leftJoinAndSelect('folders.folderApps', 'folder_apps');
    query.leftJoin('folder_apps.app', 'app');

    if (!isAllEditable) {
      // Not all apps are editable - filter with view privilege
      if (!isAllViewable) {
        // Not all apps are viewable
        query.andWhere('folder_apps.appId IN (:...viewableApps)', {
          viewableApps,
        });
      } else if (!hideAll && hiddenApps?.length) {
        // Not all apps are hidden
        query.andWhere('folder_apps.appId NOT IN (:...hiddenApps)', {
          hiddenApps,
        });
      } else if (hideAll) {
        // No need to return any
        query.andWhere('1=0');
      }
    }

    if (searchKey) {
      query.andWhere('LOWER(app.name) like :searchKey', {
        searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
      });
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
  async getAppsFor(
    user: User,
    folder: Folder,
    page: number,
    searchKey: string,
    type: APP_TYPES
  ): Promise<{
    viewableApps: AppBase[];
    totalCount: number;
  }> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const folderApps = await manager
        .createQueryBuilder(FolderApp, 'folderApp')
        .innerJoin('folderApp.app', 'app', 'folderApp.folderId = :id', {
          id: folder.id,
        })
        .where('LOWER(app.name) LIKE :name', { name: `%${(searchKey ?? '').toLowerCase()}%` })
        .getMany();

      let resourceType: MODULES;

      switch (type) {
        case APP_TYPES.WORKFLOW:
          resourceType = MODULES.WORKFLOWS;
          break;
        case APP_TYPES.FRONT_END:
          resourceType = MODULES.APP;
          break;
        default:
          resourceType = MODULES.APP;
      }

      const userPermission = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: resourceType }],
        organizationId: user.organizationId,
      });
      const userAppPermissions = userPermission?.[resourceType];

      const folderAppIds = folderApps.map((folderApp) => folderApp.appId);
      if (folderAppIds.length == 0) {
        return {
          viewableApps: [],
          totalCount: 0,
        };
      }

      const viewableAppsInFolder = manager
        .createQueryBuilder(AppBase, 'apps')
        .innerJoin('apps.user', 'user')
        .addSelect(['user.firstName', 'user.lastName']);

      switch (type) {
        case APP_TYPES.WORKFLOW:
          this.addViewableWorkflowFilter(
            viewableAppsInFolder,
            folderAppIds,
            userAppPermissions as UserWorkflowPermissions
          );
          break;
        case APP_TYPES.FRONT_END:
          this.addViewableFrontendFilter(viewableAppsInFolder, folderAppIds, userAppPermissions as UserAppsPermissions);
          break;
        default:
          this.addViewableFrontendFilter(viewableAppsInFolder, folderAppIds, userAppPermissions as UserAppsPermissions);
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
    });
  }

  private addViewableWorkflowFilter(
    query: SelectQueryBuilder<AppBase>,
    folderAppIds: string[],
    userWorkflowPermissions: UserWorkflowPermissions
  ): SelectQueryBuilder<AppBase> {
    const { isAllEditable, isAllExecutable } = userWorkflowPermissions;

    const viewableAppsTotal =
      isAllEditable || isAllExecutable
        ? [null, ...folderAppIds]
        : [
            null,
            ...Array.from(
              new Set([
                ...userWorkflowPermissions.editableWorkflowsId,
                ...userWorkflowPermissions.executableWorkflowsId,
              ])
            ),
          ];

    const viewableAppIds = [null, ...viewableAppsTotal.filter((id) => folderAppIds.includes(id))];

    query.where('apps.id IN (:...viewableAppIds)', {
      viewableAppIds,
    });

    return query;
  }

  private addViewableFrontendFilter(
    query: SelectQueryBuilder<AppBase>,
    folderAppIds: string[],
    userAppPermissions: UserAppsPermissions
  ): SelectQueryBuilder<AppBase> {
    const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;

    const viewableAppsTotal = isAllEditable
      ? [null, ...folderAppIds]
      : hideAll
      ? [null, ...userAppPermissions.editableAppsId]
      : isAllViewable
      ? [null, ...folderAppIds].filter((id) => !userAppPermissions.hiddenAppsId.includes(id))
      : [
          null,
          ...Array.from(
            new Set([
              ...userAppPermissions.editableAppsId,
              ...userAppPermissions.viewableAppsId.filter((id) => !userAppPermissions.hiddenAppsId.includes(id)),
            ])
          ),
        ];

    const viewableAppIds = [null, ...viewableAppsTotal.filter((id) => folderAppIds.includes(id))];

    query.where('apps.id IN (:...viewableAppIds)', {
      viewableAppIds,
    });

    return query;
  }
}
