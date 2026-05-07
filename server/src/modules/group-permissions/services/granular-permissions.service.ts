import { AppBase } from '@entities/app_base.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
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
import { APP_TYPES } from '@modules/apps/constants';

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
      await this.licenseUserService.validateUser(manager, organizationId);

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
      // Non-workflow apps carry their display name on app_versions.app_name. For git-sync
      // workspaces the BRANCH-type version on the default branch is the canonical carrier;
      // for non-git-sync workspaces every version row carries the same metadata, so any
      // version row works. Workflows keep name on apps.*.
      const defaultBranch = await manager.findOne(WorkspaceBranch, {
        where: { organizationId, isDefault: true },
        select: ['id'],
      });

      const qb = manager
        .createQueryBuilder(AppBase, 'app')
        .where('app.organizationId = :organizationId', { organizationId })
        .select(['app.id AS id', 'app.type AS type']);

      if (defaultBranch?.id) {
        qb.leftJoin(
          'app_versions',
          'av',
          'av.app_id = app.id AND av.branch_id = :branchId AND av.version_type = :branchType',
          { branchId: defaultBranch.id, branchType: 'branch' }
        ).addSelect('COALESCE(av.app_name, app.name) AS name');
      } else {
        // Non-git-sync: pick any version's app_name (DISTINCT ON returns one arbitrary row
        // per app_id). COALESCE falls back to apps.name for workflows whose versions
        // don't carry app_name.
        qb.leftJoin(
          (sub) =>
            sub
              .select('DISTINCT ON (av.app_id) av.app_id', 'app_id')
              .addSelect('av.app_name', 'app_name')
              .from('app_versions', 'av'),
          'av',
          'av.app_id = app.id'
        ).addSelect('COALESCE(av.app_name, app.name) AS name');
      }

      const rows: { id: string; type: APP_TYPES; name: string | null }[] = await qb.getRawMany();
      return rows.map((row) => ({
        name: row.name,
        id: row.id,
        type: row.type,
      }));
    });
  }

  async getAddableDataSources(organizationId: string): Promise<{ AddableResourceItem }[]> {
    return [];
  }

  async getAddableFolders(organizationId: string): Promise<{ AddableResourceItem }[]> {
    return [];
  }

  async getAll(
    groupId: string,
    organizationId: string,
    searchParam?: GranularPermissionQuerySearchParam
  ): Promise<GranularPermissions[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Check if plan is restricted (basic/starter have read-only permissions)
      const isRestrictedPlan = await this.licenseUtilService.isRestrictedPlan(organizationId);
      const isFeatureEnabled = await this.licenseUtilService.isFeatureEnabled(organizationId);
      const groupPermission = await this.groupPermissionRepository.getGroup({
        id: groupId,
        organizationId,
      });

      // For restricted plans (basic/starter) or if the feature (custom groups) is not enabled, return basic plan granular permissions regardless of the group permission
      if (isRestrictedPlan || !isFeatureEnabled) {
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
      await this.granularPermissionUtilService.update(
        id,
        {
          group: group,
          organizationId: group.organizationId,
          updateGranularPermissionDto,
        },
        manager
      );

      await this.licenseUserService.validateUser(manager, organizationId);

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
