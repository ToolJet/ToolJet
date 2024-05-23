import { Injectable, BadRequestException } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { EditUserRoleDto } from '@dto/group_permissions.dto';
import { User } from 'src/entities/user.entity';
import {
  USER_ROLE,
  ERROR_HANDLER,
  DEFAULT_GROUP_PERMISSIONS,
  GROUP_PERMISSIONS_TYPE,
} from '@module/user_resource_permissions/constants/group-permissions.constant';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager } from 'typeorm';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GranularPermissionsService } from './granular_permissions.service';
import {
  DEFAULT_GRANULAR_PERMISSIONS_NAME,
  DEFAULT_RESOURCE_PERMISSIONS,
  ResourceType,
} from '@module/user_resource_permissions/constants/granular-permissions.constant';
import { CreateResourcePermissionObject } from '@module/user_resource_permissions/interface/granular-permissions.interface';
import { GroupPermissionsServiceV2 } from './group_permissions.service.v2';
import { AddUserRoleObject } from '@module/user_resource_permissions/interface/group-permissions.interface';
import { GroupPermissionsUtilityService } from '@module/user_resource_permissions/services/group-permissions.utility.service';

@Injectable()
export class UserRoleService {
  constructor(
    private groupPermissionsService: GroupPermissionsServiceV2,
    private granularPermissionsService: GranularPermissionsService,
    private groupPermissionsUtilityService: GroupPermissionsUtilityService
  ) {}

  async createDefaultGroups(user: User, manager?: EntityManager): Promise<void> {
    const { organizationId } = user;
    const defaultGroups: GroupPermissions[] = [];
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Create all default group
      for (const defaultGroup of Object.keys(USER_ROLE)) {
        const newGroup = await this.groupPermissionsService.create(
          organizationId,
          DEFAULT_GROUP_PERMISSIONS[defaultGroup],
          manager
        );
        defaultGroups.push(newGroup);
      }

      //Add granular permissions to default group
      for (const group of defaultGroups) {
        const groupGranularPermissions: Record<ResourceType, CreateResourcePermissionObject> =
          DEFAULT_RESOURCE_PERMISSIONS[group.name];
        for (const resource of Object.keys(groupGranularPermissions)) {
          const granularPermissions = await this.granularPermissionsService.create(
            {
              name: DEFAULT_GRANULAR_PERMISSIONS_NAME[resource],
              groupId: group.id,
              type: ResourceType[resource],
            },
            manager
          );
          const createResourcePermissionObj: CreateResourcePermissionObject = groupGranularPermissions[resource];

          await this.granularPermissionsService.createResourceGroupPermission(
            granularPermissions,
            createResourcePermissionObj,
            manager
          );
        }
      }
    }, manager);
  }

  async getRoleGroup(role: USER_ROLE, organizationId: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager) => {
      return await manager.findOne(GroupPermissions, {
        where: { name: role, organizationId, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
      });
    }, manager);
  }

  async editDefaultGroupUserRole(
    editRoleDto: EditUserRoleDto,
    organizationId: string,
    manager?: EntityManager
  ): Promise<void> {
    const { newRole, userId } = editRoleDto;
    const userRole = await this.groupPermissionsUtilityService.getUserRole(userId, organizationId);
    if (!userRole) throw new BadRequestException(ERROR_HANDLER.ADD_GROUP_USER_NON_EXISTING_USER);
    const userGroup = userRole.groupUsers[0];

    if (userRole.name == newRole)
      throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_ADD_USER_ROLE_EXIST(newRole));

    return await dbTransactionWrap(async (manager: EntityManager) => {
      await this.groupPermissionsService.deleteGroupUser(userGroup.id, manager);
      if (newRole == USER_ROLE.END_USER) {
        const userGroups = await this.groupPermissionsService.getAllUserGroups(userId, organizationId);
        for (const customUserGroup of userGroups) {
          const editPermissionsPresent = Object.values(customUserGroup).some(
            (value) => typeof value === 'boolean' && value === true
          );
          //NEED TO CHECK FOR ALL GRANULAR PERMISSIONS AS WELL FOR THAT GROUP
          if (editPermissionsPresent) await this.groupPermissionsService.deleteGroupUser(customUserGroup.id, manager);
        }
      }
      await this.addUserRole({ role: newRole, userId }, organizationId, manager);
    }, manager);
  }

  async addUserRole(addUserRoleObject: AddUserRoleObject, organizationId: string, manager?: EntityManager) {
    const { role, userId } = addUserRoleObject;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const roleGroup = await this.getRoleGroup(role, organizationId);
      const newUserRole = manager.create(GroupUsers, { groupId: roleGroup.id, userId });
      await manager.save(newUserRole);
    }, manager);
  }
}
