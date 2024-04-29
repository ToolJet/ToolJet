import { Injectable } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '@dto/granular-permissions.dto';
import { ResourceType } from '@module/group_permissions/constants/granular-permissions.constant';
import {
  UpdateAppsGroupPermissionObject,
  GranularResourcePermissions,
} from '@module/group_permissions/interface/granular-permissions.interface';
import { GroupPermissionsServiceV2 } from './group_permissions.service.v2';
import { EntityManager, getManager } from 'typeorm';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import { GranularPermissionQuerySearchParam } from '@module/group_permissions/interface/granular-permissions.interface';
import { createWhereConditions } from '@helpers/db-utility/db-search.helper';
import { dbTransactionWrap } from '@helpers/utils.helper';

@Injectable()
export class GranularPermissionsService {
  constructor(private groupPermissionsService: GroupPermissionsServiceV2) {}
  async create(manager: EntityManager, createGranularPermissionDto: CreateGranularPermissionDto) {
    const granularPermissions = manager.create(GranularPermissions, createGranularPermissionDto);
    return await manager.save(granularPermissions);
  }

  async getAll(groupId: string, searchParam?: GranularPermissionQuerySearchParam) {
    const manager: EntityManager = getManager();
    const whereConditions = createWhereConditions(searchParam);
    return await manager.find(GroupPermissions, {
      where: { groupId, ...whereConditions },
    });
  }

  async get(id: string, searchParam?: GranularPermissionQuerySearchParam) {
    const manager: EntityManager = getManager();
    const whereConditions = createWhereConditions(searchParam);
    return await manager.find(GranularPermissions, {
      where: { id, ...whereConditions },
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
    isOnlyBuilder: boolean,
    granularPermissions: GranularPermissions
  ): Promise<GranularResourcePermissions> {
    let resourceGranularPermissions;
    const { type } = granularPermissions;
    switch (type) {
      case ResourceType.APP:
        resourceGranularPermissions = await this.createAppGroupPermission(manager, isOnlyBuilder, granularPermissions);
        break;
    }
    return resourceGranularPermissions;
  }

  async createAppGroupPermission(
    manager: EntityManager,
    isOnlyBuilder: boolean,
    granularPermissions: GranularPermissions
  ): Promise<AppsGroupPermissions> {
    return await manager.create(AppsGroupPermissions, {
      canEdit: isOnlyBuilder,
      canView: !isOnlyBuilder,
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
