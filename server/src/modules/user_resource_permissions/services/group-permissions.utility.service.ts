import { Injectable } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { User } from 'src/entities/user.entity';
import { USER_ROLE } from '@module/user_resource_permissions/constants/group-permissions.constant';
import {
  getRoleUsersListQuery,
  getUserRoleQuery,
} from '@module/user_resource_permissions/utility/group-permissions.utility';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/utils.helper';

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
    });
  }

  async getUserRole(userId: string, organizationId: string, manager?: EntityManager): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getUserRoleQuery(userId, organizationId, manager).getOne();
    }, manager);
  }
}
