import { AppBase } from '@entities/app_base.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AppVersion } from '@entities/app_version.entity';
import { dbTransactionWrap, getConnectionInstance } from '@helpers/database.helper';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '../dto/granular-permissions';
import { GroupPermissionsRepository } from '../repository';
import { GranularPermissionsUtilService } from '../util-services/granular-permissions.util.service';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GranularPermissionQuerySearchParam } from '../types';
import { AddableResourceItem } from '../types/granular_permissions';
import { IGranularPermissionsService } from '../interfaces/IService';
import { GroupPermissionLicenseUtilService } from '../util-services/license.util.service';
import { USER_ROLE } from '../constants';
import { User } from '@entities/user.entity';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { APP_TYPES } from '@modules/apps/constants';
import { skipAppEditingVersionHydration } from '@modules/apps/subscribers/apps.subscriber';

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

  async getAddableApps(organizationId: string): Promise<AddableResourceItem[]> {
    const manager = getConnectionInstance().manager;
    // Non-workflow apps carry their display name on app_versions.app_name. For git-sync
    // workspaces pick any version on the default branch (default rows are VERSION-type,
    // sub-branches use BRANCH-type — don't filter on version_type). For non-git-sync
    // workspaces every version row carries the same metadata, so any version row works.
    // Workflows keep name on apps.*.
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
        (sub) =>
          sub
            .select('DISTINCT ON (av.app_id) av.app_id', 'app_id')
            .addSelect('av.app_name', 'app_name')
            .from('app_versions', 'av')
            .where('av.branch_id = :branchId', { branchId: defaultBranch.id }),
        'av',
        'av.app_id = app.id'
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
  }

  async getAddableDataSources(organizationId: string): Promise<AddableResourceItem[]> {
    return [];
  }

  async getAddableFolders(organizationId: string): Promise<AddableResourceItem[]> {
    return [];
  }

  async getAll(
    groupId: string,
    organizationId: string,
    searchParam?: GranularPermissionQuerySearchParam
  ): Promise<GranularPermissions[]> {
    // Repository joins App rows via granular_permissions.appsGroupPermissions.groupApps.app —
    // muzzle subscriber to skip per-App AppVersion N+1.
    return skipAppEditingVersionHydration.run(true, async () => {
      const manager = getConnectionInstance().manager;
      const isRestrictedPlan = await this.licenseUtilService.isRestrictedPlan(organizationId);
      const isFeatureEnabled = await this.licenseUtilService.isFeatureEnabled(organizationId);
      const groupPermission = await this.groupPermissionRepository.getGroup({ id: groupId, organizationId }, manager);

      if (isRestrictedPlan || !isFeatureEnabled) {
        return this.granularPermissionUtilService.getBasicPlanGranularPermissions(groupPermission.name as USER_ROLE);
      }
      const permissions = await this.groupPermissionRepository.getAllGranularPermissions(
        {
          groupId,
          ...searchParam,
        },
        organizationId,
        manager
      );

      await this.overlayGranularPermissionAppMetadata(manager, permissions, organizationId);
      return permissions;
    });
  }

  /**
   * The nested `groupApps.app` rows under each granular permission come back with
   * NULL `name/slug/icon/isPublic` for non-workflow apps (metadata lives on
   * app_versions post-migration). Resolve the canonical version per app in a single
   * batched query and mirror the values onto each App entity in-place.
   *
   * Source priority (per app):
   *   - Git-sync workspaces: BRANCH-type version on the workspace's default branch.
   *   - Non-git-sync workspaces: any version row (all rows carry identical metadata).
   */
  private async overlayGranularPermissionAppMetadata(
    manager: EntityManager,
    permissions: GranularPermissions[],
    organizationId: string
  ): Promise<void> {
    const apps: any[] = [];
    for (const perm of permissions) {
      const groupApps = perm.appsGroupPermissions?.groupApps ?? [];
      for (const ga of groupApps) {
        if (ga.app && ga.app.type !== APP_TYPES.WORKFLOW) apps.push(ga.app);
      }
    }
    if (apps.length === 0) return;

    const appIds = Array.from(new Set(apps.map((a) => a.id)));
    const defaultBranch = await manager.findOne(WorkspaceBranch, {
      where: { organizationId, isDefault: true },
      select: ['id'],
    });

    let metadataRows: Pick<AppVersion, 'appId' | 'appName' | 'slug' | 'icon' | 'isPublic'>[];
    if (defaultBranch?.id) {
      // Git-sync: pick one row per app on the default branch. Default branch rows are
      // VERSION-type, sub-branches use BRANCH-type — don't filter on version_type here.
      const rows: {
        app_id: string;
        app_name: string | null;
        slug: string | null;
        icon: string | null;
        is_public: boolean | null;
      }[] = await manager
        .createQueryBuilder()
        .select('DISTINCT ON (av.app_id) av.app_id', 'app_id')
        .addSelect('av.app_name', 'app_name')
        .addSelect('av.slug', 'slug')
        .addSelect('av.icon', 'icon')
        .addSelect('av.is_public', 'is_public')
        .from('app_versions', 'av')
        .where('av.app_id IN (:...appIds)', { appIds })
        .andWhere('av.branch_id = :branchId', { branchId: defaultBranch.id })
        .getRawMany();
      metadataRows = rows.map((r) => ({
        appId: r.app_id,
        appName: r.app_name,
        slug: r.slug,
        icon: r.icon,
        isPublic: r.is_public,
      })) as any;
    } else {
      // Non-git-sync: DISTINCT ON picks one arbitrary version per app — every row
      // carries the same metadata in this mode.
      const rows: {
        app_id: string;
        app_name: string | null;
        slug: string | null;
        icon: string | null;
        is_public: boolean | null;
      }[] = await manager
        .createQueryBuilder()
        .select('DISTINCT ON (av.app_id) av.app_id', 'app_id')
        .addSelect('av.app_name', 'app_name')
        .addSelect('av.slug', 'slug')
        .addSelect('av.icon', 'icon')
        .addSelect('av.is_public', 'is_public')
        .from('app_versions', 'av')
        .where('av.app_id IN (:...appIds)', { appIds })
        .getRawMany();
      metadataRows = rows.map((r) => ({
        appId: r.app_id,
        appName: r.app_name,
        slug: r.slug,
        icon: r.icon,
        isPublic: r.is_public,
      })) as any;
    }

    const metaByAppId = new Map(metadataRows.map((r) => [r.appId, r]));
    for (const app of apps) {
      const meta = metaByAppId.get(app.id);
      if (!meta) continue;
      if (meta.appName != null) app.name = meta.appName;
      if (meta.slug != null) app.slug = meta.slug;
      if (meta.icon != null) app.icon = meta.icon;
      if (meta.isPublic != null) app.isPublic = meta.isPublic;
    }
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
