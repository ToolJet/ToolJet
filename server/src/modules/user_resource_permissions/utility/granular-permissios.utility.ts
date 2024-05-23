import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { USER_ROLE } from '../constants/group-permissions.constant';
import { BadRequestException } from '@nestjs/common';
import { ERROR_HANDLER } from '../constants/granular-permissions.constant';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { GranularPermissionQuerySearchParam } from '../interface/granular-permissions.interface';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';

export function validateGranularPermissionCreateOperation(group: GroupPermissions) {
  if (group.name != USER_ROLE.ADMIN)
    throw new BadRequestException(ERROR_HANDLER.ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS);
}

export function validateGranularPermissionUpdateOperation(group: GroupPermissions) {
  if (group.name != USER_ROLE.ADMIN)
    throw new BadRequestException(ERROR_HANDLER.ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS);
}

export function getAllGranularPermissionQuery(
  searchParam: GranularPermissionQuerySearchParam,
  manager: EntityManager
): SelectQueryBuilder<GranularPermissions> {
  const query = manager
    .createQueryBuilder(GranularPermissions, 'granularPermissions')
    .innerJoin(
      'apps_group_permissions',
      'appsGroupPermissions',
      'appsGroupPermission.granular_permission_id = granularPermissions.id'
    )
    .select(['granularPermissions', 'appsGroupPermissions']);
  const { name, type, groupId } = searchParam;
  if (groupId) {
    query.where('granularPermissions.groupId = :groupId', {
      groupId,
    });
  }

  if (name) {
    query.where(`granularPermissions.name ${name.useLike ? 'LIKE' : '='} :name`, {
      name: name.useLike ? `%${name.value}%` : name.value,
    });
  }
  if (type) {
    query.where('granularPermissions.type = :type', {
      type,
    });
  }
  //for ee add data sources group permissions
  return query;
}

export function getGranularPermissionQuery(
  id: string,
  manager: EntityManager
): SelectQueryBuilder<GranularPermissions> {
  const query = manager
    .createQueryBuilder(GranularPermissions, 'granularPermissions')
    .innerJoinAndSelect('granularPermissions.group', 'groupPermissions')
    .innerJoin(
      'apps_group_permissions',
      'appsGroupPermissions',
      'appsGroupPermission.granular_permission_id = granularPermissions.id'
    )
    .select(['granularPermissions', 'appsGroupPermissions'])
    .where('granularPermissions.id = :id', {
      id,
    });
  //for ee add data sources group permissions
  return query;
}
