import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { ResourcePermissionQueryObject } from '../interface/permissions-ability.interface';
import { TOOLJET_RESOURCE } from 'src/constants/global.constant';
import { ACTIONS_DATA_POINTS, PERMISSION_RESOURCE_MAPPING } from '../constants/permissions-ability.constant';

export function getUserPermissionsQuery(
  userId: string,
  resourcePermissionObject: ResourcePermissionQueryObject,
  manager: EntityManager
): SelectQueryBuilder<GroupPermissions> {
  const { organizationId, resource, action } = resourcePermissionObject;
  const query = manager
    .createQueryBuilder(GroupPermissions, 'groupPermissions')
    .where('groupPermissions.organizationId = :organizationId', {
      organizationId,
    })
    .innerJoin('groupPermissions.groupUsers', 'groupUsers', 'groupUsers.userId = :userId', {
      userId,
    });
  if (resource in [TOOLJET_RESOURCE.APP]) {
    query.innerJoinAndSelect(
      'groupPermissions.groupGranularPermissions',
      'granularPermissions',
      'granularPermissions.type = :type',
      {
        type: PERMISSION_RESOURCE_MAPPING[resource],
      }
    );
    if (resource === TOOLJET_RESOURCE.APP) {
      addAppsPermissionsTOQuery(query, resourcePermissionObject);
    }
  } else if (action) {
    query.where(`groupPermissions.${ACTIONS_DATA_POINTS[resource][action]} = true`);
  }
  return query;
}

function addAppsPermissionsTOQuery(
  query: SelectQueryBuilder<GroupPermissions>,
  resourcePermissionObject: ResourcePermissionQueryObject
) {
  const { resourceId, action } = resourcePermissionObject;
  query
    .innerJoinAndSelect('granularPermissions.appsGroupPermissions', 'appsGroupPermissions')
    .innerJoinAndSelect('appsGroupPermissions.groupApps', 'groupApps');

  if (action) {
    query.where(`appsGroupPermissions.${ACTIONS_DATA_POINTS[TOOLJET_RESOURCE.APP][action]} = true`);
  }
  if (resourceId) {
    query.where(
      new Brackets((qb) => {
        qb.where('groupApps.appId = :appId', { appId: resourceId }).orWhere('granularPermissions.isAll = true');
      })
    );
  }
}
