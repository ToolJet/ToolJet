import { Injectable } from '@nestjs/common';
import { ResourcePermissionQueryObject, ResourcesItem, UserAppsPermissions } from './types';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { MODULES } from '@modules/app/constants/modules';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppBase } from '@entities/app_base.entity';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { DEFAULT_USER_APPS_PERMISSIONS } from './constants';
import { RolesRepository } from '@modules/roles/repository';

@Injectable()
export class AbilityUtilService {
  constructor(private readonly roleRepository: RolesRepository) {}
  getUserPermissionsQuery(
    userId: string,
    resourcePermissionObject: ResourcePermissionQueryObject,
    manager: EntityManager
  ): SelectQueryBuilder<GroupPermissions> {
    const { organizationId, resources } = resourcePermissionObject;
    const query = manager
      .createQueryBuilder(GroupPermissions, 'groupPermissions')
      .innerJoin('groupPermissions.groupUsers', 'groupUsers', 'groupUsers.userId = :userId', {
        userId,
      })
      .where('groupPermissions.organizationId = :organizationId', {
        organizationId,
      });

    if (resources?.length) {
      query
        .leftJoin('groupPermissions.groupGranularPermissions', 'granularPermissions')
        .addSelect(['granularPermissions.isAll', 'granularPermissions.type']);
    }

    if (resources?.length) {
      const appsResourcesList = resources.filter((item) => item.resource === MODULES.APP);
      const dataSourcesResourcesList = resources.filter((item) => item.resource === MODULES.GLOBAL_DATA_SOURCE);
      if (appsResourcesList?.length) {
        this.addAppsPermissionsTOQuery(query, appsResourcesList);
      }
      if (dataSourcesResourcesList?.length) {
        this.addDataSourcesPermissionsTOQuery(query, dataSourcesResourcesList);
      }
    }

    return query;
  }

  private addAppsPermissionsTOQuery(query: SelectQueryBuilder<GroupPermissions>, appsList?: ResourcesItem[]) {
    query
      .leftJoin('granularPermissions.appsGroupPermissions', 'appsGroupPermissions')
      .leftJoin('appsGroupPermissions.groupApps', 'groupApps')
      .addSelect([
        'groupApps.appId',
        'appsGroupPermissions.canEdit',
        'appsGroupPermissions.canView',
        'appsGroupPermissions.hideFromDashboard',
      ]);

    const appsIdList = Array.from(new Set(appsList?.filter((item) => item?.resourceId).map((item) => item.resourceId)));

    if (appsIdList?.length) {
      query.andWhere(
        new Brackets((qb) => {
          appsIdList.forEach((appId, index) => {
            if (index === 0) {
              qb.where('groupApps.appId = :appId', { appId })
                .orWhere('granularPermissions.isAll = true')
                .orWhere('groupApps.id IS NULL');
            } else {
              qb.orWhere('groupApps.appId = :appId', { appId });
            }
          });
        })
      );
    }
  }

  private addDataSourcesPermissionsTOQuery(
    query: SelectQueryBuilder<GroupPermissions>,
    dataSourcesList?: ResourcesItem[]
  ) {
    query
      .leftJoin('granularPermissions.dataSourcesGroupPermission', 'dataSourcesGroupPermission')
      .leftJoin('dataSourcesGroupPermission.groupDataSources', 'groupDataSources')
      .addSelect([
        'groupDataSources.dataSourceId',
        'dataSourcesGroupPermission.canConfigure',
        'dataSourcesGroupPermission.canUse',
      ]);

    const dataSourcesIdList = Array.from(
      new Set(dataSourcesList?.filter((item) => item?.resourceId).map((item) => item.resourceId))
    );

    if (dataSourcesIdList?.length) {
      query.andWhere(
        new Brackets((qb) => {
          dataSourcesIdList.forEach((dataSourceId, index) => {
            if (index === 0) {
              qb.where('groupDataSources.dataSourceId = :dataSourceId', { dataSourceId })
                .orWhere('granularPermissions.isAll = true')
                .orWhere('groupDataSources.id IS NULL');
            } else {
              qb.orWhere('groupDataSources.dataSourceId = :dataSourceId', { dataSourceId });
            }
          });
        })
      );
    }
  }

  async createUserAppsPermissions(
    appsGranularPermissions: GranularPermissions[],
    user: User,
    manager: EntityManager
  ): Promise<UserAppsPermissions> {
    const userAppsPermissions: UserAppsPermissions = { ...DEFAULT_USER_APPS_PERMISSIONS };

    appsGranularPermissions.forEach((permission) => {
      const appsPermission = permission?.appsGroupPermissions;

      const groupApps = appsPermission?.groupApps ? appsPermission.groupApps.map((item) => item.appId) : [];

      userAppsPermissions.isAllEditable =
        userAppsPermissions.isAllEditable || (permission.isAll && appsPermission?.canEdit);
      userAppsPermissions.editableAppsId = Array.from(
        new Set([...userAppsPermissions.editableAppsId, ...(appsPermission?.canEdit ? groupApps : [])])
      );
      userAppsPermissions.isAllViewable =
        userAppsPermissions.isAllViewable || (permission.isAll && appsPermission?.canView);
      userAppsPermissions.viewableAppsId = Array.from(
        new Set([...userAppsPermissions.viewableAppsId, ...(appsPermission?.canView ? groupApps : [])])
      );
      userAppsPermissions.hiddenAppsId = Array.from(
        new Set([...userAppsPermissions.hiddenAppsId, ...(appsPermission?.hideFromDashboard ? groupApps : [])])
      );
      userAppsPermissions.hideAll =
        userAppsPermissions.hideAll || (appsPermission?.hideFromDashboard && permission.isAll);
    });

    // Use the provided manager to perform database operations
    await dbTransactionWrap(async (manager: EntityManager) => {
      const appsOwnedByUser = await manager.find(AppBase, {
        where: { userId: user.id, organizationId: user.organizationId },
      });

      const appsIdOwnedByUser = appsOwnedByUser.map((app) => app.id);
      userAppsPermissions.editableAppsId = Array.from(
        new Set([...userAppsPermissions.editableAppsId, ...appsIdOwnedByUser])
      );
    }, manager);

    return userAppsPermissions;
  }

  async isBuilder(user: User): Promise<boolean> {
    return USER_ROLE.BUILDER === (await this.roleRepository.getUserRole(user.id, user.organizationId))?.name;
  }
}
