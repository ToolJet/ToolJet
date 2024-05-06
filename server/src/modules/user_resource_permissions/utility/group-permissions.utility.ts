import { SelectQueryBuilder, createQueryBuilder } from 'typeorm';
import { USER_ROLE, GROUP_PERMISSIONS_TYPE } from '../constants/group-permissions.constant';
import { User } from 'src/entities/user.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { CreateGroupPermissionDto, UpdateGroupPermissionDto } from '@dto/group_permissions.dto';
import { ERROR_HANDLER } from '@module/user_resource_permissions/constants/group-permissions.constant';
import { GroupUsers } from 'src/entities/group_users.entity';

export function getRoleUsersListQuery(
  role: USER_ROLE,
  organizationId: string,
  groupPermissionId?: string
): SelectQueryBuilder<User> {
  const query = createQueryBuilder(User, 'user')
    .select([
      'users.id',
      'users.firstName',
      'users.lastName',
      'users.email',
      'user.userGroup.groupId',
      'user.userGroup.group.name',
      'user.userGroup.group.type',
    ])
    .innerJoin('user.userGroups', 'userGroups')
    .innerJoin('userGroups.group', 'group', 'group.organizationId = :organizationId', { organizationId })
    .andWhere('group.type = :type', { type: GROUP_PERMISSIONS_TYPE.DEFAULT })
    .andWhere('group.name = :name', { name: role });

  if (groupPermissionId) {
    query.andWhere(
      'user.id IN ' +
        query
          .subQuery()
          .select('user.id')
          .from('User', 'user')
          .innerJoin('user.userGroups', 'subUserGroup')
          .where('subUserGroup.groupId = :groupId', { groupId: groupPermissionId })
          .getQuery()
    );
  }

  return query;
}

export function getUserDetailQuery(userId: string, organizationId: string): SelectQueryBuilder<User> {
  const query = createQueryBuilder(User, 'user')
    .innerJoin('user.organizationUsers', 'organizationUsers', 'organizationUsers.organizationId = :organizationId', {
      organizationId,
    })
    .where('user.id = = :userId', {
      userId,
    });

  return query;
}

export function getUserRoleQuery(userId: string, organizationId: string): SelectQueryBuilder<GroupPermissions> {
  const query = createQueryBuilder(GroupPermissions, 'role')
    .innerJoin('role.groupUsers', 'groupUsers', 'groupUsers.userId = :userId', { userId })
    .where('role.type = :type', { type: GROUP_PERMISSIONS_TYPE.DEFAULT })
    .andWhere('role.organizationId = :organizationId', { organizationId });

  return query;
}

export function validateUpdateGroupOperation(
  group: GroupPermissions,
  updateGroupPermissionDto: UpdateGroupPermissionDto
): void {
  const { name } = group;
  const { name: newName } = updateGroupPermissionDto;

  if (newName && (newName in USER_ROLE || group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)) {
    throw new MethodNotAllowedException(ERROR_HANDLER.DEFAULT_GROUP_NAME_UPDATE);
  }
  if (name in [USER_ROLE.ADMIN, USER_ROLE.END_USER]) {
    throw new MethodNotAllowedException(ERROR_HANDLER.NON_EDITABLE_GROUP_UPDATE);
  }
}

export function validateDeleteGroupUserOperation(group: GroupPermissions) {
  if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);

  if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
    throw new MethodNotAllowedException(ERROR_HANDLER.DELETING_DEFAULT_GROUP_USER);
}

export function validateAddGroupUserOperation(group: GroupPermissions, user: User) {
  if (!user) throw new BadRequestException(ERROR_HANDLER.ADD_GROUP_USER_NON_EXISTING_USER);
  if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
  if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
    throw new MethodNotAllowedException(ERROR_HANDLER.ADD_GROUP_USER_DEFAULT_GROUP);
}

export function getAllUserGroupsQuery(userId: string, organizationId: string): SelectQueryBuilder<GroupUsers> {
  const query = createQueryBuilder(GroupUsers, 'userGroups')
    .innerJoin('userGroups.group', 'group', 'group.organizationId = :organizationId', { organizationId })
    .where('userGroups.userId = :userId', {
      userId,
    })
    .andWhere('group.type = :type', {
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    });
  return query;
}

export function validateCreateGroupOperation(createGroupPermissionDto: CreateGroupPermissionDto) {
  if (createGroupPermissionDto.name in USER_ROLE) throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_NAME);
}
