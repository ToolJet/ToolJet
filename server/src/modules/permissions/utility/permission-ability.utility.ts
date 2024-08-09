import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { ResourcePermissionQueryObject, ResourcesItem } from '../interface/permissions-ability.interface';
import { TOOLJET_RESOURCE } from 'src/constants/global.constant';
import { PERMISSION_RESOURCE_MAPPING } from '../constants/permissions-ability.constant';

export function getUserPermissionsQuery(
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
    const resourceTypes = Array.from(new Set(resources.map((item) => item.resource)));
    const orConditions = Array.from(resourceTypes)
      .map((resource, index) => `granularPermissions.type = :type${index}`)
      .join(' OR ');
    const parameters = resourceTypes.reduce((params, resource, index) => {
      params[`type${index}`] = PERMISSION_RESOURCE_MAPPING[resource];
      return params;
    }, {});
    query
      .leftJoin('groupPermissions.groupGranularPermissions', 'granularPermissions')
      .andWhere(
        new Brackets((qb) => {
          qb.where(orConditions, parameters).orWhere('granularPermissions.id IS NULL');
        })
      )
      .addSelect(['granularPermissions.isAll', 'granularPermissions.type']);
  }

  if (resources?.length) {
    const appsResourcesList = resources.filter((item) => item.resource === TOOLJET_RESOURCE.APP);
    if (appsResourcesList?.length) {
      addAppsPermissionsTOQuery(query, appsResourcesList);
    }
  }

  return query;
}

function addAppsPermissionsTOQuery(query: SelectQueryBuilder<GroupPermissions>, appsList?: ResourcesItem[]) {
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
