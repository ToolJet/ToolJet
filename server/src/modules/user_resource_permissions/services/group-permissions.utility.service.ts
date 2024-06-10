import { Injectable } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { User } from 'src/entities/user.entity';
import { USER_ROLE } from '@module/user_resource_permissions/constants/group-permissions.constant';
import {
  addableUsersToGroupQuery,
  getRoleUsersListQuery,
  getUserRoleQuery,
} from '@module/user_resource_permissions/utility/group-permissions.utility';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/utils.helper';
import { App } from 'src/entities/app.entity';

@Injectable()
export class GroupPermissionsUtilityService {
  constructor() {}

  async getRoleUsersList(
    role: USER_ROLE,
    organizationId: string,
    groupPermissionId?: string,
    manager?: EntityManager
  ): Promise<User[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const query = getRoleUsersListQuery(role, organizationId, manager, groupPermissionId);
      return await query.getMany();
    }, manager);
  }

  async getUserRole(userId: string, organizationId: string, manager?: EntityManager): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getUserRoleQuery(userId, organizationId, manager).getOne();
    }, manager);
  }

  async getAddableUser(user: User, groupId: string, searchInput?: string, manager?: EntityManager) {
    console.log('find addable users');

    return await dbTransactionWrap(async (manager: EntityManager) => {
      console.log(await addableUsersToGroupQuery(groupId, user.organizationId, manager, searchInput).getMany());

      return await addableUsersToGroupQuery(groupId, user.organizationId, manager, searchInput).getMany();
    }, manager);
  }

  async getAddableApps(user: User, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const apps = await manager.find(App, {
        where: {
          organizationId: user.organizationId,
        },
      });
      return apps.map((app) => {
        return {
          name: app.name,
          id: app.id,
        };
      });
    }, manager);
  }
}
