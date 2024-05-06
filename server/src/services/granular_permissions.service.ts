import { Injectable } from '@nestjs/common';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '@dto/granular-permissions.dto';
import { ResourceType } from '@module/user_resource_permissions/constants/granular-permissions.constant';
import {
  UpdateAppsGroupPermissionObject,
  GranularResourcePermissions,
  CreateResourcePermissionObject,
  CreateAppsPermissionsObject,
} from '@module/user_resource_permissions/interface/granular-permissions.interface';
import { EntityManager, getManager } from 'typeorm';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import { GranularPermissionQuerySearchParam } from '@module/user_resource_permissions/interface/granular-permissions.interface';
import { createWhereConditions } from '@helpers/db-utility/db-search.helper';
import { dbTransactionWrap } from '@helpers/utils.helper';

@Injectable()
export class GranularPermissionsService {
  constructor() {}
  async create(manager: EntityManager, createGranularPermissionDto: CreateGranularPermissionDto) {
    const granularPermissions = manager.create(GranularPermissions, createGranularPermissionDto);
    return await manager.save(granularPermissions);
  }

  async getAll(searchParam: GranularPermissionQuerySearchParam) {
    const manager: EntityManager = getManager();
    const whereConditions = createWhereConditions(searchParam);
    return await manager.find(GranularPermissions, {
      where: whereConditions,
    });
  }

  async get(id: string) {
    const manager: EntityManager = getManager();
    return await manager.find(GranularPermissions, {
      where: { id },
    });
  }

  async update(id: string, updateGranularPermissionsDto: UpdateGranularPermissionDto) {}

  async delete(id: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.delete(GranularPermissions, id);
    });
  }

  async createResourceGroupPermission(
    manager: EntityManager,
    granularPermissions: GranularPermissions,
    createResourcePermissionsObj?: CreateResourcePermissionObject
  ): Promise<GranularResourcePermissions> {
    let resourceGranularPermissions;
    const { type } = granularPermissions;
    switch (type) {
      case ResourceType.APP:
        resourceGranularPermissions = await this.createAppGroupPermission(
          manager,
          granularPermissions,
          createResourcePermissionsObj
        );
        break;
    }
    return resourceGranularPermissions;
  }

  async createAppGroupPermission(
    manager: EntityManager,
    granularPermissions: GranularPermissions,
    createAppPermissionsObj?: CreateAppsPermissionsObject
  ): Promise<AppsGroupPermissions> {
    return await manager.create(AppsGroupPermissions, {
      ...createAppPermissionsObj,
      granularPermissionId: granularPermissions.id,
    });
  }

  async updateAppsGroupPermission(
    granularPermissionId: string,
    updateAppsGroupPermissionObject: UpdateAppsGroupPermissionObject
  ) {}

  async findAddableResource() {}
  1;
}
