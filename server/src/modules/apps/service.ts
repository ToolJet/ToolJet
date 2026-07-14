import { User } from '@entities/user.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import {
  AppCreateDto,
  AppListDto,
  AppUpdateDto,
  ValidateAppAccessDto,
  ValidateAppAccessResponseDto,
  VersionReleaseDto,
} from './dto';
import { APP_TYPES, APPS_PAGE_SIZE, FEATURE_KEY } from './constants';
import { AbilityUtilService } from '@modules/ability/util.service';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { App } from '@entities/app.entity';
import { AppBase } from '@entities/app_base.entity';
import { AppsUtilService } from './util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { plainToClass } from 'class-transformer';
import { AppAbility } from '@modules/app/decorators/ability.decorator';
import { VersionRepository } from '@modules/versions/repository';
import { MODULE_VERSION_AUDIT_KEYS } from '@modules/modules/constants';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { skipAppEditingVersionHydration } from './subscribers/apps.subscriber';

type AppListItem = AppBase & {
  appVersions?: AppVersion[];
  moduleContainer?: unknown;
  folderIds?: string[];
  editingVersion?: AppVersion;
  isStub?: boolean;
};
import { AppsRepository } from './repository';
import { FoldersUtilService } from '@modules/folders/util.service';
import { FolderAppsUtilService } from '@modules/folder-apps/util.service';
import { PageService } from './services/page.service';
import { EventsService } from './services/event.service';
import { ComponentsService } from './services/component.service';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { AppEnvironment } from '@entities/app_environments.entity';
import { OrganizationThemesUtilService } from '@modules/organization-themes/util.service';
import { IAppsService } from './interfaces/IService';
import { AiUtilService } from '@modules/ai/util.service';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { MODULES } from '@modules/app/constants/modules';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { DataQueryFolderMapping } from '@entities/data_query_folder_mapping.entity';
import { DataQuery } from '@entities/data_query.entity';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { GitSyncEnvUtilService } from '@modules/organization-env/services/gitsync.util.service';
import { GITConnectionType, OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

@Injectable()
export class AppsService implements IAppsService {
  constructor(
    protected readonly appsUtilService: AppsUtilService,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly versionRepository: VersionRepository,
    protected readonly appRepository: AppsRepository,
    protected readonly foldersUtilService: FoldersUtilService,
    protected readonly folderAppsUtilService: FolderAppsUtilService,
    protected readonly pageService: PageService,
    protected readonly eventService: EventsService,
    protected readonly organizationThemeUtilService: OrganizationThemesUtilService,
    protected readonly aiUtilService: AiUtilService,
    protected readonly componentsService: ComponentsService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly abilityService: AbilityService,
    protected readonly organizationGitRepository: OrganizationGitSyncRepository,
    protected readonly organizationEnvRegistryService: GitSyncEnvUtilService
  ) {}
  async create(user: User, appCreateDto: AppCreateDto) {
    const { name, icon, type, prompt } = appCreateDto;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Workflows don't participate in branching — their app_versions row must have
      // branch_id NULL. Drop any DTO-supplied branchId (frontend may send the current
      // dashboard branch from localStorage even for workflows) and skip the
      // default-branch auto-fill below. Otherwise the row lands with branch_id set
      // but app_name/slug NULL (the workflow create path doesn't write those), which
      // trips chk_app_versions_branch_metadata.
      let branchId = type === APP_TYPES.WORKFLOW ? undefined : appCreateDto.branchId;
      if (!branchId && type !== APP_TYPES.WORKFLOW) {
        const orgGit = await this.organizationGitRepository?.findOrgGitByOrganizationId(user.organizationId);
        if (orgGit) {
          const defaultBranch = await manager.findOne(WorkspaceBranch, {
            where: { organizationId: user.organizationId, isDefault: true },
          });
          branchId = defaultBranch?.id;
        }
      }

      // Reject app creation on the default branch when branching is enabled.
      // Apps must be authored on feature branches and merged in; creating
      // directly on main would bypass the git-sync review flow entirely.
      if (type !== APP_TYPES.WORKFLOW && branchId) {
        const orgGit = await this.organizationGitRepository?.findOrgGitByOrganizationId(user.organizationId);
        if (orgGit?.isBranchingEnabled) {
          const targetBranch = await manager.findOne(WorkspaceBranch, {
            where: { id: branchId, organizationId: user.organizationId },
            select: ['id', 'isDefault'],
          });
          if (targetBranch?.isDefault) {
            throw new BadRequestException('Apps cannot be created on the default branch. Switch to a feature branch.');
          }
        }
      }

      // Metadata (name/slug/icon) is written directly during creation —
      // appsUtilService.create routes to apps.* for workflows and to app_versions for
      // non-workflows. No follow-up update call needed.
      const app = await this.appsUtilService.create(name, user, type as APP_TYPES, !!prompt, manager, branchId, icon);

      // Mirror the metadata onto the in-memory App so the response carries the values
      // we just wrote to app_versions (non-workflows leave apps.* fields NULL). For
      // workflows these fields are already populated on apps.*.
      if (app.type !== APP_TYPES.WORKFLOW) {
        app.name = name;
        app.slug = app.id;
        app.icon = icon ?? null;
        app.isPublic = false;
      }

      //APP_CREATE audit.
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: app.id,
        resourceName: app.name,
        resourceData: {
          appSlug: app.slug,
          isPublic: app.isPublic,
        },
        metadata: {
          icon: icon || null,
        },
      });

      return decamelizeKeys(app);
    });
  }

  async validatePrivateAppAccess(
    app: App,
    ability: AppAbility,
    user: User,
    validateAppAccessDto: ValidateAppAccessDto
  ) {
    const { accessType, versionName, environmentName, versionId, envId, branchId } = validateAppAccessDto;
    // Non-workflow apps carry slug/name/icon/isPublic on app_versions, not apps.* — hydrate
    // them onto the in-memory App entity using the request's branch context if provided,
    // otherwise the helper resolves default branch BRANCH (git-sync) / any version (non-git-sync).
    await this.appsUtilService.overlayAppMetadata(app, branchId);
    const response = {
      id: app.id,
      slug: app.slug,
      type: app.type,
    };
    // Check permissions - first check app-level, then folder-level
    let hasEditPermission = ability.can(FEATURE_KEY.UPDATE, App, app.id);
    const hasViewPermission = ability.can(FEATURE_KEY.GET_BY_SLUG, App, app.id);

    // If no app-level edit permission, check folder-level edit apps permission
    if (!hasEditPermission) {
      hasEditPermission = await this.checkFolderEditPermission(app.id, user);
    }

    // For preview/viewer access: enforce access type for users without edit permission
    if (!hasEditPermission) {
      // Viewer role: require access_type=view explicitly; reject edit or missing
      if (accessType?.toLowerCase() !== 'view') {
        throw new ForbiddenException({
          organizationId: app.organizationId,
          type: 'restricted-preview',
        });
      }
    }
    /* If the request comes from preview which needs version id */
    if (versionName || environmentName || (versionId && envId)) {
      // Check permissions (already computed above)

      if (!hasEditPermission && !hasViewPermission) {
        throw new ForbiddenException(
          JSON.stringify({
            organizationId: app.organizationId,
          })
        );
      }

      /* Adding backward compatibility for old URLs */
      const version = versionId
        ? await this.versionRepository.findById(versionId, app.id)
        : versionName
          ? await this.versionRepository.findByName(versionName, app.id)
          : // Handle version retrieval based on env
            await this.versionRepository.findLatestVersionForEnvironment(
              app.id,
              envId,
              environmentName,
              app.organizationId
            );

      if (!version) {
        // Check if the app is in stub state (pulled from git but not yet hydrated)
        const stubVersion = await this.versionRepository.findOne({ where: { appId: app.id, isStub: true } });
        if (stubVersion) {
          throw new NotFoundException('app-not-ready');
        }
        throw new NotFoundException("Couldn't found app version. Please check the version name");
      }

      const environment = await this.appsUtilService.validateVersionEnvironment(
        environmentName,
        envId,
        version.currentEnvironmentId,
        app.organizationId
      );

      // Validate environment access for all users (both builders and viewers)
      // Skip validation only for released environment (everyone with view access can see released)
      // Also skip validation for modules and workflows
      if (environment && app.type === APP_TYPES.FRONT_END) {
        const envName = environment.name.toLowerCase();

        // Always allow access to released environment for all users who can view the app
        if (envName !== 'released') {
          const request = RequestContext?.currentContext?.req as any;
          const userPermissions = request?.tj_user_permissions;
          const appPermissions = userPermissions?.APP;

          let hasEnvironmentAccess = false;
          if (appPermissions) {
            switch (envName) {
              case 'development':
                hasEnvironmentAccess = AbilityUtilService.canAccessAppInEnvironment(
                  appPermissions,
                  app.id,
                  'development'
                );
                break;
              case 'staging':
                hasEnvironmentAccess = AbilityUtilService.canAccessAppInEnvironment(appPermissions, app.id, 'staging');
                break;
              case 'production':
                hasEnvironmentAccess = AbilityUtilService.canAccessAppInEnvironment(
                  appPermissions,
                  app.id,
                  'production'
                );
                break;
            }
          }

          // If user doesn't have access to this environment, reject with restricted-preview
          // Apply to all users (builders and viewers)
          if (!hasEnvironmentAccess) {
            throw new ForbiddenException('restricted-preview');
          }
        }
      }
      if (version) response['versionName'] = version.name;
      if (envId) response['environmentName'] = environment.name;
      response['versionId'] = version.id;
      response['environmentId'] = environment.id;
    }
    return plainToClass(ValidateAppAccessResponseDto, response);
  }

  validateReleasedApp(ability: AppAbility, app: App): { id: string; slug: string } {
    if (!app.currentVersionId) {
      const editPermission = ability.can(FEATURE_KEY.UPDATE, App, app.id);
      const errorResponse = {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        error: 'App is not released yet',
        message: { error: 'App is not released yet', editPermission },
      };
      throw new HttpException(errorResponse, HttpStatus.NOT_IMPLEMENTED);
    }

    return { id: app.id, slug: app.slug };
  }

  async getAppAuthenticationConfig(slug: string) {
    if (!slug || slug.length > 250) {
      throw new BadRequestException('Invalid app slug');
    }

    const app = await this.appRepository.findByIdOrSlug(slug);

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return {
      name: app.name,
      slug: app.slug,
      isPublic: app.isPublic,
      organizationId: app.organizationId,
    };
  }

  private resolveGitSyncEnabled(orgGit: OrganizationGitSync | null | undefined): boolean {
    if (!orgGit) return false;

    if (orgGit.useEnvConfig) {
      const providers = [GITConnectionType.GITHUB_SSH, GITConnectionType.GITHUB_HTTPS, GITConnectionType.GITLAB];
      return providers.some(
        (provider) => this.organizationEnvRegistryService.getProviderState(orgGit.organizationId, provider).isEnabled
      );
    }

    return Boolean(orgGit.gitSsh?.isEnabled || orgGit.gitHttps?.isEnabled || orgGit.gitLab?.isEnabled);
  }

  async update(app: App, appUpdateDto: AppUpdateDto, user: User) {
    const { id: userId, organizationId } = user;
    const { name, editingVersionId } = appUpdateDto;
    const orgGit = await this.organizationGitRepository.findOrgGitByOrganizationId(app.organizationId);
    const isGitSyncEnabled = this.resolveGitSyncEnabled(orgGit);

    // Block metadata edits on the default branch when git-sync is enabled. These fields
    // (name/slug/icon/is_public) must be edited from a feature branch — the change then
    // flows to the default branch via push + merge. Workflows are exempt because they
    // keep metadata on apps.* and don't participate in branching. For non-git-sync
    // workspaces no block applies; util.service.update writes to all VERSION rows.
    if (isGitSyncEnabled && app.type !== APP_TYPES.WORKFLOW) {
      const blockedFields: string[] = [];
      if (appUpdateDto.name !== undefined) blockedFields.push('name');
      if (appUpdateDto.slug !== undefined) blockedFields.push('slug');
      if (appUpdateDto.icon !== undefined) blockedFields.push('icon');
      if (appUpdateDto.is_public !== undefined) blockedFields.push('is_public');

      if (blockedFields.length > 0) {
        // Require an explicit branch_id (from the x-branch-id header). Without it the
        // server can't tell whether the request is targeting the default branch or a
        // sub-branch, and util.service.update would otherwise fan the write out across
        // every VERSION row of the app — leaking sub-branch edits into the default branch.
        if (!appUpdateDto.branch_id) {
          throw new BadRequestException(
            `Editing ${blockedFields.join(', ')} requires a feature branch context (missing x-branch-id header).`
          );
        }
        const branch = await this.appRepository.manager.findOne(WorkspaceBranch, {
          where: { id: appUpdateDto.branch_id, organizationId: app.organizationId },
          select: ['id', 'isDefault'],
        });
        // Unknown branch → treat as block. Default branch → block (must edit from a
        // feature branch and let push + merge flow the change to default).
        if (!branch || branch.isDefault) {
          throw new BadRequestException(
            `Editing ${blockedFields.join(', ')} isn't allowed on the default branch. Switch to a feature branch in app builder to update.`
          );
        }
      }
    }

    // Rename additionally requires a draft version when git-sync is on (so the new name
    // lands on an editable version, not a published one).
    if (name && name !== app.name && isGitSyncEnabled) {
      const draftVersion = await this.versionRepository.findOne({
        where: {
          appId: app.id,
          status: AppVersionStatus.DRAFT,
        },
      });
      if (!draftVersion) {
        throw new BadRequestException('Cannot rename app. Please create a draft version first to rename the app.');
      }
    }

    const result = await this.appsUtilService.update(app, appUpdateDto, organizationId);
    if (name && name != app.name) {
      const appRenameDto = {
        user: user,
        organizationId: organizationId,
        app: app,
        appUpdateDto: appUpdateDto,
        editingVersionId: editingVersionId,
      };
      await this.eventEmitter.emit('app-rename-commit', appRenameDto);
    }

    if (appUpdateDto.is_maintenance_on !== undefined && appUpdateDto.is_maintenance_on !== app.isMaintenanceOn) {
      this.eventEmitter.emit('app.maintenance-toggled', {
        appId: app.id,
        isMaintenanceOn: appUpdateDto.is_maintenance_on,
      });
    }

    //APP_UPDATE audit
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId,
      organizationId,
      resourceId: app.id,
      resourceName: app.name,
      resourceData: {
        appSlug: app.slug,
        isPublic: app.isPublic,
        updatedFields: Object.keys(appUpdateDto),
      },
      metadata: { updateParams: { app: appUpdateDto } },
    });

    const response = decamelizeKeys(result);
    return response;
  }

  async delete(app: App, user: User) {
    const { organizationId } = user;
    const { id } = app;

    await dbTransactionWrap(async (manager: EntityManager) => {
      const schedules = await manager
        .createQueryBuilder(WorkflowSchedule, 'workflowSchedule')
        .innerJoinAndSelect('workflowSchedule.workflow', 'appVersion')
        .where('appVersion.appId = :appId', { appId: id })
        .getMany();

      // Emit event with schedule IDs for temporal schedule cleanup
      if (schedules.length > 0) {
        const scheduleIds = schedules.map((schedule) => schedule.id);
        this.eventEmitter.emit('app.deleted', {
          appId: id,
          scheduleIds: scheduleIds,
        });
      }

      // Clean up query folder data — no CASCADE exists for these tables
      const versions = await manager.find(AppVersion, { select: ['id'], where: { appId: id } });
      const versionIds = versions.map((v) => v.id);
      if (versionIds.length > 0) {
        const folders = await manager.find(DataQueryFolder, { where: { appVersionId: In(versionIds) } });
        const folderIds = folders.map((f) => f.id);
        const queries = await manager.find(DataQuery, { select: ['id'], where: { appVersionId: In(versionIds) } });
        const queryIds = queries.map((q) => q.id);
        const allChildIds = [...folderIds, ...queryIds];

        if (allChildIds.length > 0) {
          await manager.delete(DataQueryFolderMapping, { childId: In(allChildIds) });
        }
        if (folderIds.length > 0) {
          await manager.delete(DataQueryFolder, { appVersionId: In(versionIds) });
        }
      }

      await manager.delete(App, { id, organizationId });
    });

    //APP_DELETE audit
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: app.id,
      resourceName: app.name,
      resourceData: {
        appSlug: app.slug,
        isPublic: app.isPublic,
      },
    });
  }

  async getAllApps(user: User, appListDto: AppListDto, isGetAll: boolean): Promise<any> {
    const { folderId, page, searchKey, type } = appListDto;
    // When no branchId is provided (e.g. end users) and the workspace has git-sync
    // configured, fall back to the default branch so only default-branch apps surface.
    // Non-git-sync workspaces have no orgGit; branchId stays undefined and the no-branch
    // overlay below picks any version row's metadata per app.
    const branchId = await this.resolveDashboardBranchId(user, type, appListDto.branchId);
    // if (!branchId && type === 'front-end') {
    //   const orgGit = await this.organizationGitRepository?.findOrgGitByOrganizationId(user.organizationId);
    //   if (orgGit) {
    //     const defaultBranch = await this.appRepository.manager.findOne(WorkspaceBranch, {
    //       where: { organizationId: user.organizationId, isDefault: true },
    //       select: ['id'],
    //     });
    //     branchId = defaultBranch?.id;
    //   }
    // }
    const pageNum = parseInt(page || '1');
    const manager = this.appRepository.manager;

    // AppsSubscriber.afterLoad would otherwise fire one AppVersion query per loaded App.
    // hydrateEditingVersionInBulk replaces those with a single IN-list query at the end.
    return skipAppEditingVersionHydration.run(true, async () => {
      const { apps, totalCount, folderCount } = await this.fetchDashboardApps(
        user,
        pageNum,
        searchKey,
        type,
        isGetAll,
        branchId,
        folderId,
        manager
      );

      // When a branch is in scope, the loaded `appVersions[0]` is the branch-specific
      // version. The branch row is the single source of truth for non-workflow metadata
      // — overlay all four fields unconditionally, including NULLs. Falling back to
      // apps.* would surface stale or unmigrated values and mask data issues on the
      // branch. Workflows keep metadata on apps.* and are skipped.
      if (branchId) {
        for (const app of apps) {
          if (app.type === APP_TYPES.WORKFLOW) continue;
          const branchVersion = app?.appVersions?.[0];
          if (!branchVersion) continue;
          app.name = branchVersion.appName;
          app.slug = branchVersion.slug;
          app.icon = branchVersion.icon;
          app.isPublic = branchVersion.isPublic;
        }
      } else {
        // No branch context: route by git-sync state.
        //   - Git enabled: pull per-app metadata from the default branch row.
        //   - Git off:     any version row works (every row carries identical metadata).
        const nonWorkflowAppIds = apps.filter((a) => a.type !== APP_TYPES.WORKFLOW).map((a) => a.id);
        if (nonWorkflowAppIds.length > 0) {
          const defaultBranch = await manager.findOne(WorkspaceBranch, {
            where: { organizationId: user.organizationId, isDefault: true },
            select: ['id'],
          });
          const qb = manager
            .createQueryBuilder()
            .select('DISTINCT ON (av.app_id) av.app_id', 'app_id')
            .addSelect('av.app_name', 'app_name')
            .addSelect('av.slug', 'slug')
            .addSelect('av.icon', 'icon')
            .addSelect('av.is_public', 'is_public')
            .from('app_versions', 'av')
            .where('av.app_id IN (:...appIds)', { appIds: nonWorkflowAppIds });
          if (defaultBranch?.id) {
            qb.andWhere('av.branch_id = :defaultBranchId', { defaultBranchId: defaultBranch.id });
          }
          const rows: {
            app_id: string;
            app_name: string | null;
            slug: string | null;
            icon: string | null;
            is_public: boolean | null;
          }[] = await qb.getRawMany();
          const metaByAppId = new Map(rows.map((r) => [r.app_id, r]));
          for (const app of apps) {
            if (app.type === APP_TYPES.WORKFLOW) continue;
            const meta = metaByAppId.get(app.id);
            if (!meta) continue;
            if (meta.app_name != null) app.name = meta.app_name;
            if (meta.slug != null) app.slug = meta.slug;
            if (meta.icon != null) app.icon = meta.icon;
            if (meta.is_public != null) app.isPublic = meta.is_public;
          }
        }
      }

      if (isGetAll) {
        await this.hydrateEditingVersionInBulk(apps, manager);
        return decamelizeKeys({ apps });
      }

      if (type === APP_TYPES.MODULE) {
        await this.attachModuleContainers(apps, user.organizationId, manager);
      }
      await this.attachFolderIds(apps, manager);
      await this.hydrateEditingVersionInBulk(apps, manager);

      const pageTotal = folderId ? folderCount : totalCount;
      return decamelizeKeys({
        meta: {
          total_pages: Math.ceil(pageTotal / APPS_PAGE_SIZE),
          total_count: totalCount,
          folder_count: folderCount,
          current_page: pageNum,
        },
        apps,
      });
    });
  }

  // End users with no branchId would otherwise see apps across every branch; default to the org's default branch.
  private async resolveDashboardBranchId(
    user: User,
    type: string,
    providedBranchId?: string
  ): Promise<string | undefined> {
    if (providedBranchId || type !== APP_TYPES.FRONT_END) return providedBranchId;
    const orgGit = await this.organizationGitRepository?.findOrgGitByOrganizationId(user.organizationId);
    if (!orgGit) return undefined;
    const defaultBranch = await this.appRepository.manager.findOne(WorkspaceBranch, {
      where: { organizationId: user.organizationId, isDefault: true },
      select: ['id'],
    });
    return defaultBranch?.id;
  }

  private async fetchDashboardApps(
    user: User,
    page: number,
    searchKey: string,
    type: string,
    isGetAll: boolean,
    branchId: string | undefined,
    folderId: string | undefined,
    manager: EntityManager
  ): Promise<{ apps: AppListItem[]; totalCount: number; folderCount: number }> {
    if (folderId) {
      const folder = await this.foldersUtilService.findOne(folderId, manager);
      // page=0 signals "return all" — used when isGetAll=true to skip pagination
      const pageArg = isGetAll ? 0 : page;
      const [{ viewableApps, totalCount: folderCount }, totalCount] = await Promise.all([
        this.folderAppsUtilService.getAppsFor(user, folder, pageArg, searchKey, type as APP_TYPES, branchId),
        this.appsUtilService.count(user, searchKey, type as APP_TYPES, branchId),
      ]);
      return { apps: viewableApps, totalCount, folderCount };
    }
    if (isGetAll) {
      const apps = await this.appsUtilService.all(user, page, searchKey, type, true, branchId);
      return { apps, totalCount: 0, folderCount: 0 };
    }
    const { apps, totalCount } = await this.appsUtilService.allWithCount(user, page, searchKey, type, branchId);
    return { apps, totalCount, folderCount: 0 };
  }

  private async attachModuleContainers(
    apps: AppListItem[],
    organizationId: string,
    manager: EntityManager
  ): Promise<void> {
    const versionIds = apps.map((app) => app.appVersions?.[0]?.id).filter((id): id is string => Boolean(id));
    const moduleContainerByVersion = await this.pageService.findModuleContainersForVersions(
      versionIds,
      organizationId,
      manager
    );
    for (const app of apps) {
      const versionId = app.appVersions?.[0]?.id;
      app.moduleContainer = versionId ? (moduleContainerByVersion.get(versionId) ?? null) : null;
    }
  }

  private async attachFolderIds(apps: AppListItem[], manager: EntityManager): Promise<void> {
    const appIds = apps.map((a) => a.id);
    if (appIds.length === 0) return;
    const folderApps = await manager
      .createQueryBuilder(FolderApp, 'folderApp')
      .where('folderApp.appId IN (:...appIds)', { appIds })
      .getMany();
    const folderIdsByApp = new Map<string, string[]>();
    for (const fa of folderApps) {
      const ids = folderIdsByApp.get(fa.appId) ?? [];
      ids.push(fa.folderId);
      folderIdsByApp.set(fa.appId, ids);
    }
    for (const app of apps) {
      app.folderIds = folderIdsByApp.get(app.id) ?? [];
    }
  }

  private async hydrateEditingVersionInBulk(apps: AppListItem[], manager: EntityManager): Promise<void> {
    if (apps.length === 0) return;
    const appIds = apps.map((a) => a.id).filter(Boolean);
    if (appIds.length === 0) return;

    // Whitelist — skip heavy JSONB (definition, globalSettings, pageSettings).
    const editingVersions = await manager
      .createQueryBuilder(AppVersion, 'av')
      .select([
        'av.id',
        'av.name',
        'av.appId',
        'av.branchId',
        'av.versionType',
        'av.isStub',
        'av.currentEnvironmentId',
        'av.homePageId',
        'av.moduleReferenceId',
        'av.co_relation_id',
        'av.createdAt',
        'av.updatedAt',
      ])
      .distinctOn(['av.appId'])
      .where('av.appId IN (:...appIds)', { appIds })
      .andWhere('av.versionType != :branch', { branch: AppVersionType.BRANCH })
      .andWhere('av.isStub = :isStub', { isStub: false })
      .orderBy('av.appId', 'ASC')
      .addOrderBy('av.updatedAt', 'DESC')
      .getMany();

    const editingByAppId = new Map(editingVersions.map((v) => [v.appId, v]));
    for (const app of apps) {
      const v = editingByAppId.get(app.id);
      app.editingVersion = v;
      app.isStub = !v;
    }
  }

  async findTooljetDbTables(appId: string): Promise<{ table_id: string }[]> {
    return await this.appsUtilService.findTooljetDbTables(appId); //moved to util
  }

  /**
   * Set `app.editingVersion` to the right row given the request's branch context.
   *
   * The subscriber leaves `editingVersion` undefined for git-enabled non-workflow
   * apps (branch context is required for a deterministic pick). This method
   * fills it in:
   *
   *   - Workflow or git-disabled: subscriber already picked the row — no-op.
   *   - Git-enabled, x-branch-id header present: load the BRANCH/VERSION row
   *     for that branch (DRAFT). On a sub-branch this is the BRANCH-type DRAFT;
   *     on the default branch this is the VERSION-type DRAFT.
   *   - Git-enabled, no header: fall back to the default-branch DRAFT.
   *   - Stub rows still resolve so the caller can decide how to react (the EE
   *     getOne triggers hydration; CE returns the row as-is).
   */
  private async resolveBranchAwareEditingVersion(app: App, branchId?: string): Promise<void> {
    if (app.editingVersion) return; // subscriber already set it (workflow / git-off)
    if (app.type === APP_TYPES.WORKFLOW) return;

    const defaultBranch = await this.appRepository.manager.findOne(WorkspaceBranch, {
      where: { organizationId: app.organizationId, isDefault: true },
      select: ['id'],
    });
    if (!defaultBranch) return; // git off — subscriber should have handled it

    const targetBranchId = branchId ?? defaultBranch.id;
    const version = await this.versionRepository.findOne({
      where: { appId: app.id, branchId: targetBranchId, isStub: false },
      relations: ['branch'],
      order: { updatedAt: 'DESC' },
    });
    if (version) {
      if (version.versionType === AppVersionType.BRANCH && version.branch?.name) {
        version.displayName = version.branch.name;
      }
      app.editingVersion = version;
      (app as any).isStub = false;
    } else {
      (app as any).isStub = true;
    }
  }

  async getOne(app: App, user: User, branchId?: string): Promise<any> {
    // The subscriber leaves editingVersion undefined for git-enabled non-workflow
    // apps — branch context is required for a deterministic pick. Resolve it
    // here from x-branch-id (or fall back to the default branch's DRAFT).
    // Workflows + git-disabled apps already have editingVersion set by the
    // subscriber.
    await this.resolveBranchAwareEditingVersion(app, branchId);

    // Non-workflow apps store name/slug/icon/isPublic on app_versions; project them
    // onto the in-memory App so the JSON response carries the correct values.
    await this.appsUtilService.overlayAppMetadata(app, branchId);
    const response = decamelizeKeys(app);

    const seralizedQueries = [];
    const dataQueriesForVersion = app.editingVersion
      ? await this.versionRepository.findDataQueriesForVersion(app.editingVersion.id)
      : [];

    const pagesForVersion = app.editingVersion ? await this.pageService.findPagesForVersion(app.editingVersion.id) : [];
    const eventsForVersion = app.editingVersion
      ? await this.eventService.findEventsForVersion(app.editingVersion.id)
      : [];

    // serialize queries
    for (const query of dataQueriesForVersion) {
      const decamelizedQuery = decamelizeKeys(query);
      decamelizedQuery['options'] = query.options;
      seralizedQueries.push(decamelizedQuery);
    }

    response['data_queries'] = seralizedQueries;
    response['definition'] = app.editingVersion?.definition;
    response['pages'] = this.appsUtilService.mergeDefaultComponentData(pagesForVersion);
    response['events'] = eventsForVersion;

    //! if editing version exists, camelize the definition
    if (app.editingVersion) {
      const appTheme = await this.organizationThemeUtilService.getTheme(
        user.organizationId,
        response['editing_version']['global_settings']?.['theme']?.['id']
      );
      // null global_settings on branch DRAFT/legacy versions — guard before theme assignment
      if (response['editing_version']['global_settings']) {
        response['editing_version']['global_settings']['theme'] = appTheme;
      } else {
        response['editing_version']['global_settings'] = { theme: appTheme };
      }

      if (app.editingVersion.definition) {
        response['editing_version'] = {
          ...response['editing_version'],
          definition: camelizeKeys(app.editingVersion.definition),
        };
      }
    }

    if (response['editing_version']) {
      const hasMultiEnvLicense = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.MULTI_ENVIRONMENT,
        app.organizationId
      );
      let shouldFreezeEditor = false;
      let appVersionEnvironment: AppEnvironment;
      if (hasMultiEnvLicense) {
        appVersionEnvironment = await this.appEnvironmentUtilService.get(
          user.organizationId,
          response['editing_version']['current_environment_id']
        );
        shouldFreezeEditor = appVersionEnvironment.priority > 1;
      } else {
        appVersionEnvironment = await this.appEnvironmentUtilService.getByPriority(user.organizationId);
        response['editing_version']['current_environment_id'] = appVersionEnvironment.id;
      }
      response['should_freeze_editor'] = shouldFreezeEditor;
      // Check if editing version is a draft
      const editingVersion = response['editing_version'];

      // Modules also freeze when the editing version is non-draft, regardless of git state
      if (app.type === APP_TYPES.MODULE && editingVersion?.status && editingVersion.status !== AppVersionStatus.DRAFT) {
        response['should_freeze_editor'] = true;
      }
      response['editorEnvironment'] = {
        id: appVersionEnvironment.id,
        name: appVersionEnvironment.name,
      };

      // Inject app theme
      const appTheme = await this.organizationThemeUtilService.getTheme(
        user.organizationId,
        response['editing_version']['global_settings']?.['theme']?.['id']
      );
      // null global_settings on branch DRAFT/legacy versions — guard before theme assignment
      if (response['editing_version']['global_settings']) {
        response['editing_version']['global_settings']['theme'] = appTheme;
      } else {
        response['editing_version']['global_settings'] = { theme: appTheme };
      }

      // Strip JS libraries from globalSettings when the org's license doesn't include
      // the feature — the FE loads whatever arrives here, so the gate lives on the BE.
      const hasJsLibrariesAccess = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.APP_JS_LIBRARIES,
        app.organizationId
      );
      if (!hasJsLibrariesAccess) {
        delete response['editing_version']['global_settings']['libraries'];
        delete response['editing_version']['global_settings']['preloadedScript'];
      }
    }
    return response;
  }

  async getBySlug(app: App, user: User): Promise<any> {
    const prepareResponse = async (app) => {
      // Unauthenticated access to a public app with no released version must not
      // fall through to the editing (draft) version — surface a 501 so the FE
      // redirects to url-unavailable instead of leaking draft content.
      if (!app.currentVersionId && !user) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_IMPLEMENTED,
            error: 'App is not released yet',
            message: { error: 'App is not released yet' },
          },
          HttpStatus.NOT_IMPLEMENTED
        );
      }

      // app.editingVersion is populated by AppSubscriber.afterLoad ONLY when
      // git sync is off (or when the entity is a workflow). For git-enabled
      // front-end / module apps the subscriber returns early without
      // populating it, so we need a hard fallback to currentVersionId. If
      // neither is available the app has no resolvable version and we can't
      // serve the slug — throw a clear 404 instead of crashing on a
      // findVersion(undefined) call further down.
      const versionId = app.currentVersionId ?? app.editingVersion?.id;
      if (!versionId) {
        throw new NotFoundException('No released or editing version found for this app');
      }
      const versionToLoad = await this.versionRepository.findVersion(versionId);

      const pagesForVersion = app.editingVersion ? await this.pageService.findPagesForVersion(versionToLoad.id) : [];
      const eventsForVersion = app.editingVersion ? await this.eventService.findEventsForVersion(versionToLoad.id) : [];
      const appTheme = await this.organizationThemeUtilService.getTheme(
        app.organizationId,
        versionToLoad?.globalSettings?.theme?.id
      );

      if (app?.isPublic && user) {
        RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
          userId: user.id,
          organizationId: user.organizationId,
          resourceId: app.id,
          resourceName: app.name,
          resourceType: MODULES.APP,
        });
      }

      // Strip JS libraries from globalSettings when the org's license doesn't include
      // the feature — the FE loads whatever arrives here, so the gate lives on the BE.
      const hasJsLibrariesAccess = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.APP_JS_LIBRARIES,
        app.organizationId
      );
      const globalSettings = { ...versionToLoad.globalSettings, theme: appTheme };
      if (!hasJsLibrariesAccess) {
        delete globalSettings.libraries;
        delete globalSettings.preloadedScript;
      }

      // serialize
      return {
        id: app.id,
        current_version_id: app['currentVersionId'],
        data_queries: versionToLoad?.dataQueries,
        definition: versionToLoad?.definition,
        is_public: app.isPublic,
        is_maintenance_on: app.isMaintenanceOn,
        name: app.name,
        slug: app.slug,
        events: eventsForVersion,
        pages: this.appsUtilService.mergeDefaultComponentData(pagesForVersion),
        homePageId: versionToLoad.homePageId,
        globalSettings,
        showViewerNavigation: versionToLoad.showViewerNavigation,
        pageSettings: versionToLoad?.pageSettings,
        appId: app.id,
        editing_version: {
          id: versionToLoad.id,
          name: versionToLoad.name,
        },
      };
    };

    const response = await prepareResponse(app);

    const modules = await this.appsUtilService.fetchModules(app, false, undefined);

    response['modules'] = await Promise.all(modules.map((module) => prepareResponse(module)));

    return response;
  }

  async release(app: App, user: User, versionReleaseDto: VersionReleaseDto) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const { versionToBeReleased } = versionReleaseDto;
      const { id: appId } = app;
      //check if the app version is eligible for release
      const currentEnvironment: AppEnvironment = await manager
        .createQueryBuilder(AppEnvironment, 'app_environments')
        .select([
          'app_environments.id',
          'app_environments.name',
          'app_environments.isDefault',
          'app_environments.priority',
        ])
        .innerJoinAndSelect('app_versions', 'app_versions', 'app_versions.current_environment_id = app_environments.id')
        .where('app_versions.id = :versionToBeReleased', {
          versionToBeReleased,
        })
        .getOne();

      const isMultiEnvironmentEnabled = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.MULTI_ENVIRONMENT,
        user.organizationId
      );
      /*
          Allow version release only if the environment is on
          production with a valid license or
          expired license and development environment (priority no.1) (CE rollback)
          */

      if (isMultiEnvironmentEnabled && !currentEnvironment?.isDefault) {
        throw new BadRequestException('You can only release when the version is promoted to production');
      }

      await this.appsUtilService.checkModulesReleasedInApp(versionToBeReleased, user.organizationId, manager);

      // Get version details for audit log
      const releasedVersion = await this.versionRepository.findVersion(versionToBeReleased);

      // Validate slug uniqueness against other released apps (non-workflow only)
      if (app.type !== 'workflow') {
        // Resolve canonical slug. Git-sync enabled (org has a default branch row in
        // organization_git_sync_branches): read the slug off the app_versions row tied
        // to that default branch — feature-branch rows can carry a different in-flight
        // slug and must not drive the uniqueness check. Otherwise pick any version row
        // (every row carries identical metadata when git-sync is off).
        const defaultBranch = await manager.findOne(WorkspaceBranch, {
          where: { organizationId: user.organizationId, isDefault: true },
          select: ['id'],
        });

        const slugVersion = defaultBranch
          ? await manager
              .createQueryBuilder(AppVersion, 'av')
              .where('av.app_id = :appId', { appId })
              .andWhere('av.branch_id = :branchId', { branchId: defaultBranch.id })
              .select('av.slug')
              .getOne()
          : await manager
              .createQueryBuilder(AppVersion, 'av')
              .where('av.app_id = :appId', { appId })
              .andWhere('av.slug IS NOT NULL')
              .select('av.slug')
              .getOne();

        if (slugVersion?.slug) {
          // Slug uniqueness is instance-wide, not scoped to an organization — drop
          // the organization filter. Git-sync on: pin to the default-branch DRAFT
          // VERSION row of each other released app; feature-branch / snapshot rows
          // may temporarily hold a colliding slug and must not block this release.
          // Git-sync off: any row of any other released app is canonical.
          const conflictingReleasedAppQb = manager
            .createQueryBuilder(AppVersion, 'av')
            .innerJoin('apps', 'a', 'a.id = av.app_id')
            .where('av.slug = :slug', { slug: slugVersion.slug })
            .andWhere('a.id != :appId', { appId })
            .andWhere('a.current_version_id IS NOT NULL');

          if (defaultBranch) {
            conflictingReleasedAppQb
              .andWhere('av.branch_id = :branchId', { branchId: defaultBranch.id })
              .andWhere('av.version_type = :versionType', { versionType: AppVersionType.VERSION })
              .andWhere('av.status = :status', { status: AppVersionStatus.DRAFT });
          }

          const conflictingReleasedApp = await conflictingReleasedAppQb.getOne();
          if (conflictingReleasedApp) {
            throw new BadRequestException('Cannot release — slug conflicts with another released app.');
          }
        }
      }

      await manager.update(App, appId, { currentVersionId: versionToBeReleased });

      //APP_RELEASE audit
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: app.id,
        resourceName: app.name,
        ...(app.type === 'module' && { actionType: MODULE_VERSION_AUDIT_KEYS.RELEASE }),
        resourceData: {
          appSlug: app.slug,
          isPublic: app.isPublic,
          releasedVersionId: versionToBeReleased,
          releasedVersionName: releasedVersion?.name,
          environmentId: currentEnvironment?.id,
          environmentName: currentEnvironment?.name,
        },
        metadata: { data: { name: 'App Released', versionToBeReleased: versionReleaseDto.versionToBeReleased } },
      });
      return;
    });
  }

  /**
   * Check if user has folder-level edit permission for the app.
   * This checks if the app belongs to any folder where the user has canEditApps permission.
   */
  protected async checkFolderEditPermission(appId: string, user: User): Promise<boolean> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Get folder permissions from the ability service
      const userPermissions = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: MODULES.FOLDER }],
        organizationId: user.organizationId,
      });

      const folderPermissions = userPermissions?.[MODULES.FOLDER];
      if (!folderPermissions) {
        return false;
      }

      // Get the folders this app belongs to
      const folderApps = await manager
        .createQueryBuilder(FolderApp, 'folder_apps')
        .where('folder_apps.app_id = :appId', { appId })
        .getMany();

      // Apps not in any folder should NOT get folder-level edit permission
      if (!folderApps || folderApps.length === 0) {
        return false;
      }

      // If user can edit apps in all folders AND app is in at least one folder, grant edit
      if (folderPermissions.isAllEditApps) {
        return true;
      }

      // Check if any of the app's folders are in the list of folders where user can edit apps
      const appFolderIds = folderApps.map((fa) => fa.folderId);
      const editableFolderIds = folderPermissions.editAppsInFoldersId || [];

      return appFolderIds.some((folderId) => editableFolderIds.includes(folderId));
    });
  }
}
