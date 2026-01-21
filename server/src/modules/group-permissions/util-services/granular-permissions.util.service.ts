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
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { GroupFolders } from '@entities/group_folders.entity';
import { RolesUtilService } from '@modules/roles/util.service';
import { GroupPermissionsRepository } from '../repository';
import * as _ from 'lodash';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '../constants/granular_permissions';
import { RolesRepository } from '@modules/roles/repository';
import { IGranularPermissionsUtilService } from '../interfaces/IUtilService';
import { APP_TYPES } from '@modules/apps/constants';

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
    actions: ResourceGroupActions<ResourceType.APP | ResourceType.WORKFLOWS>
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
        case ResourceType.FOLDER:
          await this.createFolderGroupPermission(
            organizationId,
            granularPermissions,
            createResourcePermissionsObj as CreateResourcePermissionObject<ResourceType.FOLDER>,
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
    createAppPermissionsObj?: CreateResourcePermissionObject<ResourceType.APP | ResourceType.WORKFLOWS>,
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

      // Validate environment permissions for end-users (only for APP type, not WORKFLOWS)
      if (granularPermissions.type === ResourceType.APP) {
        const appPermissions = createAppPermissionsObj as CreateResourcePermissionObject<ResourceType.APP>;
        await this.validateEnvironmentPermissions(
          {
            groupId: granularPermissions.groupId,
            organizationId,
            isBuilderPermissions: canEdit,
          },
          {
            canAccessDevelopment: appPermissions.canAccessDevelopment,
            canAccessStaging: appPermissions.canAccessStaging,
            canAccessProduction: appPermissions.canAccessProduction,
          },
          manager
        );
      }

      createAppPermissionsObj.appType = this.getAppTypeFromResourceType(granularPermissions.type);

      const appGroupPermissions = await manager.save(
        manager.create(AppsGroupPermissions, {
          ...createAppPermissionsObj,
          granularPermissionId: granularPermissions.id,
        })
      );

      if (resourcesToAdd?.length) {
        await manager.insert(
          GroupApps,
          resourcesToAdd.map((app) => ({ appId: app.appId, appsGroupPermissionsId: appGroupPermissions.id }))
        );
      }
    }, manager);
  }

  protected async createFolderGroupPermission(
    organizationId: string,
    granularPermissions: GranularPermissions,
    createFolderPermissionsObj: CreateResourcePermissionObject<ResourceType.FOLDER>,
    manager: EntityManager
  ): Promise<void> {
    const { resourcesToAdd, canEditFolder, canEditApps } = createFolderPermissionsObj;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Validate end-user constraints: can only have canViewApps
      await this.validateFolderResourceCreation(
        {
          groupId: granularPermissions.groupId,
          organizationId,
          isBuilderPermissions: canEditFolder || canEditApps,
        },
        manager
      );

      const foldersGroupPermissions = await manager.save(
        manager.create(FoldersGroupPermissions, {
          canEditFolder: createFolderPermissionsObj.canEditFolder || false,
          canEditApps: createFolderPermissionsObj.canEditApps || false,
          canViewApps: createFolderPermissionsObj.canViewApps || false,
          granularPermissionId: granularPermissions.id,
        })
      );

      if (resourcesToAdd?.length) {
        await manager.insert(
          GroupFolders,
          resourcesToAdd.map((folder) => ({
            folderId: folder.folderId,
            foldersGroupPermissionsId: foldersGroupPermissions.id,
          }))
        );
      }
    }, manager);
  }

  protected async validateFolderResourceCreation(
    params: ResourceCreateValidation,
    manager: EntityManager
  ): Promise<void> {
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

    if (endUsers.length) {
      throw new BadRequestException({
        message: {
          error: 'End-users cannot have Edit Folder or Edit Apps permissions',
          data: endUsers.map((user) => user.email),
          title: 'Cannot add this permission to the group',
          type: 'USER_ROLE_CHANGE_ADD_PERMISSIONS',
        },
      });
    }
  }

  private getAppTypeFromResourceType(type: ResourceType) {
    switch (type) {
      case ResourceType.APP:
        return APP_TYPES.FRONT_END;
      case ResourceType.WORKFLOWS:
        return APP_TYPES.WORKFLOW;
      default:
        throw new BadRequestException('Invalid resource type');
    }
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
          title: 'Cannot add this permission to the group',
          type: 'USER_ROLE_CHANGE_ADD_PERMISSIONS',
        },
      });
  }

  async validateEnvironmentPermissions(
    params: ResourceCreateValidation,
    environmentPermissions: {
      canAccessDevelopment?: boolean;
      canAccessStaging?: boolean;
      canAccessProduction?: boolean;
    },
    manager: EntityManager
  ) {
    const { groupId, organizationId } = params;
    const hasBuilderEnvironments =
      environmentPermissions.canAccessDevelopment ||
      environmentPermissions.canAccessStaging ||
      environmentPermissions.canAccessProduction;

    if (!hasBuilderEnvironments) {
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

    if (endUsers.length) {
      throw new BadRequestException({
        message: {
          error: ERROR_HANDLER.EDITOR_LEVEL_PERMISSIONS_NOT_ALLOWED,
          data: endUsers.map((user) => user.email),
          title: 'Cannot add this permission to the group',
          type: 'USER_ROLE_CHANGE_ADD_PERMISSIONS',
        },
      });
    }
  }

  getBasicPlanGranularPermissions(role: USER_ROLE): GranularPermissions[] {
    const appGranularPermission = new GranularPermissions();
    const appGroupPermissions = new AppsGroupPermissions();
    appGranularPermission.appsGroupPermissions = appGroupPermissions;

    const folderGranularPermission = new GranularPermissions();
    const folderGroupPermissions = new FoldersGroupPermissions();
    folderGranularPermission.foldersGroupPermissions = folderGroupPermissions;

    switch (role) {
      case USER_ROLE.ADMIN:
        appGranularPermission.name = DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.APP];
        appGranularPermission.isAll = true;
        appGranularPermission.type = ResourceType.APP;
        appGroupPermissions.canEdit = true;
        appGroupPermissions.appType = APP_TYPES.FRONT_END;
        appGroupPermissions.canAccessDevelopment = true;
        appGroupPermissions.canAccessStaging = true;
        appGroupPermissions.canAccessProduction = true;
        appGroupPermissions.canAccessReleased = true;

        folderGranularPermission.name = DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.FOLDER];
        folderGranularPermission.isAll = true;
        folderGranularPermission.type = ResourceType.FOLDER;
        folderGroupPermissions.canEditApps = false;
        folderGroupPermissions.canViewApps = false;

        return [appGranularPermission, folderGranularPermission];

      case USER_ROLE.BUILDER:
        appGranularPermission.name = DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.APP];
        appGranularPermission.isAll = true;
        appGranularPermission.type = ResourceType.APP;
        appGroupPermissions.canEdit = true;
        appGroupPermissions.appType = APP_TYPES.FRONT_END;
        appGroupPermissions.canAccessDevelopment = true;
        appGroupPermissions.canAccessStaging = true;
        appGroupPermissions.canAccessProduction = true;
        appGroupPermissions.canAccessReleased = true;

        folderGranularPermission.name = DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.FOLDER];
        folderGranularPermission.isAll = true;
        folderGranularPermission.type = ResourceType.FOLDER;
        // Radio button selection: Builder has "Edit folder" permission
        // Only set the selected permission level to true; implied permissions are derived at runtime
        folderGroupPermissions.canEditFolder = true;
        folderGroupPermissions.canEditApps = false;
        folderGroupPermissions.canViewApps = false;

        return [appGranularPermission, folderGranularPermission];

      case USER_ROLE.END_USER:
        appGranularPermission.name = DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.APP];
        appGranularPermission.isAll = true;
        appGranularPermission.type = ResourceType.APP;
        appGroupPermissions.canView = true;
        appGroupPermissions.canAccessDevelopment = false;
        appGroupPermissions.canAccessStaging = false;
        appGroupPermissions.canAccessProduction = false;
        appGroupPermissions.canAccessReleased = true;

        folderGranularPermission.name = DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.FOLDER];
        folderGranularPermission.isAll = true;
        folderGranularPermission.type = ResourceType.FOLDER;
        folderGroupPermissions.canEditFolder = false;
        folderGroupPermissions.canEditApps = false;
        folderGroupPermissions.canViewApps = true;

        return [appGranularPermission, folderGranularPermission];

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
      const updateResource: UpdateResourceGroupPermissionsObject<typeof granularPermissions.type> = {
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
        case ResourceType.FOLDER:
          await this.updateFoldersGroupPermission(updateResourceGroupPermissionsObject, organizationId, manager);
          break;
        default:
          break;
      }
    }, manager);
  }

  protected async updateFoldersGroupPermission(
    updateResourceGroupPermissionsObject: UpdateResourceGroupPermissionsObject<ResourceType.FOLDER>,
    organizationId: string,
    manager?: EntityManager
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { granularPermissions, actions, resourcesToDelete, resourcesToAdd, group } =
        updateResourceGroupPermissionsObject;

      // Validate end-user constraints
      if (actions && (actions.canEditFolder || actions.canEditApps)) {
        await this.validateFolderResourceCreation(
          {
            groupId: granularPermissions.groupId,
            organizationId,
            isBuilderPermissions: true,
          },
          manager
        );
      }

      const foldersGroupPermissions = granularPermissions.foldersGroupPermissions;

      // Update permission flags
      if (actions) {
        await manager.update(FoldersGroupPermissions, foldersGroupPermissions.id, {
          canEditFolder: actions.canEditFolder ?? foldersGroupPermissions.canEditFolder,
          canEditApps: actions.canEditApps ?? foldersGroupPermissions.canEditApps,
          canViewApps: actions.canViewApps ?? foldersGroupPermissions.canViewApps,
        });
      }

      // Delete removed folders
      if (resourcesToDelete?.length) {
        await manager.delete(
          GroupFolders,
          resourcesToDelete.map((item) => item.id)
        );
      }

      // Add new folders
      if (resourcesToAdd?.length) {
        await manager.insert(
          GroupFolders,
          resourcesToAdd.map((folder) => ({
            folderId: folder.folderId,
            foldersGroupPermissionsId: foldersGroupPermissions.id,
          }))
        );
      }
    }, manager);
  }

  protected async updateAppsGroupPermission(
    UpdateResourceGroupPermissionsObject: UpdateResourceGroupPermissionsObject<
      ResourceType.APP | ResourceType.WORKFLOWS
    >,
    organizationId: string,
    manager?: EntityManager
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { granularPermissions, actions, resourcesToDelete, resourcesToAdd, group, allowRoleChange } =
        UpdateResourceGroupPermissionsObject;

      this.validateAppResourcePermissionUpdateOperation(
        group,
        actions as ResourceGroupActions<ResourceType.APP | ResourceType.WORKFLOWS>
      );

      const canEdit = actions.canEdit;
      const canAccessProduction = (actions as any).canAccessProduction;
      const canAccessDevelopment = (actions as any).canAccessDevelopment;
      const canAccessStaging = (actions as any).canAccessStaging;

      const isBuilderLevelUpdate =
        canEdit === true || canAccessProduction === true || canAccessDevelopment === true || canAccessStaging === true;

      const hasBuilderLevelEnvironments =
        canAccessProduction === true || canAccessDevelopment === true || canAccessStaging === true;

      await this.validateResourceAction(
        {
          groupId: granularPermissions.groupId,
          organizationId,
          isBuilderPermissions: isBuilderLevelUpdate,
          isEnvironmentPermissions: hasBuilderLevelEnvironments,
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
