import { GroupPermissions } from '@entities/group_permissions.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { catchDbException } from '@helpers/utils.helper';
import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  Like,
  Not,
  Repository,
} from 'typeorm';
import { CreateDefaultGroupObject, GranularPermissionQuerySearchParam } from './types';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from './constants';
import { GroupUsers } from '@entities/group_users.entity';
import { USER_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { User } from '@entities/user.entity';
import { DATA_BASE_CONSTRAINTS } from './constants/error';
@Injectable()
export class GroupPermissionsRepository extends Repository<GroupPermissions> {
  constructor(private dataSource: DataSource) {
    super(GroupPermissions, dataSource.createEntityManager());
  }

  getGroup(options: FindOptionsWhere<GroupPermissions>, manager?: EntityManager): Promise<GroupPermissions> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(GroupPermissions, { where: options });
    }, manager || this.manager);
  }

  async getAllUserGroups(userId: string, organizationId: string, manager?: EntityManager): Promise<GroupPermissions[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(GroupPermissions, {
        where: {
          organizationId: organizationId,
          groupUsers: {
            userId: userId,
            group: {
              type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
            },
          },
        },
        relations: {
          groupUsers: {
            group: true,
          },
        },
      });
    }, manager || this.manager);
  }

  async createGroup(
    organizationId: string,
    createGroupObject: CreateDefaultGroupObject,
    manager?: EntityManager
  ): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await catchDbException(async () => {
        const group = manager.create(GroupPermissions, { ...createGroupObject, organizationId });
        return await manager.save(group);
      }, [DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE]);
    }, manager || this.manager);
  }

  async getAllGranularPermissions(
    searchParam: GranularPermissionQuerySearchParam,
    organizationId: string,
    manager: EntityManager
  ): Promise<GranularPermissions[]> {
    const { name, type, groupId } = searchParam;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const findOptions: FindManyOptions<GranularPermissions> = {
        relations: {
          group: true,
          appsGroupPermissions: {
            groupApps: {
              app: true,
            },
          },
          dataSourcesGroupPermission: {
            groupDataSources: {
              dataSource: true,
            },
          },
        },
        where: {
          group: {
            organizationId,
          },
        },
      };

      if (groupId) {
        findOptions.where = { groupId };
      }

      if (name) {
        findOptions.where = {
          ...findOptions.where,
          name: name.useLike ? Like(`%${name.value}%`) : name.value,
        };
      }

      if (type) {
        findOptions.where = {
          ...findOptions.where,
          type: type as ResourceType,
        };
      }

      return manager.find(GranularPermissions, findOptions);
    }, manager || this.manager);
  }

  async getGranularPermission(
    id: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<GranularPermissions | null> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(GranularPermissions, {
        where: { id, group: { organizationId } },
        relations: {
          group: true,
          appsGroupPermissions: true,
          dataSourcesGroupPermission: true,
        },
      });
    }, manager || this.manager);
  }

  createGroupUser(userId: string, groupId: string, manager?: EntityManager): Promise<GroupUsers> {
    return dbTransactionWrap((manager: EntityManager) => {
      return catchDbException(() => {
        return manager.save(manager.create(GroupUsers, { groupId: userId }));
      }, [DATA_BASE_CONSTRAINTS.GROUP_USER_UNIQUE]);
    }, manager);
  }

  getUsersInGroup(
    id: string,
    organizationId: string,
    searchInput?: string,
    manager?: EntityManager
  ): Promise<GroupUsers[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      const baseWhere = {
        groupId: id,
        group: {
          organizationId,
        },
        user: {
          status: Not(USER_STATUS.ARCHIVED),
          organizationUsers: {
            organizationId: organizationId,
            status: Not(WORKSPACE_USER_STATUS.ARCHIVED),
          },
        },
      };

      // If there's a search input, use multiple find operations and merge results
      if (searchInput) {
        const searchLower = searchInput.toLowerCase();
        return manager.find(GroupUsers, {
          where: [
            {
              ...baseWhere,
              user: {
                ...baseWhere.user,
                email: ILike(`%${searchLower}%`),
              },
            },
            {
              ...baseWhere,
              user: {
                ...baseWhere.user,
                firstName: ILike(`%${searchLower}%`),
              },
            },
            {
              ...baseWhere,
              user: {
                ...baseWhere.user,
                lastName: ILike(`%${searchLower}%`),
              },
            },
          ],
          relations: {
            group: true,
            user: {
              organizationUsers: true,
            },
          },
        });
      }

      // If no search input, use simple find
      return manager.find(GroupUsers, {
        where: baseWhere,
        relations: {
          group: true,
          user: {
            organizationUsers: true,
          },
        },
      });
    }, manager || this.manager);
  }

  async getGroupUser(id: string, manager?: EntityManager): Promise<GroupUsers> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(GroupUsers, {
        where: {
          id,
        },
        relations: {
          group: true,
        },
      });
    }, manager || this.manager);
  }

  async addableUsersToGroup(
    groupId: string,
    organizationId: string,
    searchInput?: string,
    manager?: EntityManager
  ): Promise<User[]> {
    const existingUsers = await this.getUsersInGroup(groupId, organizationId, null, manager);

    const baseWhere = {
      status: Not(USER_STATUS.ARCHIVED),
      id: Not(In(existingUsers?.length ? existingUsers.map((user) => user.user.id) : [])),
      organizationUsers: {
        organizationId,
        status: Not(WORKSPACE_USER_STATUS.ARCHIVED),
      },
      userGroups: {
        group: {
          organizationId,
          type: GROUP_PERMISSIONS_TYPE.DEFAULT,
        },
      },
    };

    return dbTransactionWrap((manager: EntityManager) => {
      if (searchInput) {
        const searchLower = searchInput.toLowerCase();
        return manager.find(User, {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          relations: {
            organizationUsers: true,
            userGroups: {
              group: true,
            },
          },
          where: [
            {
              ...baseWhere,
              email: ILike(`%${searchLower}%`),
            },
            {
              ...baseWhere,
              firstName: ILike(`%${searchLower}%`),
            },
            {
              ...baseWhere,
              lastName: ILike(`%${searchLower}%`),
            },
          ],
          order: {
            createdAt: 'DESC',
          },
        });
      }

      // If no search input, use simple find
      return manager.find(User, {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        relations: {
          organizationUsers: true,
          userGroups: {
            group: true,
          },
        },
        where: baseWhere,
        order: {
          createdAt: 'DESC',
        },
      });
    }, manager || this.manager);
  }

  removeUserFromGroup(groupUserId?: string, userId?: string, groupId?: string, manager?: EntityManager): Promise<void> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.delete(GroupUsers, {
        ...(groupUserId ? { id: groupUserId } : {}),
        ...(userId ? { userId } : {}),
        ...(groupId ? { groupId } : {}),
      });
    }, manager || this.manager);
  }

  async removeUserFromAllCustomGroupUser(
    userId: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const groupUsersToDelete = await this.getAllUserGroups(userId, organizationId, manager);
      if (groupUsersToDelete.length > 0) {
        await manager.delete(
          GroupUsers,
          groupUsersToDelete.map((gp) => gp.groupUsers[0].id)
        );
      }
    }, manager || this.manager);
  }
}
