import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { BUILDER_ACCESS_LOST, USER_STATUS } from '@modules/users/constants/lifecycle';
import { GROUP_PERMISSIONS_TYPE, ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EntityManager, In } from 'typeorm';
import { EditUserRoleDto } from './dto';
import { App } from '@entities/app.entity';
import { AppBase } from '@entities/app_base.entity';
import { _ } from 'lodash';
import { ERROR_HANDLER } from '@modules/group-permissions/constants/error';
import { RolesRepository } from './repository';
import { AddUserRoleObject } from '@modules/group-permissions/types';
import { IRolesUtilService } from './interfaces/IUtilService';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';

@Injectable()
export class RolesUtilService implements IRolesUtilService {
  // Property injection: keeps the constructor (and the EE subclass) unchanged.
  @Inject(EventEmitter2) protected eventEmitter: EventEmitter2;

  constructor(
    protected groupPermissionsRepository: GroupPermissionsRepository,
    protected roleRepository: RolesRepository,
    protected licenseTermsService: LicenseTermsService
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

  async assertActiveAdminRemains(
    organizationId: string,
    adminGroupId: string,
    removedUserIds: string[],
    manager?: EntityManager
  ): Promise<void> {
    const groupUsers = await this.groupPermissionsRepository.getUsersInGroup(
      adminGroupId,
      organizationId,
      null,
      manager
    );

    // Filtering active admins
    const admins = groupUsers
      .map((group) => group.user)
      .filter((user) => user.organizationUsers[0].status === USER_STATUS.ACTIVE);

    const removedAdmins = admins.filter((admin) => removedUserIds.includes(admin.id));

    if (removedAdmins.length && removedAdmins.length === admins.length) {
      // Every active admin would be removed
      throw new BadRequestException({
        message: {
          error: ERROR_HANDLER.EDITING_LAST_ADMIN_ROLE_NOT_ALLOWED,
          title: 'Can not remove last active admin',
        },
      });
    }
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
        await this.assertActiveAdminRemains(organizationId, userRole.id, [userId], manager);
      }

      // Moving from admin/builder to end user
      if (newRole == USER_ROLE.END_USER) {
        const ownedAppsCount = await manager.count(AppBase, {
          where: {
            userId: userId,
            organizationId: organizationId,
          },
        });

        if (ownedAppsCount > 0) {
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
            const ownedAppNames = await manager
              .createQueryBuilder(AppBase, 'app')
              .select(
                `COALESCE((SELECT av.app_name FROM app_versions av
                   WHERE av.app_id = app.id AND av.version_type = 'version'
                     AND av.is_stub = false AND av.app_name IS NOT NULL
                   ORDER BY av.is_synced DESC, av.updated_at DESC LIMIT 1), app.name, app.id::text)`,
                'name'
              )
              .where('app.userId = :userId', { userId })
              .andWhere('app.organizationId = :organizationId', { organizationId })
              .getRawMany();
            throw new BadRequestException({
              message: {
                error: ERROR_HANDLER.USER_IS_OWNER_OF_APPS(user.email),
                data: ownedAppNames.map((row) => row.name),
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
      if (newRole === USER_ROLE.END_USER) {
        await this.eventEmitter.emitAsync(BUILDER_ACCESS_LOST, { userId, organizationId, manager });
      }
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
        (await this.checkIfBuilderLevelResourcesPermissions(group.id, organizationId, manager)) ||
        (await this.checkIfBuilderLevelEnvironmentPermissions(group.id, organizationId, manager));
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
      // Restrict-only data source perms (no Configure/Build with) are end-user safe
      const isBuilderLevelDataSourcePermissions = allPermission.some(
        (permissions) =>
          permissions.type === ResourceType.DATA_SOURCE &&
          (permissions.dataSourcesGroupPermission?.canConfigure || permissions.dataSourcesGroupPermission?.canUse)
      );
      // Data-source folders cascade configure/build-with onto the data sources inside them, so any
      // Edit folder / Configure / Build with grant is builder-level (same reasoning as the
      // per-data-source rule above). A restrict-query-run-only row (all three levels false) is
      // end-user safe — it is exactly what end users are allowed.
      const isBuilderLevelDataSourceFolderPermissions = allPermission.some(
        (permissions) =>
          permissions.type === ResourceType.DATA_SOURCE_FOLDER &&
          (permissions.foldersGroupPermissions?.canEditFolder ||
            permissions.foldersGroupPermissions?.canEditApps ||
            permissions.foldersGroupPermissions?.canViewApps)
      );
      // Modules are never assignable to end-users, regardless of canView/canEdit - any module permission makes the group builder-level.
      // Same rule for module folders — end-users can't see modules at all, so even a
      // view-only module-folder grant makes the group builder-level (unlike plain/workflow
      // folders, where view-only stays end-user-safe — see checkIfGroupHasBuilderGranularPermissions).
      const hasModulePermissions = allPermission.filter(
        (permissions) => permissions.type === ResourceType.MODULE || permissions.type === ResourceType.MODULE_FOLDER
      ).length;
      return (
        isBuilderLevelAppsPermission ||
        isBuilderLevelDataSourcePermissions ||
        isBuilderLevelDataSourceFolderPermissions ||
        hasModulePermissions
      );
    }, manager);
  }

  async checkIfBuilderLevelEnvironmentPermissions(
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

      const hasNonReleasedEnvironments = allPermission
        .filter((permissions) => permissions.type === ResourceType.APP)
        .some((permissions) => {
          const appPermission = permissions.appsGroupPermissions;
          return (
            appPermission.canAccessProduction === true ||
            appPermission.canAccessDevelopment === true ||
            appPermission.canAccessStaging === true
          );
        });

      if (hasNonReleasedEnvironments) {
        const hasMultiEnvironment = await this.licenseTermsService.getLicenseTerms(
          LICENSE_FIELD.MULTI_ENVIRONMENT,
          organizationId
        );
        return !hasMultiEnvironment;
      }

      return false;
    }, manager);
  }
}
