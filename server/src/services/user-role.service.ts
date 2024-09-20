import { Injectable, BadRequestException } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { EditUserRoleDto } from '@dto/group_permissions.dto';
import { User } from 'src/entities/user.entity';
import {
  USER_ROLE,
  ERROR_HANDLER,
  DEFAULT_GROUP_PERMISSIONS,
} from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GranularPermissionsService } from './granular_permissions.service';
import {
  DEFAULT_GRANULAR_PERMISSIONS_NAME,
  DEFAULT_RESOURCE_PERMISSIONS,
  ResourceType,
} from '@modules/user_resource_permissions/constants/granular-permissions.constant';
import { CreateResourcePermissionObject } from '@modules/user_resource_permissions/interface/granular-permissions.interface';
import { GroupPermissionsServiceV2 } from './group_permissions.service.v2';
import { AddUserRoleObject } from '@modules/user_resource_permissions/interface/group-permissions.interface';
import { GroupPermissionsUtilityService } from '@modules/user_resource_permissions/services/group-permissions.utility.service';
import { App } from 'src/entities/app.entity';
import { USER_STATUS } from '@helpers/user_lifecycle';

@Injectable()
export class UserRoleService {
  constructor(
    private groupPermissionsService: GroupPermissionsServiceV2,
    private granularPermissionsService: GranularPermissionsService,
    private groupPermissionsUtilityService: GroupPermissionsUtilityService
  ) {}

  async createDefaultGroups(organizationId: string, manager?: EntityManager): Promise<void> {
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
          const createResourcePermissionObj: CreateResourcePermissionObject = groupGranularPermissions[resource];
          const dtoObject = {
            name: DEFAULT_GRANULAR_PERMISSIONS_NAME[resource],
            groupId: group.id,
            type: resource as ResourceType,
            isAll: true,
            createAppsPermissionsObject: {},
          };
          await this.granularPermissionsService.create(
            {
              createGranularPermissionDto: dtoObject,
              organizationId,
            },
            createResourcePermissionObj,
            manager
          );
        }
      }
    }, manager);
  }

  async getRoleGroup(role: USER_ROLE, organizationId: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager) => {
      return await this.groupPermissionsUtilityService.getRoleGroup(role, organizationId, manager);
    }, manager);
  }

  async editDefaultGroupUserRole(
    editRoleDto: EditUserRoleDto,
    organizationId: string,
    manager?: EntityManager,
    options?: { updatedAdmin?: string }
  ): Promise<void> {
    const { newRole, userId } = editRoleDto;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const userRole = await this.groupPermissionsUtilityService.getUserRole(userId, organizationId);
      if (!userRole) throw new BadRequestException(ERROR_HANDLER.ADD_GROUP_USER_NON_EXISTING_USER);
      const userGroup = userRole.groupUsers[0];
      if (userRole.name == newRole)
        throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_ADD_USER_ROLE_EXIST(newRole));

      if (userRole.name == USER_ROLE.ADMIN) {
        const groupUsers = await this.groupPermissionsService.getAllGroupUsers(
          { groupId: userRole.id, organizationId },
          null,
          manager
        );
        const admins = groupUsers
          .map((group) => group.user)
          .filter((user) => user.organizationUsers[0].status === USER_STATUS.ACTIVE);
        const isAdmin = admins.find((admin) => admin.id === userId);
        if (isAdmin && admins.length < 2)
          throw new BadRequestException({
            message: {
              error: ERROR_HANDLER.EDITING_LAST_ADMIN_ROLE_NOT_ALLOWED,
              title: 'Can not remove last active admin',
            },
          });
      }
      if (newRole == USER_ROLE.END_USER) {
        const userCreatedApps = await manager.find(App, {
          where: {
            userId: userId,
            organizationId: organizationId,
          },
        });
        if (userCreatedApps.length > 0) {
          if (options?.updatedAdmin) {
            // Transfer the ownership
            await manager.update(
              App,
              {
                userId: userId,
                organizationId: organizationId,
              },
              { userId: options?.updatedAdmin }
            );
          } else {
            const user = await manager.findOne(User, {
              where: {
                id: userGroup.userId,
              },
            });
            throw new BadRequestException({
              message: {
                error: ERROR_HANDLER.USER_IS_OWNER_OF_APPS(user.email),
                data: userCreatedApps.map((app) => app.name),
                title: 'Can not change user role',
              },
            });
          }
        }
      }
      await this.groupPermissionsService.deleteGroupUser(userGroup.id, manager);
      if (newRole == USER_ROLE.END_USER) {
        const userGroups = await this.groupPermissionsService.getAllUserGroups(userId, organizationId);

        for (const customUserGroup of userGroups) {
          const editPermissionsPresent = await this.groupPermissionsUtilityService.isEditableGroup(
            customUserGroup,
            manager
          );
          const groupUsers = customUserGroup.groupUsers;
          if (editPermissionsPresent) await this.groupPermissionsService.deleteGroupUser(groupUsers[0].id, manager);
        }
      }
      await this.addUserRole({ role: newRole, userId }, organizationId, manager);
    }, manager);
  }

  async addUserRole(addUserRoleObject: AddUserRoleObject, organizationId: string, manager?: EntityManager) {
    const { role, userId } = addUserRoleObject;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const roleGroup = await this.getRoleGroup(role, organizationId, manager);
      const newUserRole = manager.create(GroupUsers, { groupId: roleGroup.id, userId });
      await manager.save(newUserRole);
    }, manager);
  }
}
