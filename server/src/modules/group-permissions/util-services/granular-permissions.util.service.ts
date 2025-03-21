import { GroupPermissions } from '@entities/group_permissions.entity';
import { DATA_BASE_CONSTRAINTS, ERROR_HANDLER } from '../constants/error';
import { Injectable, BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { ResourceType, USER_ROLE } from '../constants';
import {
  CreateGranularPermissionObject,
  CreateResourcePermissionObject,
  ResourceCreateValidation,
  ResourceGroupActions,
  UpdateGranularPermissionObject,
  UpdateResourceGroupPermissionsObject,
  ValidateResourceAction,
} from '../types/granular_permissions';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { catchDbException } from '@helpers/utils.helper';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { RolesUtilService } from '@modules/roles/util.service';
import { GroupPermissionsRepository } from '../repository';
import * as _ from 'lodash';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '../constants/granular_permissions';
import { RolesRepository } from '@modules/roles/repository';
import { IGranularPermissionsUtilService } from '../interfaces/IUtilService';

@Injectable()
export class GranularPermissionsUtilService implements IGranularPermissionsUtilService {
  constructor(
    protected roleUtilService: RolesUtilService,
    protected groupPermissionsRepository: GroupPermissionsRepository,
    protected roleRepository: RolesRepository
  ) {}

  validateGranularPermissionCreateOperation(group: GroupPermissions) {
    if (group.name === USER_ROLE.ADMIN) {
      throw new BadRequestException(ERROR_HANDLER.ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS);
    }
  }

  validateGranularPermissionUpdateOperation(group: GroupPermissions, organizationId: string) {
    if (_.isEmpty(group)) {
      throw new BadRequestException();
    }
    if (group.organizationId !== organizationId) {
      throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
    }
    if (group.name === USER_ROLE.ADMIN) {
      throw new BadRequestException(ERROR_HANDLER.ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS);
    }
  }

  protected validateAppResourcePermissionUpdateOperation(
    group: GroupPermissions,
    actions: ResourceGroupActions<ResourceType.APP>
  ) {
    if (group.name === USER_ROLE.END_USER && actions.canEdit) {
      throw new BadRequestException(ERROR_HANDLER.EDITOR_LEVEL_PERMISSION_NOT_ALLOWED_END_USER);
    }
  }

  protected validateDataSourceResourcePermissionUpdateOperation(group: GroupPermissions) {
    if (group.name === USER_ROLE.END_USER) {
      throw new BadRequestException(ERROR_HANDLER.EDITOR_LEVEL_PERMISSION_NOT_ALLOWED_END_USER);
    }
  }

  async create(
    createGranularPermissionObject: CreateGranularPermissionObject,
    createResourcePermissionsObj: CreateResourcePermissionObject<any>,
    manager?: EntityManager
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { createGranularPermissionDto, organizationId } = createGranularPermissionObject;
      const { name, type, groupId, isAll } = createGranularPermissionDto;
      const granularPermissions: GranularPermissions = await catchDbException(async () => {
        const granularPermissions = manager.create(GranularPermissions, { name, type, groupId, isAll });
        return await manager.save(granularPermissions);
      }, [DATA_BASE_CONSTRAINTS.GRANULAR_PERMISSIONS_NAME_UNIQUE]);

      if (isAll) {
        // Making resourcesToAdd empty if isAll is true
        createResourcePermissionsObj.resourcesToAdd = [];
      }

      await this.createResourceGroupPermission(
        organizationId,
        granularPermissions,
        createResourcePermissionsObj,
        manager
      );
      return granularPermissions;
    }, manager);
  }

  async createResourceGroupPermission(
    organizationId: string,
    granularPermissions: GranularPermissions,
    createResourcePermissionsObj: CreateResourcePermissionObject<any>,
    manager?: EntityManager
  ): Promise<void> {
    const { type } = granularPermissions;

    await dbTransactionWrap(async (manager: EntityManager) => {
      switch (type) {
        case ResourceType.APP:
          await this.createAppGroupPermission(
            organizationId,
            granularPermissions,
            createResourcePermissionsObj as CreateResourcePermissionObject<ResourceType.APP>,
            manager
          );
          break;
        default:
          break;
      }
    }, manager);
  }

  protected async createAppGroupPermission(
    organizationId: string,
    granularPermissions: GranularPermissions,
    createAppPermissionsObj?: CreateResourcePermissionObject<ResourceType.APP>,
    manager?: EntityManager
  ): Promise<void> {
    const { resourcesToAdd, canEdit } = createAppPermissionsObj;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await this.validateResourceCreation(
        {
          groupId: granularPermissions.groupId,
          organizationId,
          isBuilderPermissions: canEdit,
        },
        manager
      );

      const appGRoupPermissions = await manager.save(
        manager.create(AppsGroupPermissions, {
          ...createAppPermissionsObj,
          granularPermissionId: granularPermissions.id,
        })
      );
      if (resourcesToAdd?.length) {
        await manager.insert(
          GroupApps,
          resourcesToAdd.map((app) => ({ appId: app.appId, appsGroupPermissionsId: appGRoupPermissions.id }))
        );
      }
    }, manager);
  }

  async validateResourceCreation(params: ResourceCreateValidation, manager: EntityManager) {
    const { groupId, organizationId, isBuilderPermissions } = params;
    if (!isBuilderPermissions) {
      return;
    }
    const usersInGroup = await this.groupPermissionsRepository.getUsersInGroup(groupId, organizationId, null, manager);

    if (!usersInGroup?.length) {
      return;
    }

    const endUsers = await this.roleRepository.getRoleUsersList(
      USER_ROLE.END_USER,
      organizationId,
      usersInGroup.map((groupUser) => groupUser.userId),
      manager
    );
    if (endUsers.length)
      throw new BadRequestException({
        message: {
          error: ERROR_HANDLER.EDITOR_LEVEL_PERMISSIONS_NOT_ALLOWED,
          data: endUsers.map((user) => user.email),
          title: 'Cannot create permissions',
        },
      });
  }

  getBasicPlanGranularPermissions(role: USER_ROLE): GranularPermissions[] {
    const appGranularPermission = new GranularPermissions();
    const appGroupPermissions = new AppsGroupPermissions();
    appGranularPermission.appsGroupPermissions = appGroupPermissions;

    switch (role) {
      case USER_ROLE.ADMIN:
      case USER_ROLE.BUILDER:
        appGranularPermission.name = DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.APP];
        appGranularPermission.isAll = true;
        appGranularPermission.type = ResourceType.APP;
        appGroupPermissions.canEdit = true;
        return [appGranularPermission];

      case USER_ROLE.END_USER:
        appGranularPermission.name = DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.APP];
        appGranularPermission.isAll = true;
        appGranularPermission.type = ResourceType.APP;
        appGroupPermissions.canView = true;
        return [appGranularPermission];

      default:
        return [];
    }
  }

  async update(id: string, updateGranularPermissionsObj: UpdateGranularPermissionObject, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { organizationId, updateGranularPermissionDto, group } = updateGranularPermissionsObj;
      const granularPermissions = await this.groupPermissionsRepository.getGranularPermission(
        id,
        organizationId,
        manager
      );
      const { isAll, name, resourcesToAdd, resourcesToDelete, actions, allowRoleChange } = updateGranularPermissionDto;
      const updateGranularPermission = {
        isAll: isAll ?? granularPermissions.isAll,
        ...(name && { name }),
      };
      const { type } = granularPermissions;
      const updateResource: UpdateResourceGroupPermissionsObject<typeof type> = {
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

  async updateResourcePermissions(
    updateResourceGroupPermissionsObject: UpdateResourceGroupPermissionsObject<any>,
    organizationId: string,
    manager?: EntityManager
  ) {
    const { granularPermissions } = updateResourceGroupPermissionsObject;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      switch (granularPermissions.type) {
        case ResourceType.APP:
          await this.updateAppsGroupPermission(updateResourceGroupPermissionsObject, organizationId, manager);
          break;
        default:
          break;
      }
    }, manager);
  }

  protected async updateAppsGroupPermission(
    UpdateResourceGroupPermissionsObject: UpdateResourceGroupPermissionsObject<ResourceType.APP>,
    organizationId: string,
    manager?: EntityManager
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { granularPermissions, actions, resourcesToDelete, resourcesToAdd, group, allowRoleChange } =
        UpdateResourceGroupPermissionsObject;

      this.validateAppResourcePermissionUpdateOperation(group, actions);
      const { canEdit } = actions;
      await this.validateResourceAction(
        {
          groupId: granularPermissions.groupId,
          organizationId,
          isBuilderPermissions: canEdit,
        },
        allowRoleChange,
        manager
      );

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

  protected async validateResourceAction(
    params: ValidateResourceAction,
    allowRoleChange: boolean,
    manager: EntityManager
  ) {
    const { organizationId, groupId, isBuilderPermissions } = params;

    if (!isBuilderPermissions) {
      // Group does not have any builder permissions - No need to proceed
      return;
    }
    const groupUsers = await this.groupPermissionsRepository.getUsersInGroup(groupId, organizationId, null, manager);

    if (!groupUsers?.length) {
      // No users present in the group
      return;
    }

    const endUsersList = await this.roleRepository.getRoleUsersList(
      USER_ROLE.END_USER,
      organizationId,
      groupUsers.map((groupUser) => groupUser.userId),
      manager
    );
    if (endUsersList.length) {
      // Group has builder permissions and end users are present
      if (!allowRoleChange) {
        // If role change is not allowed
        throw new MethodNotAllowedException({
          message: {
            error: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP,
            data: endUsersList?.map((user) => user.email),
            title: 'Cannot add this permission to the group',
            type: 'USER_ROLE_CHANGE',
          },
        });
      }
      // Change end users to builders
      await this.roleUtilService.changeEndUserToEditor(
        organizationId,
        endUsersList.map((user) => user.id),
        endUsersList[0].userGroups[0].group.id,
        manager
      );
    }
  }
}
