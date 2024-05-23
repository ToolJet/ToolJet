import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateGranularPermissionDto } from '@dto/granular-permissions.dto';
import { ResourceType } from '@module/user_resource_permissions/constants/granular-permissions.constant';
import {
  GranularResourcePermissions,
  CreateResourcePermissionObject,
  CreateAppsPermissionsObject,
  UpdateResourceGroupPermissionsObject,
} from '@module/user_resource_permissions/interface/granular-permissions.interface';
import { EntityManager } from 'typeorm';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import {
  GranularPermissionQuerySearchParam,
  UpdateGranularPermissionObject,
} from '@module/user_resource_permissions/interface/granular-permissions.interface';
import { catchDbException, dbTransactionWrap } from '@helpers/utils.helper';
import {
  DATA_BASE_CONSTRAINTS,
  USER_ROLE,
} from '@module/user_resource_permissions/constants/group-permissions.constant';
import { ERROR_HANDLER } from '@module/user_resource_permissions/constants/granular-permissions.constant';
import {
  getAllGranularPermissionQuery,
  getGranularPermissionQuery,
} from '@module/user_resource_permissions/utility/granular-permissios.utility';
import { GroupPermissionsUtilityService } from '@module/user_resource_permissions/services/group-permissions.utility.service';
import { GroupApps } from 'src/entities/group_apps.entity';

@Injectable()
export class GranularPermissionsService {
  constructor(private groupPermissionsUtilityService: GroupPermissionsUtilityService) {}
  async create(createGranularPermissionDto: CreateGranularPermissionDto, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const granularPermissions = await catchDbException(async () => {
        const granularPermissions = manager.create(GranularPermissions, createGranularPermissionDto);
        return await manager.save(granularPermissions);
      }, [DATA_BASE_CONSTRAINTS.GRANULAR_PERMISSIONS_NAME_UNIQUE]);
      await this.createResourceGroupPermission(granularPermissions, {}, manager);
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
      const { organizationId, updateGranularPermissionDto } = updateGranularPermissionsObj;
      const { isAll, name, resourcesToAdd, resourcesToDelete, actions } = updateGranularPermissionDto;
      const updateGranularPermission = {
        isAll,
        name,
      };
      const updateResource: UpdateResourceGroupPermissionsObject = {
        granularPermissions,
        actions,
        resourcesToDelete,
        resourcesToAdd,
      };
      await catchDbException(async () => {
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
    granularPermissions: GranularPermissions,
    createResourcePermissionsObj?: CreateResourcePermissionObject,
    manager?: EntityManager
  ): Promise<GranularResourcePermissions> {
    let resourceGranularPermissions;
    const { type } = granularPermissions;
    await dbTransactionWrap(async (manager: EntityManager) => {
      switch (type) {
        case ResourceType.APP:
          resourceGranularPermissions = await this.createAppGroupPermission(
            granularPermissions,
            createResourcePermissionsObj,
            manager
          );
          break;
      }
    }, manager);
    return resourceGranularPermissions;
  }

  private async createAppGroupPermission(
    granularPermissions: GranularPermissions,
    createAppPermissionsObj?: CreateAppsPermissionsObject,
    manager?: EntityManager
  ): Promise<AppsGroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.create(AppsGroupPermissions, {
        ...createAppPermissionsObj,
        granularPermissionId: granularPermissions.id,
      });
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
      const { granularPermissions, actions, resourcesToDelete, resourcesToAdd } = UpdateResourceGroupPermissionsObject;
      const groupEditors = await this.groupPermissionsUtilityService.getRoleUsersList(
        USER_ROLE.END_USER,
        organizationId,
        granularPermissions.groupId,
        manager
      );

      //Resource update level
      const editPermissionsPresent = Object.values(actions).some(
        (value) => typeof value === 'boolean' && value === true
      );
      if (groupEditors.length && editPermissionsPresent)
        throw new BadRequestException({
          message: ERROR_HANDLER.EDITOR_LEVEL_PERMISSIONS_NOT_ALLOWED,
          data: groupEditors,
        });
      const appsGroupPermissions = await manager.findOne(AppsGroupPermissions, {
        where: {
          granularPermissionId: granularPermissions.id,
        },
      });

      if (actions) {
        await manager.update(AppsGroupPermissions, appsGroupPermissions.id, actions);
      }
      if (resourcesToDelete.length) {
        for (const groupApp of resourcesToDelete) await manager.delete(GroupApps, groupApp.id);
      }
      if (resourcesToAdd.length) {
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
