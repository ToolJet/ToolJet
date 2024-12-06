import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { USER_ROLE, GROUP_PERMISSIONS_TYPE, ERROR_HANDLER } from '../constants/group-permissions.constant';
import { User } from 'src/entities/user.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { CreateGroupPermissionDto, UpdateGroupPermissionDto } from '@dto/group_permissions.dto';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GetGroupUsersObject } from '../interface/group-permissions.interface';
import { USER_STATUS } from '@helpers/user_lifecycle';

export function getRoleUsersListQuery(
  role: USER_ROLE,
  organizationId: string,
  manager: EntityManager,
  groupPermissionId?: string
): SelectQueryBuilder<User> {
  const query = manager
    .createQueryBuilder(User, 'user')
    .innerJoinAndSelect('user.userGroups', 'userGroups')
    .innerJoin('userGroups.group', 'group', 'group.organizationId = :organizationId', { organizationId })
    .andWhere('group.type = :type', { type: GROUP_PERMISSIONS_TYPE.DEFAULT })
    .andWhere('group.name = :name', { name: role })
    .innerJoin('user.organizationUsers', 'organizationUsers', 'organizationUsers.organizationId = :organizationId', {
      organizationId,
    })
    .andWhere('organizationUsers.status != :status', {
      status: USER_STATUS.ARCHIVED,
    });

  if (groupPermissionId) {
    query.andWhere(
      'user.id IN ' +
        query
          .subQuery()
          .select('user.id')
          .from(User, 'user')
          .innerJoin('user.userGroups', 'subUserGroup')
          .where('subUserGroup.groupId = :groupId', { groupId: groupPermissionId })
          .getQuery()
    );
  }
  query.select([
    'user.id',
    'user.firstName',
    'user.lastName',
    'user.email',
    'user.status',
    'userGroups.groupId',
    'organizationUsers.status',
    'userGroups.id',
    'group.name',
    'group.type',
  ]);

  return query;
}

export function getUserDetailQuery(
  userId: string,
  organizationId: string,
  manager: EntityManager
): SelectQueryBuilder<User> {
  const query = manager
    .createQueryBuilder(User, 'user')
    .innerJoin('user.organizationUsers', 'organizationUsers', 'organizationUsers.organizationId = :organizationId', {
      organizationId,
    })
    .where('user.id = :userId', {
      userId,
    });

  return query;
}

export function getUserRoleQuery(
  userId: string,
  organizationId: string,
  manager: EntityManager
): SelectQueryBuilder<GroupPermissions> {
  const query = manager
    .createQueryBuilder(GroupPermissions, 'role')
    .innerJoinAndSelect('role.groupUsers', 'groupUsers', 'groupUsers.userId = :userId', { userId })
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
  if (
    newName &&
    (Object.values(USER_ROLE).includes(newName as USER_ROLE) || group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
  ) {
    throw new MethodNotAllowedException(ERROR_HANDLER.DEFAULT_GROUP_NAME_UPDATE);
  }
  const humanizeList = ['End-user', 'Builder', 'Admin'];
  if (humanizeList.includes(newName)) throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_NAME);
  if ([USER_ROLE.ADMIN, USER_ROLE.END_USER].includes(name as USER_ROLE)) {
    throw new MethodNotAllowedException(ERROR_HANDLER.NON_EDITABLE_GROUP_UPDATE);
  }
}

export function validateDeleteGroupUserOperation(group: GroupPermissions, organizationId: string) {
  if (!group || group?.organizationId !== organizationId) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
  if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
    throw new MethodNotAllowedException(ERROR_HANDLER.DELETING_DEFAULT_GROUP_USER);
}

export function validateAddGroupUserOperation(group: GroupPermissions) {
  if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
  if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
    throw new MethodNotAllowedException(ERROR_HANDLER.ADD_GROUP_USER_DEFAULT_GROUP);
}

export function getAllUserGroupsQuery(
  userId: string,
  organizationId: string,
  manager: EntityManager
): SelectQueryBuilder<GroupPermissions> {
  const query = manager
    .createQueryBuilder(GroupPermissions, 'groups')
    .innerJoinAndSelect('groups.groupUsers', 'groupUsers', 'groups.organizationId = :organizationId', {
      organizationId,
    })
    .where('groupUsers.userId = :userId', {
      userId,
    });
  return query;
}

export function validateCreateGroupOperation(createGroupPermissionDto: CreateGroupPermissionDto) {
  const humanizeList = ['End-user', 'Builder', 'Admin'];

  if (humanizeList.includes(createGroupPermissionDto.name)) {
    throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_NAME);
  }

  if (Object.values(USER_ROLE).includes(createGroupPermissionDto.name as USER_ROLE))
    throw new BadRequestException(ERROR_HANDLER.RESERVED_KEYWORDS_FOR_GROUP_NAME);
}

export function addableUsersToGroupQuery(
  groupId: string,
  organizationId: string,
  manager: EntityManager,
  searchInput?: string
): SelectQueryBuilder<User> {
  const query = manager
    .createQueryBuilder(User, 'users')
    .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.organizationId = :organizationId', {
      organizationId: organizationId,
    })
    .innerJoinAndSelect('users.userGroups', 'userGroups')
    .innerJoinAndSelect('userGroups.group', 'group', 'group.organizationId = :organizationId', {
      organizationId,
    })
    .where('group.type = :type', {
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    })
    .where((qb) => {
      const subQuery = qb
        .subQuery()
        .select('groupUsers.userId')
        .from(GroupUsers, 'groupUsers')
        .innerJoin('groupUsers.group', 'group')
        .where('group.id = :groupId', { groupId })
        .andWhere('group.organizationId = :organizationId', { organizationId })
        .getQuery();

      return 'users.id NOT IN ' + subQuery;
    })
    .andWhere(addableUserGetOrConditions(searchInput))
    .select(['users.id', 'users.firstName', 'users.lastName', 'users.email', 'userGroups.id', 'group.name'])
    .orderBy('users.createdAt', 'DESC');

  return query;
}

const addableUserGetOrConditions = (searchInput) => {
  return new Brackets((qb) => {
    if (searchInput) {
      qb.orWhere('lower(users.email) like :email', {
        email: `%${searchInput.toLowerCase()}%`,
      });
      qb.orWhere('lower(users.firstName) like :firstName', {
        firstName: `%${searchInput.toLowerCase()}%`,
      });
      qb.orWhere('lower(users.lastName) like :lastName', {
        lastName: `%${searchInput.toLowerCase()}%`,
      });
    }
  });
};

export function getUserInGroupQuery(
  getGroupUsersObject: GetGroupUsersObject,
  manager: EntityManager,
  searchInput: string
): SelectQueryBuilder<GroupUsers> {
  const { groupId, organizationId } = getGroupUsersObject;

  const query = manager
    .createQueryBuilder(GroupUsers, 'groupUsers')
    .innerJoinAndSelect('groupUsers.user', 'users', 'groupUsers.groupId = :groupId', {
      groupId,
    })
    .innerJoinAndSelect(
      'users.organizationUsers',
      'organizationUsers',
      'organizationUsers.organizationId = :organizationId',
      {
        organizationId,
      }
    )
    .andWhere('organizationUsers.status != :status', {
      status: USER_STATUS.ARCHIVED,
    })
    .innerJoinAndSelect('users.userGroups', 'userRole')
    .innerJoinAndSelect('userRole.group', 'role', 'role.organizationId = :organizationId', {
      organizationId,
    })
    .andWhere('role.type = :type', {
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    })
    .select([
      'groupUsers.id',
      'groupUsers.groupId',
      'users.id',
      'users.firstName',
      'users.lastName',
      'users.email',
      'users.avatarId',
      'userRole.id',
      'role.name',
      'organizationUsers.status',
    ])
    .addSelect('role.name', 'userRole')
    .andWhere(addableUserGetOrConditions(searchInput));
  return query;
}
