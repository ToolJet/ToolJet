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
import { DEFAULT_USER_APPS_PERMISSIONS, RESOURCE_TO_APP_TYPE_MAP } from './constants';
import { RolesRepository } from '@modules/roles/repository';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class AbilityUtilService {
  constructor(private readonly roleRepository: RolesRepository) {}

  private getAppTypeConditions(resourcesList: ResourcesItem[]): { conditions: string[]; params: Record<string, any> } {
    const conditions: string[] = [];
    const params: Record<string, any> = {};
    let paramIndex = 0;

    // Get unique resource types from the list
    const resourceTypes = Array.from(new Set(resourcesList.map((item) => item.resource)));

    resourceTypes.forEach((resourceType) => {
      const appType = RESOURCE_TO_APP_TYPE_MAP[resourceType];
      if (appType) {
        const paramName = `appType${paramIndex}`;
        conditions.push(`appsGroupPermissions.appType = :${paramName}`);
        params[paramName] = appType;
        paramIndex++;
      }
    });

    return { conditions, params };
  }

  private addAppsAndWorkflowPermissionsTOQuery(
    query: SelectQueryBuilder<GroupPermissions>,
    resourcesList?: ResourcesItem[]
  ) {
    query
      .leftJoin('granularPermissions.appsGroupPermissions', 'appsGroupPermissions')
      .leftJoin('appsGroupPermissions.groupApps', 'groupApps')
      .addSelect([
        'groupApps.appId',
        'appsGroupPermissions.canEdit',
        'appsGroupPermissions.canView',
        'appsGroupPermissions.hideFromDashboard',
        'appsGroupPermissions.appType',
      ]);

    const resourceIdList = Array.from(
      new Set(resourcesList?.filter((item) => item?.resourceId).map((item) => item.resourceId))
    );

    if (resourceIdList?.length) {
      query.andWhere(
        new Brackets((qb) => {
          resourceIdList.forEach((resourceId, index) => {
            if (index === 0) {
              const { conditions, params } = this.getAppTypeConditions(resourcesList);

              // Combine conditions with OR if multiple types are present
              const typeCondition = conditions.length > 1 ? `(${conditions.join(' OR ')})` : conditions[0];

              qb.where(`(${typeCondition}) AND groupApps.appId = :resourceId`, {
                resourceId,
                ...params,
              })
                .orWhere('granularPermissions.isAll = true')
                .orWhere('groupApps.id IS NULL');
            } else {
              qb.orWhere('groupApps.appId = :resourceId', { resourceId });
            }
          });
        })
      );
    }
  }

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
      const appsAndWorkflowResourcesList = resources.filter(
        (item) => item.resource === MODULES.APP || item.resource === MODULES.WORKFLOWS
      );
      const dataSourcesResourcesList = resources.filter((item) => item.resource === MODULES.GLOBAL_DATA_SOURCE);

      if (appsAndWorkflowResourcesList?.length) {
        this.addAppsAndWorkflowPermissionsTOQuery(query, appsAndWorkflowResourcesList);
      }
      if (dataSourcesResourcesList?.length) {
        this.addDataSourcesPermissionsTOQuery(query, dataSourcesResourcesList);
      }
    }

    return query;
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
        where: { userId: user.id, organizationId: user.organizationId, type: APP_TYPES.FRONT_END },
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
