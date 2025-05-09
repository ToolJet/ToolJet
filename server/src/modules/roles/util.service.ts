import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { USER_STATUS } from '@modules/users/constants/lifecycle';
import { GROUP_PERMISSIONS_TYPE, ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { EditUserRoleDto } from './dto';
import { App } from '@entities/app.entity';
import { _ } from 'lodash';
import { ERROR_HANDLER } from '@modules/group-permissions/constants/error';
import { RolesRepository } from './repository';
import { AddUserRoleObject } from '@modules/group-permissions/types';
import { IRolesUtilService } from './interfaces/IUtilService';
import { LicenseUserService } from '@modules/licensing/services/user.service';

@Injectable()
export class RolesUtilService implements IRolesUtilService {
  constructor(
    protected groupPermissionsRepository: GroupPermissionsRepository,
    protected roleRepository: RolesRepository,
    protected licenseUserService: LicenseUserService
  ) {}

  async changeEndUserToEditor(
    organizationId: string,
    userIds: string[],
    endUserGroupId: string,
    manager?: EntityManager
  ): Promise<void> {
    if (!userIds?.length) {
      return;
    }
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Delete all users from end user group
      await manager.delete(GroupUsers, {
        groupId: endUserGroupId,
        userId: In(userIds),
      });

      const builderGroup = await this.roleRepository.getRole(USER_ROLE.BUILDER, organizationId, manager);

      const usersToInsert = userIds.map((userId) => ({
        groupId: builderGroup.id,
        userId,
      }));

      // Bulk insert all records at once
      await manager.insert(GroupUsers, usersToInsert);
    }, manager);
  }

  async editDefaultGroupUserRole(
    organizationId: string,
    editRoleDto: EditUserRoleDto,
    manager?: EntityManager
  ): Promise<void> {
    const { newRole, userId, updatingUserId: updatedAdmin, currentRole: userRole } = editRoleDto;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Removing an admin
      if (userRole.name == USER_ROLE.ADMIN) {
        const groupUsers = await this.groupPermissionsRepository.getUsersInGroup(
          userRole.id,
          organizationId,
          null,
          manager
        );

        // Filtering active admins
        const admins = groupUsers
          .map((group) => group.user)
          .filter((user) => user.organizationUsers[0].status === USER_STATUS.ACTIVE);

        // Check if user to change role is admin
        const isAdmin = admins.find((admin) => admin.id === userId);

        if (isAdmin && admins.length < 2) {
          // If the user is admin and there is only one admin left
          throw new BadRequestException({
            message: {
              error: ERROR_HANDLER.EDITING_LAST_ADMIN_ROLE_NOT_ALLOWED,
              title: 'Can not remove last active admin',
            },
          });
        }
      }

      // Moving from admin/builder to end user
      if (newRole == USER_ROLE.END_USER) {
        // Check if user has created any apps
        const userCreatedApps = await manager.find(App, {
          where: {
            userId: userId,
            organizationId: organizationId,
          },
        });

        if (userCreatedApps?.length > 0) {
          if (updatedAdmin) {
            // Transfer the ownership to session user
            await manager.update(
              App,
              {
                userId,
                organizationId,
              },
              { userId: updatedAdmin }
            );
          } else {
            // Get user details
            const user = await manager.findOne(User, {
              where: {
                id: userId,
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
        // Check if any custom groups having edit permission
        const userGroups = await this.groupPermissionsRepository.getAllUserGroups(userId, organizationId, manager);

        for (const customUserGroup of userGroups) {
          const editPermissionsPresent = await this.isEditableGroup(customUserGroup, organizationId, manager);
          const groupUsers = customUserGroup.groupUsers;
          if (editPermissionsPresent) {
            // Remove from custom groups with edit privilege
            await this.groupPermissionsRepository.removeUserFromGroup(groupUsers[0].id, null, null, manager);
          }
        }
      }
      // Delete user from current group
      await this.groupPermissionsRepository.removeUserFromGroup(null, userId, userRole.id, manager);

      // Add to new Role
      await this.addUserRole(organizationId, { role: newRole, userId }, manager);
    }, manager);
  }

  async addUserRole(
    organizationId: string,
    addUserRoleObject: AddUserRoleObject,
    manager?: EntityManager
  ): Promise<void> {
    const { role, userId } = addUserRoleObject;
    await dbTransactionWrap(async (manager: EntityManager) => {
      const roleGroup = await this.roleRepository.getRole(role, organizationId, manager);

      if (_.isEmpty(roleGroup) || roleGroup.type !== GROUP_PERMISSIONS_TYPE.DEFAULT) {
        throw new BadRequestException();
      }
      const newUserRole = manager.create(GroupUsers, { groupId: roleGroup.id, userId });
      await manager.save(newUserRole);
    }, manager);
  }

  async isEditableGroup(group: GroupPermissions, organizationId: string, manager?: EntityManager): Promise<boolean> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const editPermissionsPresent =
        Object.values(group).some((value) => typeof value === 'boolean' && value === true) ||
        (await this.checkIfBuilderLevelResourcesPermissions(group.id, organizationId, manager));
      return editPermissionsPresent;
    }, manager);
  }

  async checkIfBuilderLevelResourcesPermissions(
    groupId: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<boolean> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const allPermission = await this.groupPermissionsRepository.getAllGranularPermissions(
        { groupId },
        organizationId,
        manager
      );
      if (!allPermission) {
        return false;
      }
      const isBuilderLevelAppsPermission = allPermission
        .filter((permissions) => permissions.type === ResourceType.APP)
        .some((permissions) => {
          const appPermission = permissions.appsGroupPermissions;
          return appPermission.canEdit === true;
        });
      const isBuilderLevelDataSourcePermissions = allPermission.filter(
        (permissions) => permissions.type === ResourceType.DATA_SOURCE
      ).length;
      return isBuilderLevelAppsPermission || isBuilderLevelDataSourcePermissions;
    }, manager);
  }

  async updateUserRole(organizationId: string, editRoleDto: EditUserRoleDto) {
    const { userId, newRole } = editRoleDto;
    await dbTransactionWrap(async (manager: EntityManager) => {
      const userRole = await this.roleRepository.getUserRole(userId, organizationId, manager);
      if (_.isEmpty(userRole)) {
        throw new BadRequestException(ERROR_HANDLER.ADD_GROUP_USER_NON_EXISTING_USER);
      }

      if (userRole.name == newRole) {
        throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_ADD_USER_ROLE_EXIST(newRole));
      }
      editRoleDto.currentRole = userRole;
      await this.editDefaultGroupUserRole(organizationId, editRoleDto, manager);

      await this.licenseUserService.validateUser(manager);
    });
  }
}
