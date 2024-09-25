import { BadRequestException, Injectable, MethodNotAllowedException } from '@nestjs/common';
import { ResourceType } from '@modules/user_resource_permissions/constants/granular-permissions.constant';
import {
  GranularResourcePermissions,
  CreateResourcePermissionObject,
  CreateAppsPermissionsObject,
  UpdateResourceGroupPermissionsObject,
  CreateGranularPermissionObject,
  ResourcePermissionMetaData,
} from '@modules/user_resource_permissions/interface/granular-permissions.interface';
import { EntityManager } from 'typeorm';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import {
  GranularPermissionQuerySearchParam,
  UpdateGranularPermissionObject,
} from '@modules/user_resource_permissions/interface/granular-permissions.interface';
import { catchDbException } from '@helpers/utils.helper';
import { dbTransactionWrap } from '@helpers/database.helper';
import {
  DATA_BASE_CONSTRAINTS,
  USER_ROLE,
} from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { ERROR_HANDLER } from '@modules/user_resource_permissions/constants/group-permissions.constant';
import {
  getAllGranularPermissionQuery,
  getGranularPermissionQuery,
  validateAppResourcePermissionUpdateOperation,
} from '@modules/user_resource_permissions/utility/granular-permissios.utility';
import { GroupPermissionsUtilityService } from '@modules/user_resource_permissions/services/group-permissions.utility.service';
import { GroupApps } from 'src/entities/group_apps.entity';
import { GroupUsers } from 'src/entities/group_users.entity';

@Injectable()
export class GranularPermissionsService {
  constructor(private groupPermissionsUtilityService: GroupPermissionsUtilityService) {}
  async create(
    createGranularPermissionObject: CreateGranularPermissionObject,
    createResourcePermissionsObj?: CreateResourcePermissionObject,
    manager?: EntityManager
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { createGranularPermissionDto, organizationId } = createGranularPermissionObject;
      const { name, type, groupId, isAll: isAllDto } = createGranularPermissionDto;
      const isAll = isAllDto ? true : false;
      const granularPermissions: GranularPermissions = await catchDbException(async () => {
        const granularPermissions = manager.create(GranularPermissions, { name, type, groupId, isAll });
        return await manager.save(granularPermissions);
      }, [DATA_BASE_CONSTRAINTS.GRANULAR_PERMISSIONS_NAME_UNIQUE]);

      await this.createResourceGroupPermission(
        { granularPermissions, organizationId },
        createResourcePermissionsObj,
        manager
      );
      return granularPermissions;
    }, manager);
  }

  async getAll(
    searchParam: GranularPermissionQuerySearchParam,
    manager?: EntityManager
  ): Promise<GranularPermissions[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const getAllQuery = getAllGranularPermissionQuery(searchParam, manager);
      return await getAllQuery.getMany();
    }, manager);
  }

  async get(id: string, manager?: EntityManager): Promise<GranularPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getGranularPermissionQuery(id, manager).getOne();
    }, manager);
  }

  async update(id: string, updateGranularPermissionsObj: UpdateGranularPermissionObject, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const granularPermissions = await this.get(id, manager);
      const { organizationId, updateGranularPermissionDto, group } = updateGranularPermissionsObj;
      const { isAll, name, resourcesToAdd, resourcesToDelete, actions, allowRoleChange } = updateGranularPermissionDto;
      const updateGranularPermission = {
        isAll: isAll ?? granularPermissions.isAll,
        ...(name && { name }),
      };
      const updateResource: UpdateResourceGroupPermissionsObject = {
        group,
        granularPermissions,
        actions,
        resourcesToDelete,
        resourcesToAdd,
        allowRoleChange,
      };
      await catchDbException(async () => {
        if (Object.keys(updateGranularPermission).length > 0)
          await manager.update(GranularPermissions, id, updateGranularPermission);
      }, [DATA_BASE_CONSTRAINTS.GRANULAR_PERMISSIONS_NAME_UNIQUE]);
      await this.updateResourcePermissions(updateResource, organizationId, manager);
    }, manager);
  }

  async delete(id: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.delete(GranularPermissions, id);
    }, manager);
  }

  async createResourceGroupPermission(
    createMetaData: ResourcePermissionMetaData,
    createResourcePermissionsObj?: CreateResourcePermissionObject,
    manager?: EntityManager
  ): Promise<GranularResourcePermissions> {
    let resourceGranularPermissions;
    const { granularPermissions, organizationId } = createMetaData;
    const { type } = granularPermissions;

    await dbTransactionWrap(async (manager: EntityManager) => {
      switch (type) {
        case ResourceType.APP:
          resourceGranularPermissions = await this.createAppGroupPermission(
            { granularPermissions, organizationId },
            createResourcePermissionsObj,
            manager
          );
          break;
      }
    }, manager);
    return resourceGranularPermissions;
  }

  private async createAppGroupPermission(
    createMetaData: ResourcePermissionMetaData,
    createAppPermissionsObj?: CreateAppsPermissionsObject,
    manager?: EntityManager
  ): Promise<AppsGroupPermissions> {
    const { granularPermissions, organizationId } = createMetaData;
    const { resourcesToAdd, canEdit } = createAppPermissionsObj;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const groupEditors = await this.groupPermissionsUtilityService.getRoleUsersList(
        USER_ROLE.END_USER,
        organizationId,
        granularPermissions.groupId,
        manager
      );
      if (groupEditors.length && canEdit)
        throw new BadRequestException({
          message: {
            error: ERROR_HANDLER.EDITOR_LEVEL_PERMISSION_NOT_ALLOWED_END_USER,
            data: groupEditors.map((user) => user.email),
            title: 'Cannot create permissions',
          },
        });

      const appGRoupPermissions = await manager.save(
        manager.create(AppsGroupPermissions, {
          ...createAppPermissionsObj,
          granularPermissionId: granularPermissions.id,
        })
      );
      if (resourcesToAdd) {
        await Promise.all(
          resourcesToAdd.map((app) => {
            return manager.save(GroupApps, {
              appId: app.appId,
              appsGroupPermissionsId: appGRoupPermissions.id,
            });
          })
        );
      }
    }, manager);
  }

  private async updateResourcePermissions(
    updateResourceGroupPermissionsObject: UpdateResourceGroupPermissionsObject,
    organizationId: string,
    manager?: EntityManager
  ) {
    const { granularPermissions } = updateResourceGroupPermissionsObject;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      switch (granularPermissions.type) {
        case ResourceType.APP:
          await this.updateAppsGroupPermission(updateResourceGroupPermissionsObject, organizationId, manager);
          break;
      }
    }, manager);
  }

  private async updateAppsGroupPermission(
    UpdateResourceGroupPermissionsObject: UpdateResourceGroupPermissionsObject,
    organizationId: string,
    manager?: EntityManager
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { granularPermissions, actions, resourcesToDelete, resourcesToAdd, group, allowRoleChange } =
        UpdateResourceGroupPermissionsObject;

      validateAppResourcePermissionUpdateOperation(group, actions);
      const { canEdit } = actions;
      const groupEndUsers = await this.groupPermissionsUtilityService.getRoleUsersList(
        USER_ROLE.END_USER,
        organizationId,
        granularPermissions.groupId,
        manager
      );
      if (groupEndUsers.length && canEdit) {
        if (!allowRoleChange) {
          throw new MethodNotAllowedException({
            message: {
              error: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP,
              data: groupEndUsers?.map((user) => user.email),
              title: 'Cannot add this permission to the group',
              type: 'USER_ROLE_CHANGE',
            },
          });
        }
        await Promise.all(
          groupEndUsers.map(async (userItem) => {
            const currentRoleUser = userItem.userGroups[0].id;
            const roleGroup = await this.groupPermissionsUtilityService.getRoleGroup(
              USER_ROLE.BUILDER,
              group.organizationId,
              manager
            );
            await manager.delete(GroupUsers, currentRoleUser);
            const newUserRole = manager.create(GroupUsers, { groupId: roleGroup.id, userId: userItem.id });
            await manager.save(newUserRole);
          })
        );
      }

      const appsGroupPermissions = await manager.findOne(AppsGroupPermissions, {
        where: {
          granularPermissionId: granularPermissions.id,
        },
      });

      if (actions) {
        if (actions.canEdit) actions.canView = false;
        else if (actions.canView) actions.canEdit = false;
        await manager.update(AppsGroupPermissions, appsGroupPermissions.id, actions);
      }
      if (resourcesToDelete?.length) {
        for (const groupApp of resourcesToDelete) await manager.delete(GroupApps, groupApp.id);
      }
      if (resourcesToAdd?.length) {
        for (const app of resourcesToAdd) {
          await manager.save(
            manager.create(GroupApps, {
              appId: app.appId,
              appsGroupPermissionsId: appsGroupPermissions.id,
            })
          );
        }
      }
    }, manager);
  }
}
