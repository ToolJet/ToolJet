import { GroupPermissions } from '@entities/group_permissions.entity';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { USER_STATUS } from '@modules/users/constants/lifecycle';
import { USER_ROLE, GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';

@Injectable()
export class RolesRepository extends Repository<GroupPermissions> {
  constructor(private dataSource: DataSource) {
    super(GroupPermissions, dataSource.createEntityManager());
  }

  async getRole(role: USER_ROLE, organizationId: string, manager?: EntityManager): Promise<GroupPermissions> {
    return dbTransactionWrap((manager) => {
      return manager.findOne(GroupPermissions, {
        where: {
          name: role,
          organizationId,
          type: GROUP_PERMISSIONS_TYPE.DEFAULT,
        },
      });
    }, manager || this.manager);
  }

  async getRoleUsersList(
    role: USER_ROLE,
    organizationId: string,
    userIds?: string[],
    manager?: EntityManager
  ): Promise<User[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.find(User, {
        relations: {
          userGroups: {
            group: true,
          },
          organizationUsers: true,
        },
        where: {
          id: userIds ? In(userIds) : undefined,
          userGroups: {
            group: {
              organizationId: organizationId,
              type: GROUP_PERMISSIONS_TYPE.DEFAULT,
              name: role,
            },
          },
          organizationUsers: {
            organizationId: organizationId,
            status: Not(USER_STATUS.ARCHIVED),
          },
        },
      });
    }, manager || this.manager);
  }

  async getUserRole(userId: string, organizationId: string, manager?: EntityManager): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(GroupPermissions, {
        where: {
          type: GROUP_PERMISSIONS_TYPE.DEFAULT,
          organizationId: organizationId,
          groupUsers: {
            userId: userId,
          },
        },
        relations: {
          groupUsers: true,
        },
      });
    }, manager || this.manager);
  }

  getAdminRoleOfOrganization(organizationId: string, manager?: EntityManager): Promise<GroupPermissions> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(GroupPermissions, {
        where: { organizationId, type: GROUP_PERMISSIONS_TYPE.DEFAULT, name: USER_ROLE.ADMIN },
      });
    }, manager || this.manager);
  }
}
