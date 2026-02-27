import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { IFolderAppsUtilService } from './interfaces/IUtilService';
import { AppBase } from '@entities/app_base.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { FolderApp } from '@entities/folder_app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { UserAppsPermissions, UserFolderPermissions, UserWorkflowPermissions } from '@modules/ability/types';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { APP_TYPES } from '@modules/apps/constants';
import { AppGitSync } from '@entities/app_git_sync.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GroupFolders } from '@entities/group_folders.entity';

@Injectable()
class FolderAppsUtilService implements IFolderAppsUtilService {
  private readonly logger = new Logger(FolderAppsUtilService.name);
  constructor(protected readonly abilityService: AbilityService) {}

  async allFoldersWithAppCount(
    user: User,
    userAppPermissions: UserAppsPermissions | UserWorkflowPermissions,
    manager: EntityManager,
    type = APP_TYPES.FRONT_END,
    searchKey?: string
  ): Promise<Folder[]> {
    return this.getFolderQuery(user.organizationId, manager, userAppPermissions as UserAppsPermissions, type, searchKey)
      .distinct()
      .getMany();
  }

  protected getBaseFolderQuery(
    organizationId: string,
    manager: EntityManager,
    type: APP_TYPES,
    searchKey?: string
  ): SelectQueryBuilder<Folder> {
    const query = manager.createQueryBuilder(Folder, 'folders');
    query.leftJoinAndSelect('folders.folderApps', 'folder_apps');
    query.leftJoin('folder_apps.app', 'app');

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

  protected getFolderQuery(
    organizationId: string,
    manager: EntityManager,
    userAppPermissions: UserAppsPermissions,
    type = APP_TYPES.FRONT_END,
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

    const query = this.getBaseFolderQuery(organizationId, manager, type, searchKey);

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

    return query;
  }

  protected getBaseAppsQuery(
    manager: EntityManager,
    folderAppIds: string[],
    searchKey?: string
  ): SelectQueryBuilder<AppBase> {
    const query = manager
      .createQueryBuilder(AppBase, 'apps')
      .innerJoin('apps.user', 'user')
      .addSelect(['user.firstName', 'user.lastName']);

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

      const userPermission = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: MODULES.APP }, { resource: MODULES.FOLDER }],
        organizationId: user.organizationId,
      });

      const userAppPermissions = userPermission?.[MODULES.APP];
      const userFolderPermissions = userPermission?.[MODULES.FOLDER];
      const folderAppIds = folderApps.map((folderApp) => folderApp.appId);
      if (folderAppIds.length == 0) {
        return {
          viewableApps: [],
          totalCount: 0,
        };
      }

      const viewableAppsInFolder = this.getBaseAppsQuery(manager, folderAppIds, searchKey);
      this.addViewableFrontendFilter(
        viewableAppsInFolder,
        folderAppIds,
        userAppPermissions,
        userFolderPermissions,
        folder.id
      );

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

      if (existingFolderApp) {
        throw new BadRequestException(
          'Apps can only be in one folder at a time. To add this app here, remove it from its current folder first.'
        );
      }

      // Skip this check when called from app import flow
      if (!skipGitSyncCheck) {
        const gitSyncedApp = await manager.findOne(AppGitSync, {
          where: { appId },
          select: ['id'],
        });

        if (gitSyncedApp) {
          throw new BadRequestException('Git-synced app cannot be moved to the folder');
        }
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
    userAppPermissions: UserAppsPermissions,
    userFolderPermissions: UserFolderPermissions,
    folderId?: string
  ): SelectQueryBuilder<AppBase> {
    // check for folder-level access
    if (folderId) {
      const canEditFolder =
        userFolderPermissions?.isAllEditable || userFolderPermissions?.editableFoldersId?.includes(folderId);

      const canEditApps =
        userFolderPermissions?.isAllEditApps || userFolderPermissions?.editAppsInFoldersId?.includes(folderId);

      const canViewApps =
        userFolderPermissions?.isAllViewable || userFolderPermissions?.viewableFoldersId?.includes(folderId);

      if (canEditFolder || canEditApps || canViewApps) {
        // User has explicit folder-level access — show all apps in folder
        query.where('apps.id IN (:...folderAppIds)', { folderAppIds });
        return query;
      }
    }

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

  protected async getFolderLevelPermissions(
    user: User,
    folder: Folder,
    manager: EntityManager
  ): Promise<{
    canEditFolderOrApps: boolean;
    canViewApps: boolean;
  }> {
    this.logger.debug(`viewableAppsInFolder ${folder.id}, userId: ${user.id}`);
    const folderGroupPerms = await manager
      .createQueryBuilder(FoldersGroupPermissions, 'fgp')
      .select(['fgp.id', 'fgp.canEditFolder', 'fgp.canEditApps', 'fgp.canViewApps'])
      .innerJoin(GranularPermissions, 'gp', 'gp.id = fgp.granular_permission_id')
      .innerJoin(GroupPermissions, 'grp', 'grp.id = gp.group_id')
      .innerJoin(GroupUsers, 'gu', 'gu.group_id = grp.id')
      .innerJoin(GroupFolders, 'gf', 'gf.folders_group_permissions_id = fgp.id AND gf.folder_id = :folderId', {
        folderId: folder.id,
      })
      .where('gu.user_id = :userId', {
        userId: user.id,
      })
      .getMany();

    this.logger.debug(`folderGroupPerms ${folderGroupPerms.length}, values: ${JSON.stringify(folderGroupPerms)}`);

    return {
      canEditFolderOrApps: folderGroupPerms.some((p) => p.canEditFolder || p.canEditApps),
      canViewApps: folderGroupPerms.some((p) => p.canViewApps),
    };
  }
}

export default FolderAppsUtilService
