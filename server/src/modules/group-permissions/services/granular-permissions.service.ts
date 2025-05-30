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
import { User } from '@entities/user.entity';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';

@Injectable()
export class GranularPermissionsService implements IGranularPermissionsService {
  constructor(
    protected readonly groupPermissionRepository: GroupPermissionsRepository,
    protected readonly granularPermissionUtilService: GranularPermissionsUtilService,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly licenseUtilService: GroupPermissionLicenseUtilService
  ) {}

  async create(user: User, createGranularPermissionsDto: CreateGranularPermissionDto) {
    const organizationId = user.organizationId;
    const { createResourcePermissionObject } = createGranularPermissionsDto;
    const group = await this.groupPermissionRepository.getGroup({
      id: createGranularPermissionsDto.groupId,
      organizationId,
    });
    this.granularPermissionUtilService.validateGranularPermissionCreateOperation(group);
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const granularPermission = await this.granularPermissionUtilService.create(
        {
          createGranularPermissionDto: createGranularPermissionsDto,
          organizationId,
        },
        createResourcePermissionObject,
        manager
      );
      await this.licenseUserService.validateUser(manager);

      //GRANULAR_PERMISSION_APP_CREATE audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: granularPermission.id,
        resourceName: granularPermission.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
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
        manager
      );
    });
  }

  async update(id: string, user: User, updateGranularPermissionDto: UpdateGranularPermissionDto<any>) {
    const organizationId = user.organizationId;
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

      //GRANULAR_PERMISSION_APP_UPDATE audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: granularPermissions.id,
        resourceName: granularPermissions.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    });
  }

  async delete(id: string, user: User) {
    const organizationId = user.organizationId;
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

      //GRANULAR_PERMISSION_APP_DELETE audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: granularPermission.id,
        resourceName: granularPermission.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    });
  }
}
