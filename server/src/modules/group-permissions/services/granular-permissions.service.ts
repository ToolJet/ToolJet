import { AppBase } from '@entities/app_base.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '../dto/granular-permissions';
import { GroupPermissionsRepository } from '../repository';
import { GranularPermissionsUtilService } from '../util-services/granular-permissions.util.service';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GranularPermissionQuerySearchParam } from '../types';
import { IGranularPermissionsService } from '../interfaces/IService';
import { GroupPermissionLicenseUtilService } from '../util-services/license.util.service';
import { USER_ROLE } from '../constants';

@Injectable()
export class GranularPermissionsService implements IGranularPermissionsService {
  constructor(
    protected readonly groupPermissionRepository: GroupPermissionsRepository,
    protected readonly granularPermissionUtilService: GranularPermissionsUtilService,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly licenseUtilService: GroupPermissionLicenseUtilService
  ) {}

  async create(organizationId: string, createGranularPermissionsDto: CreateGranularPermissionDto) {
    const { createResourcePermissionObject } = createGranularPermissionsDto;
    const group = await this.groupPermissionRepository.getGroup({
      id: createGranularPermissionsDto.groupId,
      organizationId,
    });
    this.granularPermissionUtilService.validateGranularPermissionCreateOperation(group);
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await this.granularPermissionUtilService.create(
        {
          createGranularPermissionDto: createGranularPermissionsDto,
          organizationId,
        },
        createResourcePermissionObject,
        manager
      );

      await this.licenseUserService.validateUser(manager);
    });
  }
  async getAddableApps(organizationId: string): Promise<{ AddableResourceItem }[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const apps = await manager.find(AppBase, {
        where: {
          type: 'front-end',
          organizationId,
        },
      });
      return apps.map((app) => {
        return {
          name: app.name,
          id: app.id,
        };
      });
    });
  }

  async getAddableDataSources(organizationId: string): Promise<{ AddableResourceItem }[]> {
    return [];
  }

  async getAll(
    groupId: string,
    organizationId: string,
    filterDataSource?: boolean,
    searchParam?: GranularPermissionQuerySearchParam
  ): Promise<GranularPermissions[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const isLicenseValid = await this.licenseUtilService.isValidLicense();
      const groupPermission = await this.groupPermissionRepository.getGroup({
        id: groupId,
        organizationId,
      });

      if (!isLicenseValid) {
        return this.granularPermissionUtilService.getBasicPlanGranularPermissions(groupPermission.name as USER_ROLE);
      }
      return await this.groupPermissionRepository.getAllGranularPermissions(
        {
          groupId,
          ...searchParam,
        },
        organizationId,
        manager,
        filterDataSource ? true : false //Filter out data source granular permissions CE
      );
    });
  }

  async update(id: string, organizationId: string, updateGranularPermissionDto: UpdateGranularPermissionDto<any>) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const granularPermissions = await this.groupPermissionRepository.getGranularPermission(
        id,
        organizationId,
        manager
      );
      const group = granularPermissions.group;

      this.granularPermissionUtilService.validateGranularPermissionUpdateOperation(group, organizationId);
      await this.granularPermissionUtilService.update(id, {
        group: group,
        organizationId: group.organizationId,
        updateGranularPermissionDto,
      });

      await this.licenseUserService.validateUser(manager);
    });
  }

  async delete(id: string, organizationId: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const granularPermission = await this.groupPermissionRepository.getGranularPermission(
        id,
        organizationId,
        manager
      );

      if (!granularPermission) {
        throw new BadRequestException();
      }
      await manager.delete(GranularPermissions, id);
    });
  }
}
