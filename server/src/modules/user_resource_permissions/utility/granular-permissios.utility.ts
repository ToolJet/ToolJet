import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { USER_ROLE, ERROR_HANDLER } from '../constants/group-permissions.constant';
import { BadRequestException } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { GranularPermissionQuerySearchParam, ResourceGroupActions } from '../interface/granular-permissions.interface';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';

export function validateGranularPermissionCreateOperation(group: GroupPermissions) {
  if (group.name === USER_ROLE.ADMIN)
    throw new BadRequestException(ERROR_HANDLER.ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS);
}

export function validateGranularPermissionUpdateOperation(group: GroupPermissions, organizationId: string) {
  if (group.organizationId !== organizationId) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
  if (group.name === USER_ROLE.ADMIN)
    throw new BadRequestException(ERROR_HANDLER.ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS);
}

export function validateAppResourcePermissionUpdateOperation(group: GroupPermissions, actions: ResourceGroupActions) {
  if (group.name === USER_ROLE.END_USER && actions.canEdit)
    throw new BadRequestException(ERROR_HANDLER.EDITOR_LEVEL_PERMISSION_NOT_ALLOWED_END_USER);
}

export function getAllGranularPermissionQuery(
  searchParam: GranularPermissionQuerySearchParam,
  manager: EntityManager
): SelectQueryBuilder<GranularPermissions> {
  const query = manager
    .createQueryBuilder(GranularPermissions, 'granularPermissions')
    .innerJoinAndSelect(
      'granularPermissions.appsGroupPermissions',
      'appsGroupPermissions',
      'appsGroupPermissions.granularPermissionId = granularPermissions.id'
    )
    .leftJoinAndSelect('appsGroupPermissions.groupApps', 'groupApps')
    .leftJoinAndSelect('groupApps.app', 'app');
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
    .innerJoinAndSelect(
      'granularPermissions.appsGroupPermissions',
      'appsGroupPermissions',
      'appsGroupPermissions.granularPermissionId = granularPermissions.id'
    )
    .where('granularPermissions.id = :id', {
      id,
    });
  //for ee add data sources group permissions
  return query;
}
