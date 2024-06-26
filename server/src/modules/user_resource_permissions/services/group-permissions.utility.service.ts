import { BadRequestException, Injectable } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { User } from 'src/entities/user.entity';
import {
  GROUP_PERMISSIONS_TYPE,
  USER_ROLE,
} from '@module/user_resource_permissions/constants/group-permissions.constant';
import {
  addableUsersToGroupQuery,
  getRoleUsersListQuery,
  getUserRoleQuery,
} from '@module/user_resource_permissions/utility/group-permissions.utility';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/utils.helper';
import { App } from 'src/entities/app.entity';
import { getAllGranularPermissionQuery } from '../utility/granular-permissios.utility';
import { ResourceType } from '../constants/granular-permissions.constant';
import { ValidateEditUserGroupAdditionObject } from '../interface/group-permissions.interface';

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
  async getRoleGroup(role: USER_ROLE, organizationId: string, manager?: EntityManager): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager) => {
      return await manager.findOne(GroupPermissions, {
        where: { name: role, organizationId, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
      });
    }, manager);
  }

  async getUserRole(userId: string, organizationId: string, manager?: EntityManager): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getUserRoleQuery(userId, organizationId, manager).getOne();
    }, manager);
  }

  async getAddableUser(user: User, groupId: string, searchInput?: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
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

  async checkIfBuilderLevelResourcesPermissions(groupId: string, manager?: EntityManager): Promise<boolean> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const allPermission = await getAllGranularPermissionQuery({ groupId }, manager).getMany();
      if (!allPermission) return false;
      const isBuilderLevelAppsPermission = allPermission
        .filter((permissions) => permissions.type === ResourceType.APP)
        .some((permissions) => {
          const appPermission = permissions.appsGroupPermissions;
          return appPermission.canEdit === true;
        });
      //Add for other permissions here
      return isBuilderLevelAppsPermission;
    }, manager);
  }

  async isEditableGroup(group: GroupPermissions, manager?: EntityManager): Promise<boolean> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const editPermissionsPresent =
        Object.values(group).some((value) => typeof value === 'boolean' && value === true) ||
        (await this.checkIfBuilderLevelResourcesPermissions(group.id, manager));
      return editPermissionsPresent;
    }, manager);
  }

  async validateEditUserGroupPermissionsAddition(
    functionParam: ValidateEditUserGroupAdditionObject,
    manager?: EntityManager
  ) {
    const { organizationId, userId, groupsToAddIds } = functionParam;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const userRole = await this.getUserRole(userId, organizationId, manager);
      console.log('this is running');

      if (userRole.name === USER_ROLE.END_USER) {
        return await Promise.all(
          groupsToAddIds.map(async (id) => {
            const group = await manager.findOne(GroupPermissions, id);
            const isEditableGroup = await this.isEditableGroup(group, manager);
            console.log(isEditableGroup);

            if (isEditableGroup) {
              throw new BadRequestException({
                message: {
                  error:
                    'End-users can only be granted permission to view apps. Kindly change the user role or custom group to continue.',
                  title: 'Conflicting Permissions',
                },
              });
            }
          })
        );
      }
    }, manager);
  }
}
