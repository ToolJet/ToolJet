import { BadRequestException, Injectable } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { User } from 'src/entities/user.entity';
import {
  ERROR_HANDLER,
  GROUP_PERMISSIONS_TYPE,
  USER_ROLE,
} from '@modules/user_resource_permissions/constants/group-permissions.constant';
import {
  addableUsersToGroupQuery,
  getRoleUsersListQuery,
  getUserRoleQuery,
} from '@modules/user_resource_permissions/utility/group-permissions.utility';
import { EntityManager } from 'typeorm';
import { getMaxCopyNumber } from '@helpers/utils.helper';
import { dbTransactionWrap } from '@helpers/database.helper';
import { App } from 'src/entities/app.entity';
import { getAllGranularPermissionQuery } from '../utility/granular-permissios.utility';
import { ResourceType } from '../constants/granular-permissions.constant';
import { ValidateEditUserGroupAdditionObject } from '../interface/group-permissions.interface';
import { instanceToPlain } from 'class-transformer';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import { GroupApps } from 'src/entities/group_apps.entity';

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
      if (userRole.name === USER_ROLE.END_USER) {
        return await Promise.all(
          groupsToAddIds.map(async (id) => {
            const group = await manager.findOne(GroupPermissions, {
              where: {
                id,
              },
            });
            if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
            const isEditableGroup = await this.isEditableGroup(group, manager);
            if (isEditableGroup) {
              throw new BadRequestException({
                message: {
                  error:
                    'End-users can only be granted permission to view apps. Kindly change the user role or custom group to continue.',
                  title: 'Conflicting permissions',
                },
              });
            }
          })
        );
      }
    }, manager);
  }

  async getDuplicateGroupName(groupToDuplicate: GroupPermissions, manager: EntityManager): Promise<string> {
    const existNameList = await manager
      .createQueryBuilder()
      .select(['groupPermissions.name', 'groupPermissions.id'])
      .from(GroupPermissions, 'groupPermissions')
      .where('groupPermissions.name ~* :pattern', { pattern: `^${groupToDuplicate.name}_copy_[0-9]+$` })
      .orWhere('groupPermissions.name = :groupToDuplicateGroup', {
        groupToDuplicateGroup: `${groupToDuplicate.name}_copy`,
      })
      .andWhere('groupPermissions.id != :groupPermissionId', { groupPermissionId: groupToDuplicate.id })
      .andWhere('groupPermissions.organizationId = :organizationId', {
        organizationId: groupToDuplicate.organizationId,
      })
      .getMany();

    let newName = `${groupToDuplicate.name}_copy`;
    const number = getMaxCopyNumber(existNameList.map((group) => group.name));
    if (number) newName = `${groupToDuplicate.name}_copy_${number}`;
    return newName;
  }

  async duplicateGroup(
    group: GroupPermissions,
    addPermission: boolean,
    manager?: EntityManager
  ): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newName = await this.getDuplicateGroupName(group, manager);
      const keysToDelete = ['id', 'createdAt', 'updatedAt', 'name', 'type'];
      if (addPermission)
        keysToDelete.forEach((key) => {
          delete group[key];
        });
      return await manager.save(
        manager.create(GroupPermissions, {
          name: newName,
          organizationId: group.organizationId,
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
          ...(addPermission ? instanceToPlain(group) : {}),
        })
      );
    }, manager);
  }

  async duplicateGranularPermissions(
    granularPermissions: GranularPermissions,
    groupId: string,
    manager?: EntityManager
  ): Promise<GranularPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const keysToDelete = ['id', 'createdAt', 'updatedAt', 'groupId', 'appsGroupPermissions'];
      keysToDelete.forEach((key) => {
        delete granularPermissions[key];
      });
      return await manager.save(
        manager.create(GranularPermissions, { groupId, ...instanceToPlain(granularPermissions) })
      );
    }, manager);
  }

  async duplicateResourcePermissions(
    granularPermissionsToDuplicate: GranularPermissions,
    newGranularPermissionsId: string,
    manager?: EntityManager
  ): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      switch (granularPermissionsToDuplicate.type) {
        case ResourceType.APP:
          await this.duplicationAppsPermissions(
            granularPermissionsToDuplicate.appsGroupPermissions,
            newGranularPermissionsId,
            manager
          );
          break;
        default:
          break;
      }
    }, manager);
  }

  async duplicationAppsPermissions(
    appsPermissions: AppsGroupPermissions,
    granularPermissionId: string,
    manager: EntityManager
  ) {
    const groupApps = appsPermissions.groupApps;
    const keysToDelete = ['id', 'createdAt', 'updatedAt', 'granularPermissionId', 'groupApps'];
    keysToDelete.forEach((key) => {
      delete appsPermissions[key];
    });
    const newAppsPermissions = await manager.save(
      manager.create(AppsGroupPermissions, { granularPermissionId, ...instanceToPlain(appsPermissions) })
    );
    groupApps.map(async (groupApp) => {
      await manager.save(
        manager.create(GroupApps, { appsGroupPermissionsId: newAppsPermissions.id, appId: groupApp.appId })
      );
    });
  }
}
