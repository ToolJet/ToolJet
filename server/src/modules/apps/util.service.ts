import { App } from '@entities/app.entity';
import { Page } from '@entities/page.entity';
import { User } from '@entities/user.entity';
import { dbTransactionWrap, getConnectionInstance } from '@helpers/database.helper';
import { skipAppEditingVersionHydration } from './subscribers/apps.subscriber';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { catchDbException, cleanObject } from '@helpers/utils.helper';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from '@entities/data_source.entity';
import { Brackets, EntityManager, MoreThan, Not, SelectQueryBuilder } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppsRepository } from './repository';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { VersionRepository } from '@modules/versions/repository';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { AppEnvironment } from '@entities/app_environments.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationRepository } from '@modules/organizations/repository';
import { USER_TYPE, WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { AppUpdateDto } from './dto';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { AppBase } from '@entities/app_base.entity';
import { MODULES } from '@modules/app/constants/modules';
import { componentTypes } from './services/widget-config';
import { cloneDeep, isArray, merge, mergeWith } from 'lodash';
import { UserAppsPermissions, UserWorkflowPermissions } from '@modules/ability/types';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { IAppsUtilService } from './interfaces/IUtilService';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { APP_TYPES, APPS_PAGE_SIZE } from './constants';
import { Component } from 'src/entities/component.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { Layout } from 'src/entities/layout.entity';
import { WorkspaceAppsResponseDto } from '@modules/external-apis/dto';
import { DataQuery } from '@entities/data_query.entity';
import { isUUID } from 'class-validator';
import { resolveAllModuleViewersForVersion, ResolvedModuleViewer } from '@modules/versions/module-ref.util';

// Permission resource that gates access to each app type. Workflows have their own
// permission resource; everything else (front-end apps, modules) shares the APP resource.
const PERMISSION_RESOURCE_BY_APP_TYPE: Record<string, MODULES> = {
  [APP_TYPES.WORKFLOW]: MODULES.WORKFLOWS,
  [APP_TYPES.FRONT_END]: MODULES.APP,
  [APP_TYPES.MODULE]: MODULES.APP,
};
const DEFAULT_PERMISSION_RESOURCE = MODULES.APP;

@Injectable()
export class AppsUtilService implements IAppsUtilService {
  constructor(
    protected readonly appRepository: AppsRepository,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly versionRepository: VersionRepository,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly abilityService: AbilityService
  ) {}
  async create(
    name: string,
    user: User,
    type: APP_TYPES,
    isInitialisedFromPrompt: boolean = false,
    manager: EntityManager,
    branchId?: string,
    icon?: string
  ): Promise<App> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const isWorkflow = type === APP_TYPES.WORKFLOW;

      // Non-workflows store the user-facing name on app_versions.app_name. apps.name
      // is NULL for them so the table-level APP_NAME_UNIQUE constraint doesn't fire.
      //
      // Git-sync ON  → cross-app uniqueness is enforced by the partial unique index
      //                app_versions_app_name_branch_id_unique on
      //                (app_name, branch_id, type) WHERE version_type='branch'.
      //                No app-side check needed; the DB will reject duplicates.
      //
      // Git-sync OFF → no default branch exists, so all new non-workflow rows have
      //                branch_id IS NULL → outside the partial index's WHERE. The
      //                DB has nothing to fall back on, so we run the check here
      //                against the same (name, type, organization) tuple the
      //                git-on index would enforce. Type-scoped so a front-end app
      //                "Foo" doesn't collide with a module "Foo" — apps and modules
      //                share the table but live in separate dashboards.
      if (!isWorkflow && name) {
        const defaultBranch = await manager.findOne(WorkspaceBranch, {
          where: { organizationId: user.organizationId, isDefault: true },
          select: ['id'],
        });
        if (!defaultBranch) {
          const conflictingNameVersion = await manager
            .createQueryBuilder(AppVersion, 'av')
            .innerJoin(App, 'app', 'app.id = av.appId')
            .where('av.app_name = :appName', { appName: name })
            .andWhere('av.branch_id IS NULL')
            .andWhere('av.version_type = :versionType', { versionType: AppVersionType.VERSION })
            .andWhere('app.organization_id = :organizationId', { organizationId: user.organizationId })
            .andWhere('app.type = :type', { type })
            .getOne();
          if (conflictingNameVersion) {
            throw new BadRequestException('This app name is already taken.');
          }
        } else if (branchId) {
          // Git-sync ON + targeting a specific branch — mirror the
          // enforce_app_versions_app_name_branch_unique trigger BEFORE the
          // INSERT so a name clash returns a clean BadRequest instead of a
          // mid-INSERT trigger abort (which poisons the surrounding TX).
          const conflictingBranchVersion = await manager
            .createQueryBuilder(AppVersion, 'av')
            .innerJoin(App, 'app', 'app.id = av.appId')
            .where('av.app_name = :appName', { appName: name })
            .andWhere('av.branch_id = :branchId', { branchId })
            .andWhere('av.version_type = :versionType', { versionType: AppVersionType.BRANCH })
            .andWhere('app.organization_id = :organizationId', { organizationId: user.organizationId })
            .andWhere('app.type = :type', { type })
            .getOne();
          if (conflictingBranchVersion) {
            throw new BadRequestException('This app name is already taken.');
          }
        }
      }

      const app = await catchDbException(() => {
        return manager.save(
          manager.create(App, {
            type,
            // Workflows still carry name/icon on apps.*; non-workflows store metadata
            // on app_versions and leave apps.* fields null/placeholder.
            name: isWorkflow ? name : null,
            ...(isWorkflow && icon !== undefined && { icon }),
            createdAt: new Date(),
            updatedAt: new Date(),
            organizationId: user.organizationId,
            userId: user.id,
            isMaintenanceOn: type === APP_TYPES.WORKFLOW ? true : false,
            ...(isInitialisedFromPrompt && {
              aiGenerationMetadata: {},
            }),
            isInitialisedFromPrompt: isInitialisedFromPrompt,
            ...(type === APP_TYPES.WORKFLOW && { workflowApiToken: uuidv4() }),
          })
        );
      }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'This app name is already taken.' }]);

      const firstPriorityEnv = await this.appEnvironmentUtilService.get(user.organizationId, null, true, manager);

      // Resolve workspace branch once — used for both version creation and co_relation_id.
      let workspaceBranch: WorkspaceBranch | null = null;
      if (branchId) {
        workspaceBranch = await manager.findOne(WorkspaceBranch, { where: { id: branchId } });
      }
      const isNonDefaultBranch = !!(branchId && workspaceBranch && !workspaceBranch.isDefault);

      if (isNonDefaultBranch) {
        // Non-default workspace branch: create ONLY the branch-specific version.
        // No base version (branch_id=NULL) should exist for sub-branch apps —
        // it would incorrectly appear in the default branch's version dropdown.
        // The default branch gets its version via git pull/hydration.
        const defaultSettings = {
          appInMaintenance: false,
          canvasMaxWidth: 100,
          canvasMaxWidthType: '%',
          canvasMaxHeight: 2400,
          canvasBackgroundColor: 'var(--cc-appBackground-surface)',
          backgroundFxQuery: '',
          appMode: 'light',
        };
        // Wrap so the partial unique indexes on app_versions surface friendly errors:
        //   - app_versions_app_name_branch_id_unique (app_name, branch_id, type)
        //     WHERE version_type='branch' — sub-branch name clash within same type.
        //   - app_versions_slug_branch_id_unique (slug, branch_id, type) WHERE same —
        //     sub-branch slug clash. Created with app.id as placeholder so it's
        //     unlikely but guard anyway in case a colliding row exists.
        const branchVersion = await catchDbException(
          async () =>
            await manager.save(
              AppVersion,
              manager.create(AppVersion, {
                name: type === APP_TYPES.WORKFLOW ? 'v1' : uuidv4(),
                appId: app.id,
                definition: {},
                currentEnvironmentId: firstPriorityEnv.id,
                status: AppVersionStatus.DRAFT,
                // Workflows don't participate in branching — keep them as VERSION.
                // Apps and modules on a feature branch must be BRANCH-type so the
                // editor recognises them as editable branch copies.
                versionType: type === APP_TYPES.WORKFLOW ? AppVersionType.VERSION : AppVersionType.BRANCH,
                branchId: branchId,
                showViewerNavigation: type === 'module' ? false : true,
                globalSettings: defaultSettings,
                pageSettings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                ...(type === APP_TYPES.MODULE && { moduleReferenceId: uuidv4() }),
                // Non-workflows carry slug/appName/icon/isPublic on app_versions.
                // slug defaults to app.id placeholder; user can rename later.
                ...(!isWorkflow && {
                  appName: name,
                  slug: app.id,
                  icon: icon ?? null,
                  isPublic: false,
                }),
              })
            ),
          [
            {
              dbConstraint: DataBaseConstraints.APP_VERSION_APP_NAME_BRANCH_UNIQUE,
              message: 'This app name is already taken.',
            },
            {
              dbConstraint: DataBaseConstraints.APP_VERSION_SLUG_BRANCH_UNIQUE,
              message: 'This slug is already taken.',
            },
          ]
        );

        const branchHomePage = await manager.save(
          manager.create(Page, {
            name: 'Home',
            handle: 'home',
            appVersionId: branchVersion.id,
            index: 1,
            disabled: false,
            hidden: false,
            autoComputeLayout: true,
            appId: app.id,
          })
        );

        if (type === 'module') {
          const moduleContainer = await manager.save(
            manager.create(Component, {
              name: 'ModuleContainer',
              type: 'ModuleContainer',
              pageId: branchHomePage.id,
              properties: {
                inputItems: { value: [] },
                outputItems: { value: [] },
                visibility: { value: '{{true}}' },
              },
              general: {},
              styles: { backgroundColor: { value: '#fff' } },
              generalStyles: {},
              displayPreferences: {
                showOnDesktop: { value: '{{true}}' },
                showOnMobile: { value: '{{true}}' },
              },
              validation: {},
            })
          );
          await manager.save(
            manager.create(Layout, {
              component: moduleContainer,
              type: 'desktop',
              top: 50,
              left: 6,
              height: 400,
              width: 38,
            })
          );
          await manager.save(
            manager.create(Layout, {
              component: moduleContainer,
              type: 'mobile',
              top: 50,
              left: 6,
              height: 400,
              width: 38,
            })
          );
        }

        branchVersion.homePageId = branchHomePage.id;
        await manager.save(branchVersion);
      } else {
        // Default branch or no git sync: standard creation flow.
        // Base version gets 'v1' — user-visible, renameable via version manager.
        // For non-workflows, seed the version's metadata so app_versions stays in sync
        // with the user-facing name/slug/icon/isPublic from the moment the app is created.
        //
        // Wrap so the partial unique index app_versions_slug_default_branch_unique
        // (slug, type WHERE status='DRAFT' AND branch_id IS NOT NULL AND
        // version_type='version') surfaces a friendly error if the slug placeholder
        // collides — that index governs default-branch DRAFT rows instance-wide.
        const appVersion = await catchDbException(
          async () =>
            await this.versionRepository.createOne(
              'v1',
              app.id,
              firstPriorityEnv.id,
              null,
              manager,
              undefined,
              !isWorkflow
                ? {
                    appName: name,
                    slug: app.id,
                    icon: icon ?? null,
                    isPublic: false,
                  }
                : undefined
            ),
          [
            {
              dbConstraint: DataBaseConstraints.APP_VERSION_SLUG_DEFAULT_BRANCH_UNIQUE,
              message: 'This slug is already taken.',
            },
          ]
        );

        const defaultHomePage = await manager.save(
          manager.create(Page, {
            name: 'Home',
            handle: 'home',
            appVersionId: appVersion.id,
            index: 1,
            disabled: false,
            hidden: false,
            autoComputeLayout: true,
            appId: app.id,
          })
        );

        if (type === 'module') {
          const moduleContainer = await manager.save(
            manager.create(Component, {
              name: 'ModuleContainer',
              type: 'ModuleContainer',
              pageId: defaultHomePage.id,
              properties: {
                inputItems: { value: [] },
                outputItems: { value: [] },
                visibility: { value: '{{true}}' },
              },
              general: {},
              styles: { backgroundColor: { value: '#fff' } },
              generalStyles: {},
              displayPreferences: {
                showOnDesktop: { value: '{{true}}' },
                showOnMobile: { value: '{{true}}' },
              },
              validation: {},
            })
          );
          await manager.save(
            manager.create(Layout, {
              component: moduleContainer,
              type: 'desktop',
              top: 50,
              left: 6,
              height: 400,
              width: 38,
            })
          );
          await manager.save(
            manager.create(Layout, {
              component: moduleContainer,
              type: 'mobile',
              top: 50,
              left: 6,
              height: 400,
              width: 38,
            })
          );
        }

        // Non-workflows carry slug/appName/icon/isPublic on app_versions.
        // slug defaults to app.id placeholder; user can rename later.
        if (!isWorkflow) {
          appVersion.appName = name;
          appVersion.slug = app.id;
          appVersion.icon = icon ?? null;
          appVersion.isPublic = false;
        }
        appVersion.showViewerNavigation = type === 'module' ? false : true;
        appVersion.homePageId = defaultHomePage.id;
        appVersion.globalSettings = {
          appInMaintenance: false,
          canvasMaxWidth: 100,
          canvasMaxWidthType: '%',
          canvasMaxHeight: 2400,
          canvasBackgroundColor: 'var(--cc-appBackground-surface)',
          backgroundFxQuery: '',
          appMode: 'light',
        };
        await manager.save(appVersion);
      }

      // Set co_relation_id for git sync workspaces — always a fresh UUID, never app.id.
      // Modules always get co_relation_id regardless of workspace type:
      // ModuleViewer components reference modules by co_relation_id for stable cross-env resolution.
      if (branchId || type === APP_TYPES.MODULE) {
        const coRelationId = uuidv4();
        await manager.update(App, { id: app.id }, { co_relation_id: coRelationId });
        app.co_relation_id = coRelationId;
      }

      return app;
    }, manager);
  }

  async findAppWithIdOrSlug(slug: string, organizationId: string, branchId?: string): Promise<App> {
    let app: App;

    if (isUUID(slug)) {
      app = await this.appRepository.findById(slug, organizationId);
      if (!app) {
        /* UUID could also be a slug, try slug lookup as fallback */
        app = await this.appRepository.findBySlug(slug, organizationId);
      }
    } else {
      app = await this.appRepository.findBySlug(slug, organizationId);
    }

    if (!app) {
      throw new NotFoundException('App not found. Invalid app id');
    }
    return app;
  }

  async validateVersionEnvironment(
    environmentName: string,
    environmentId: string,
    currentEnvIdOfVersion: string,
    organizationId: string
  ): Promise<AppEnvironment> {
    const isMultiEnvironmentEnabled = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.MULTI_ENVIRONMENT,
      organizationId
    );
    const isDevelopmentEnv = environmentName?.toLowerCase() === 'development';
    if (environmentName && !isDevelopmentEnv && !isMultiEnvironmentEnabled) {
      throw new ForbiddenException('URL is not accessible. Multi-environment is not enabled');
    }

    const processEnvironmentName = environmentName
      ? environmentName
      : !isMultiEnvironmentEnabled
        ? 'development'
        : null;

    const environment: AppEnvironment = environmentId
      ? await this.appEnvironmentUtilService.get(organizationId, environmentId)
      : await this.appEnvironmentUtilService.getEnvironmentByName(processEnvironmentName, organizationId);
    if (!environment) {
      throw new NotFoundException("Couldn't found environment in the organization");
    }

    const currentEnvOfVersion: AppEnvironment = await this.appEnvironmentUtilService.get(
      organizationId,
      currentEnvIdOfVersion
    );
    if (environment.priority <= currentEnvOfVersion.priority) {
      return environment;
    } else {
      throw new NotAcceptableException('Version is not promoted to the environment yet.');
    }
  }

  getAppOrganizationDetails(app: App): Promise<Organization> {
    return this.organizationRepository.findOneOrFail({
      select: ['id', 'slug'],
      where: { id: app.organizationId, status: WORKSPACE_STATUS.ACTIVE },
    });
  }

  async update(app: App, appUpdateDto: AppUpdateDto, organizationId: string, manager?: EntityManager) {
    const currentVersionId = appUpdateDto.current_version_id;
    const isPublic = appUpdateDto.is_public;
    const isMaintenanceOn = appUpdateDto.is_maintenance_on;
    const appBuilderMode = appUpdateDto.app_builder_mode;
    const { name, slug, icon } = appUpdateDto;
    const branchId = appUpdateDto.branch_id;
    const { id: appId, currentVersionId: lastReleasedVersion } = app;

    const isWorkflow = app.type === 'workflow';

    // Version-level fields (for non-workflows, written to app_versions)
    const versionParams: Record<string, any> = {};
    if (!isWorkflow) {
      if (slug !== undefined) versionParams.slug = slug;
      if (name !== undefined) versionParams.appName = name;
      if (icon !== undefined) versionParams.icon = icon;
      if (isPublic !== undefined) versionParams.isPublic = isPublic;
    }

    // App-level fields (always written to apps table)
    const appParams: Record<string, any> = {
      isMaintenanceOn,
      currentVersionId,
      appBuilderMode,
    };
    // For workflows, all fields stay on apps table
    if (isWorkflow) {
      appParams.name = name;
      appParams.slug = slug;
      appParams.isPublic = isPublic;
      appParams.icon = icon;
    }

    cleanObject(appParams);
    cleanObject(versionParams);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (appParams.currentVersionId) {
        //check if the app version is eligible for release
        const currentEnvironment: AppEnvironment = await this.getEnvironmentOfVersion(currentVersionId, manager);

        const isMultiEnvironmentEnabled = await this.licenseTermsService.getLicenseTerms(
          LICENSE_FIELD.MULTI_ENVIRONMENT,
          organizationId
        );

        /*
        Allow version release only if the environment is on
        production with a valid license or
        expired license and development environment (priority no.1) (CE rollback)
        */

        if (isMultiEnvironmentEnabled && !currentEnvironment?.isDefault) {
          throw new BadRequestException('You can only release when the version is promoted to production');
        }

        let promotedFromQuery: string;
        if (!isMultiEnvironmentEnabled) {
          if (!currentEnvironment.isDefault) {
            /* For basic plan users, Promote to the production environment first then release it */
            const productionEnv = await this.appEnvironmentUtilService.get(organizationId, null, false, manager);
            await manager.update(AppVersion, currentVersionId, {
              currentEnvironmentId: productionEnv.id,
              promotedFrom: currentEnvironment.id,
            });
          }

          /* demote the last released environment back to the promoted_from (if not null) */
          if (lastReleasedVersion) {
            promotedFromQuery = `
            UPDATE app_versions
            SET current_environment_id = promoted_from
            WHERE promoted_from IS NOT NULL
            AND id = $1;`;
          }
        } else {
          if (lastReleasedVersion) {
            promotedFromQuery = `
            UPDATE app_versions
            SET promoted_from = NULL
            WHERE promoted_from IS NOT NULL
            AND id = $1;`;
          }
        }

        if (promotedFromQuery) {
          await manager.query(promotedFromQuery, [lastReleasedVersion]);
        }
      }

      // Slug conflict check — query app_versions for non-workflows.
      // Mirrors findAppBySlug resolution: a slug is taken iff it would
      // resolve to a different app via either (a) a default-branch row
      // anywhere on the instance, or (b) a branchless row in a workspace
      // that has no default branch (git-sync off for that org). Sub-branch
      // rows aren't slug-addressable until they merge to the default branch,
      // so they're intentionally excluded here.
      if (versionParams.slug && !isWorkflow) {
        // Same-branch collision (git-sync sub-branch path only). Without a
        // branchId we skip this — a non-git-sync update has no branch scope
        // and would otherwise scan unaddressable sub-branch rows on other
        // workspaces. The two addressable-slug checks below cover non-git.
        if (branchId) {
          const conflictingVersion = await manager.findOne(AppVersion, {
            where: {
              slug: versionParams.slug,
              branchId,
              appId: Not(appId),
            },
          });
          if (conflictingVersion) {
            throw new BadRequestException('This slug is already taken on this branch.');
          }
        }

        // Instance-wide default-branch slug uniqueness, scoped by apps.type.
        // Mirrors trg_app_versions_default_branch_slug_unique (migration
        // 1779400000000) so the same case-insensitive collision is rejected
        // here with a user-facing message instead of bubbling up as a trigger
        // exception from manager.update further down. Joining
        // organization_git_sync_branches with is_default=true makes the check
        // span every workspace's default branch on this instance, which is the
        // multi-workspace collision case (e.g. two workspaces pulled the same
        // git repo and now have the same slug on their default branches).
        const defaultBranchSlugCollision = await manager
          .createQueryBuilder(AppVersion, 'av')
          .innerJoin(App, 'a', 'a.id = av.app_id')
          .innerJoin('organization_git_sync_branches', 'wb', 'wb.id = av.branch_id AND wb.is_default = true')
          .where('LOWER(av.slug) = LOWER(:slug)', { slug: versionParams.slug })
          .andWhere('a.type = :appType', { appType: app.type })
          .andWhere('av.app_id <> :appId', { appId })
          .select('av.id')
          .limit(1)
          .getOne();
        if (defaultBranchSlugCollision) {
          throw new BadRequestException('This slug is already taken.');
        }

        // Branchless-row uniqueness for workspaces with no default branch
        // (git-sync off). Those branchless rows are the canonical slug
        // holders for their orgs — findAppBySlug's step-2 fallback resolves
        // to them — so the incoming slug must not collide with one,
        // regardless of which workspace is writing. Restricted to rows
        // whose owning org has no default branch so we don't flag stale
        // branchless rows in orgs that have since enabled git-sync (their
        // canonical row is already covered by the default-branch check
        // above).
        const branchlessSlugCollision = await manager
          .createQueryBuilder(AppVersion, 'av')
          .innerJoin(App, 'a', 'a.id = av.app_id')
          .where('LOWER(av.slug) = LOWER(:slug)', { slug: versionParams.slug })
          .andWhere('av.branch_id IS NULL')
          .andWhere('a.type = :appType', { appType: app.type })
          .andWhere('av.app_id <> :appId', { appId })
          .andWhere(
            'NOT EXISTS (SELECT 1 FROM organization_git_sync_branches wb2 ' +
              'WHERE wb2.organization_id = a.organization_id AND wb2.is_default = true)'
          )
          .select('av.id')
          .limit(1)
          .getOne();
        if (branchlessSlugCollision) {
          throw new BadRequestException('This slug is already taken.');
        }
      } else if (isWorkflow && appParams.slug) {
        const conflictingApp = await manager.findOne(App, {
          where: { slug: appParams.slug, organizationId, id: Not(appId) },
        });
        if (conflictingApp) {
          await manager.update(App, conflictingApp.id, { slug: conflictingApp.id });
        }
      }

      // Cross-app app_name uniqueness on rename.
      //
      // Git-sync ON  → the partial unique index app_versions_app_name_branch_id_unique
      //                on (app_name, branch_id, type) WHERE version_type='branch'
      //                rejects collisions at the DB. No app-side check needed.
      // Git-sync OFF → branch_id IS NULL rows fall outside the partial index, so we
      //                check here. Filter by app.type so apps and modules can share
      //                names (separate dashboards, separate slug namespaces).
      if (versionParams.appName && !isWorkflow && !branchId) {
        const defaultBranch = await manager.findOne(WorkspaceBranch, {
          where: { organizationId, isDefault: true },
          select: ['id'],
        });
        if (!defaultBranch) {
          const conflictingNameVersion = await manager
            .createQueryBuilder(AppVersion, 'av')
            .innerJoin(App, 'app', 'app.id = av.appId')
            .where('av.app_name = :appName', { appName: versionParams.appName })
            .andWhere('av.branch_id IS NULL')
            .andWhere('av.version_type = :versionType', { versionType: AppVersionType.VERSION })
            .andWhere('av.app_id != :appId', { appId })
            .andWhere('app.organization_id = :organizationId', { organizationId })
            .andWhere('app.type = :type', { type: app.type })
            .getOne();
          if (conflictingNameVersion) {
            throw new ConflictException('This app name is already taken.');
          }
        }
      }

      // Write version-level fields to app_versions for non-workflows. Route by git-sync
      // state (default branch row in workspace_branches), not just by whether branchId is
      // supplied — the no-branchId case in a git-enabled workspace should still go through
      // the branch-aware path rather than fanning the write out across NULL branch rows.
      if (Object.keys(versionParams).length > 0 && !isWorkflow) {
        const defaultBranch = await manager.findOne(WorkspaceBranch, {
          where: { organizationId, isDefault: true },
          select: ['id'],
        });
        const isGitEnabled = !!defaultBranch;

        if (isGitEnabled) {
          // Git-sync workspace. Sub-branch metadata edits go to the single BRANCH-type row
          // for the branch supplied by the caller. (Default-branch edits are already
          // blocked upstream in apps/service.ts:update — branchId is always a sub-branch
          // here.)
          if (!branchId) {
            throw new BadRequestException('Branch context is required to update metadata on a git-enabled workspace.');
          }
          const canonicalCondition: Record<string, any> = {
            appId,
            versionType: AppVersionType.BRANCH,
            branchId,
          };
          await catchDbException(async () => {
            await manager.update(AppVersion, canonicalCondition, versionParams);
          }, [
            {
              dbConstraint: DataBaseConstraints.APP_VERSION_APP_NAME_BRANCH_UNIQUE,
              message: 'This app name is already taken.',
            },
            {
              dbConstraint: DataBaseConstraints.APP_VERSION_SLUG_BRANCH_UNIQUE,
              message: 'This slug is already taken.',
            },
            // Reaches here when an update touches a default-branch DRAFT VERSION-type
            // row (e.g. promote/release pathways) and the slug clashes instance-wide.
            {
              dbConstraint: DataBaseConstraints.APP_VERSION_SLUG_DEFAULT_BRANCH_UNIQUE,
              message: 'This slug is already taken.',
            },
          ]);
        } else {
          // Non-git-sync flow: all version rows of this app share the same metadata.
          // Update every app_versions row for this app — no version_type or
          // branch_id filter — so slug/name/icon/is_public stay in sync across
          // VERSION rows, BRANCH rows, and any stale non-null branch_id rows
          // left behind by a previous git-sync session. findAppBySlug's
          // branchless fallback resolves by app_id without caring which row
          // back-ed the slug, so keeping all rows consistent is the safest
          // invariant when git is off.
          await manager.update(AppVersion, { appId }, versionParams);
        }
      }

      // Write app-level fields to apps table
      if (Object.keys(appParams).length > 0) {
        return await catchDbException(async () => {
          return await manager.update(App, appId, appParams);
        }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'This app name is already taken.' }]);
      }
    }, manager);
  }

  async updateWorflowVersion(version: AppVersion, body: AppVersionUpdateDto, app: App) {
    const { currentEnvironmentId, definition } = body;
    const { currentVersionId, organizationId } = app;
    let currentEnvironment: AppEnvironment;

    // Allow updates to non-released versions
    // Note: status and name updates are already handled by versionsUtilService.updateVersion
    // This function only handles workflow-specific fields: currentEnvironmentId and definition
    if (version.id === currentVersionId && !body?.is_user_switched_version && (currentEnvironmentId || definition))
      throw new BadRequestException('You cannot update a released version');

    if (currentEnvironmentId || definition) {
      currentEnvironment = await AppEnvironment.findOne({
        where: { id: version.currentEnvironmentId },
      });
    }

    const editableParams = {};

    //check if the user is trying to promote the environment & raise an error if the currentEnvironmentId is not correct
    if (currentEnvironmentId) {
      if (!(await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT, organizationId))) {
        throw new BadRequestException('You do not have permissions to perform this action');
      }

      if (version.currentEnvironmentId !== currentEnvironmentId) {
        throw new NotAcceptableException();
      }
      const nextEnvironment = await AppEnvironment.findOne({
        select: ['id'],
        where: {
          priority: MoreThan(currentEnvironment.priority),
          organizationId,
        },
        order: { priority: 'ASC' },
      });
      editableParams['currentEnvironmentId'] = nextEnvironment.id;
    }

    if (definition) {
      const environments = await AppEnvironment.count({
        where: {
          organizationId,
        },
      });
      if (environments > 1 && currentEnvironment.priority !== 1 && !body?.is_user_switched_version) {
        throw new BadRequestException('You cannot update a promoted version');
      }
      editableParams['definition'] = definition;
    }

    editableParams['updatedAt'] = new Date();

    return await this.versionRepository.update(version.id, editableParams);
  }

  protected async getEnvironmentOfVersion(versionId: string, manager: EntityManager): Promise<AppEnvironment> {
    return manager
      .createQueryBuilder(AppEnvironment, 'app_environments')
      .innerJoinAndSelect('app_versions', 'app_versions', 'app_versions.current_environment_id = app_environments.id')
      .where('app_versions.id = :versionId', {
        versionId,
      })
      .getOne();
  }

  async all(
    user: User,
    page: number,
    searchKey: string,
    type: string,
    isGetAll: boolean,
    branchId?: string
  ): Promise<AppBase[]> {
    const qb = await this.buildViewableAppsQuery(user, type, searchKey, isGetAll, branchId, this.appRepository.manager);
    if (isGetAll) return qb.getMany();
    return qb
      .take(APPS_PAGE_SIZE)
      .skip(APPS_PAGE_SIZE * (page - 1))
      .getMany();
  }

  async allWithCount(
    user: User,
    page: number,
    searchKey: string,
    type: string,
    branchId?: string
  ): Promise<{ apps: AppBase[]; totalCount: number }> {
    const qb = await this.buildViewableAppsQuery(user, type, searchKey, false, branchId, this.appRepository.manager);
    const [apps, totalCount] = await qb
      .take(APPS_PAGE_SIZE)
      .skip(APPS_PAGE_SIZE * (page - 1))
      .getManyAndCount();
    return { apps, totalCount };
  }

  private async buildViewableAppsQuery(
    user: User,
    type: string,
    searchKey: string,
    isGetAll: boolean,
    branchId: string | undefined,
    manager: EntityManager
  ) {
    const resourceType = PERMISSION_RESOURCE_BY_APP_TYPE[type] ?? DEFAULT_PERMISSION_RESOURCE;
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: resourceType }, { resource: MODULES.FOLDER }],
      organizationId: user.organizationId,
    });
    // INNER JOIN enforces branch scope; skip EE NOT EXISTS predicate (~600x subplan cost)
    const willInnerJoinOnBranch =
      !!branchId &&
      (type === APP_TYPES.MODULE || type === APP_TYPES.FRONT_END);
    const qb = this.viewableAppsQueryUsingPermissions(
      user,
      userPermission[resourceType],
      manager,
      searchKey,
      isGetAll ? ['id', 'slug', 'name', 'currentVersionId'] : undefined,
      type,
      branchId,
      willInnerJoinOnBranch
    );
    this.applyAppVersionsJoin(qb, type, branchId, isGetAll);
    return qb;
  }

  // Stub versions retained — net-new branch modules have only a stub.
  // UUID-name-leak handled by inner `versions`-aliased join in viewableAppsQueryUsingPermissions.
  private applyAppVersionsJoin(
    qb: SelectQueryBuilder<AppBase>,
    type: string,
    branchId: string | undefined,
    isGetAll: boolean
  ): void {
    const branchPick = `appVersions.branchId = :branchId AND appVersions.id = (
      SELECT av_pick.id FROM app_versions av_pick
      WHERE av_pick.app_id = apps.id AND av_pick.branch_id = :branchId
      ORDER BY av_pick.is_stub ASC, av_pick.updated_at DESC
      LIMIT 1
    )`;
    if (type === APP_TYPES.MODULE) {
      if (branchId) {
        qb.innerJoinAndSelect('apps.appVersions', 'appVersions', branchPick, { branchId });
      } else {
        qb.leftJoinAndSelect('apps.appVersions', 'appVersions');
      }
    } else if (branchId && type === APP_TYPES.FRONT_END) {
      qb.innerJoinAndSelect('apps.appVersions', 'appVersions', branchPick, { branchId });
    }
  }

  protected viewableAppsQueryUsingPermissions(
    user: User,
    userAppPermissions: UserAppsPermissions | UserWorkflowPermissions,
    manager: EntityManager,
    searchKey?: string,
    select?: Array<string>,
    type?: string,
    branchId?: string,
    // consumed by the EE override (which applies addBranchFilter); unused in CE base
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _skipBranchScope?: boolean
  ): SelectQueryBuilder<AppBase> {
    const viewableAppsQb = manager
      .createQueryBuilder(AppBase, 'apps')
      .innerJoin('apps.user', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .where('apps.organizationId = :organizationId', { organizationId: user.organizationId });

    if (type === APP_TYPES.MODULE) {
      // Exclude stub versions: same rationale as the outer `all()` query — stubs
      // carry UUID names that must not be surfaced as selectable module versions.
      viewableAppsQb.leftJoinAndSelect('apps.appVersions', 'versions', 'versions.isStub = false');
    }

    if (type) {
      viewableAppsQb.andWhere('apps.type = :type', { type });
    }

    if (searchKey) {
      viewableAppsQb.andWhere(
        `(EXISTS (SELECT 1 FROM app_versions av_s WHERE av_s.app_id = apps.id AND LOWER(av_s.app_name) LIKE :searchKey) OR (apps.type = :workflowType AND LOWER(apps.name) LIKE :searchKey))`,
        {
          searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
          workflowType: APP_TYPES.WORKFLOW,
        }
      );
    }

    if (select) {
      viewableAppsQb.select(select.map((col) => `apps.${col}`));
    }

    // Listing order:
    //   1. Non-stub rows first (is_stub ASC — false < true in Postgres). Stubs are
    //      pull-tier placeholders awaiting hydrate; they shouldn't outrank
    //      fully-loaded apps in the dashboard.
    //   2. Last-edited first, branch-aware:
    //      - branchId + non-workflow → appVersions.updatedAt (per-branch edit
    //        timestamp). The alias comes from applyAppVersionsJoin.
    //      - branchId absent / workflows → apps.updatedAt (bumped by the AppVersion
    //        afterUpdate subscriber + the child-write triggers). Stubs only exist
    //        in git-enabled workspaces, where the dashboard always supplies a
    //        branchId (header or default-branch fallback), so this case has no
    //        stubs to worry about.
    //   3. apps.createdAt — deterministic tiebreaker.
    //
    // TypeORM accepts `appVersions.<col>` only because `appVersions` is a real
    // entity-mapped join. Derived tables / subquery aliases break the pagination
    // wrapper, so we keep this in plain entity terms.
    // Only reference the `appVersions` alias when the caller signals it will add
    // the INNER JOIN via applyAppVersionsJoin (_skipBranchScope=true). Without
    // that join, ordering by appVersions columns triggers PostgreSQL error 42P01
    // ("missing FROM-clause entry for table appversions").
    if (branchId && type !== APP_TYPES.WORKFLOW && _skipBranchScope) {
      viewableAppsQb
        .orderBy('appVersions.isStub', 'ASC')
        .addOrderBy('appVersions.updatedAt', 'DESC')
        .addOrderBy('apps.createdAt', 'DESC');
    } else {
      viewableAppsQb.orderBy('apps.updatedAt', 'DESC').addOrderBy('apps.createdAt', 'DESC');
    }

    if (this.isSuperAdmin(user)) {
      return viewableAppsQb;
    }

    const viewableApps = this.calculateViewableFrontEndApps(userAppPermissions as unknown as UserAppsPermissions);

    switch (type) {
      case APP_TYPES.MODULE:
        return viewableAppsQb;
      case APP_TYPES.FRONT_END:
      default:
        return this.addViewableFrontEndAppsFilter(
          viewableAppsQb,
          userAppPermissions as unknown as UserAppsPermissions,
          viewableApps
        );
    }
  }

  private calculateViewableFrontEndApps(userAppPermissions: UserAppsPermissions): string[] {
    const hiddenNonEditable = userAppPermissions.hiddenAppsId.filter(
      (id) => !userAppPermissions.editableAppsId.includes(id)
    );

    const explicitVisibleApps = Array.from(
      new Set([...userAppPermissions.editableAppsId, ...userAppPermissions.viewableAppsId])
    );

    // hideAll => strict allow-list mode (explicit grants only)
    if (userAppPermissions.hideAll) {
      return [null, ...explicitVisibleApps];
    }

    // normal mode => editable always visible, viewable minus hidden (non-editable)
    return [
      null,
      ...Array.from(
        new Set([
          ...userAppPermissions.editableAppsId,
          ...userAppPermissions.viewableAppsId.filter((id) => !hiddenNonEditable.includes(id)),
        ])
      ),
    ];
  }

  private addViewableFrontEndAppsFilter(
    query: SelectQueryBuilder<AppBase>,
    userAppPermissions: UserAppsPermissions,
    viewableApps: string[]
  ): SelectQueryBuilder<AppBase> {
    const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;
    const { hiddenAppsId } = userAppPermissions;

    if (isAllEditable) {
      // Builder with "all apps editable" — still respect hideFromDashboard settings.
      if (hideAll) {
        // All apps hidden from dashboard; none should appear.
        query.andWhere('1 = 0');
      } else if (hiddenAppsId.length > 0) {
        query.andWhere('apps.id NOT IN (:...hiddenApps)', { hiddenApps: hiddenAppsId });
      }
      return query;
    }

    if ((isAllViewable && hideAll) || (!isAllViewable && !hideAll) || (!isAllViewable && hideAll)) {
      query.andWhere('apps.id IN (:...viewableApps)', {
        viewableApps,
      });
      return query;
    }

    const hiddenApps = hiddenAppsId.filter((id) => !userAppPermissions.editableAppsId.includes(id));
    if (!hideAll && isAllViewable && hiddenApps.length > 0) {
      query.andWhere('apps.id NOT IN (:...hiddenApps)', {
        hiddenApps,
      });
    }

    return query;
  }

  protected isSuperAdmin(user: User) {
    return !!(user?.userType === USER_TYPE.INSTANCE);
  }

  async count(user: User, searchKey, type: APP_TYPES, branchId?: string): Promise<number> {
    const resourceType = PERMISSION_RESOURCE_BY_APP_TYPE[type] ?? DEFAULT_PERMISSION_RESOURCE;
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: resourceType }],
      organizationId: user.organizationId,
    });
    return this.viewableAppsQueryUsingPermissions(
      user,
      userPermission[resourceType],
      this.appRepository.manager,
      searchKey,
      undefined,
      type,
      branchId
    ).getCount();
  }

  mergeDefaultComponentData(pages) {
    return pages.map((page) => ({
      ...page,
      components: this.buildComponentMetaDefinition(page.components),
    }));
  }

  public buildComponentMetaDefinition(components = {}) {
    for (const componentId in components) {
      const currentComponentData = components[componentId];

      const componentMeta = cloneDeep(
        componentTypes.find((comp) => currentComponentData.component.component === comp.component)
      );

      const mergedDefinition = {
        // ...componentMeta.definition,
        properties: mergeWith(
          componentMeta.definition.properties,
          currentComponentData?.component?.definition?.properties,
          (objValue, srcValue) => {
            if (['Table'].includes(currentComponentData?.component?.component) && isArray(objValue)) {
              return srcValue;
            } else if (
              [
                'DropdownV2',
                'MultiselectV2',
                'PopoverMenu',
                'Steps',
                'Tabs',
                'RadioButtonV2',
                'Tags',
                'TagsInput',
                'TreeSelect',
                'Cascader',
                'Navigation',
                'ButtonGroupV2',
              ].includes(currentComponentData?.component?.component) &&
              isArray(objValue)
            ) {
              return isArray(srcValue) ? srcValue : Object.values(srcValue);
            }
          }
        ),
        styles: merge(componentMeta.definition.styles, currentComponentData?.component.definition.styles),
        generalStyles: merge(
          componentMeta.definition.generalStyles,
          currentComponentData?.component.definition.generalStyles
        ),
        validation: merge(componentMeta.definition.validation, currentComponentData?.component.definition.validation),
        others: merge(componentMeta.definition.others, currentComponentData?.component.definition.others),
        general: merge(componentMeta.definition.general, currentComponentData?.component.definition.general),
      };

      const mergedComponent = {
        component: {
          ...componentMeta,
          ...currentComponentData.component,
        },
        layouts: {
          ...currentComponentData.layouts,
        },
        withDefaultChildren: componentMeta.withDefaultChildren ?? false,
      };

      mergedComponent.component.definition = mergedDefinition;

      components[componentId] = mergedComponent;
    }

    return components;
  }

  async fetchModules(app: App, allVersions: boolean = false, versionId: string): Promise<any[]> {
    return skipAppEditingVersionHydration.run(true, async () => {
      const versionToLoadId =
        versionId || app.currentVersionId || (app as any).editingVersion?.id;
      if (!versionToLoadId && !allVersions) return [];

      const manager = getConnectionInstance().manager;

      const moduleComponents = await manager
        .createQueryBuilder(Component, 'component')
        .leftJoinAndSelect(Page, 'page', 'page.id = component.page_id')
        .leftJoinAndSelect(AppVersion, 'app_version', 'app_version.id = page.app_version_id')
        .leftJoinAndSelect(App, 'app', 'app.id = app_version.app_id')
        .andWhere(
          `component.type = :module ${allVersions ? '' : 'AND app_version.id = :appVersionId'} AND app.id = :appId`,
          {
            module: 'ModuleViewer',
            appVersionId: versionToLoadId,
            appId: app.id,
          }
        )
        .getMany();

      const moduleAppIds = moduleComponents.map((moduleComponent) => moduleComponent.properties.moduleAppId.value);
      if (moduleAppIds.length === 0) return [];

      const modules = await manager
        .createQueryBuilder(App, 'app')
        .where('app.co_relation_id IN (:...moduleAppIds)', { moduleAppIds })
        .andWhere('app.organization_id = :organizationId', { organizationId: app.organizationId })
        .andWhere('app.type = :moduleType', { moduleType: APP_TYPES.MODULE })
        .distinct(true)
        .getMany();
      if (modules.length === 0) return [];

      // TWO independent rows per module, resolved in bulk (keep SEPARATE):
      //   (1) editingVersion: latest non-branch non-stub VERSION row (the row the editor loads).
      //   (2) metadata source: git-on => latest DRAFT on target branch; git-off => latest any row.
      // 1 defaultBranch lookup + 2 bulk DISTINCT ON queries, keyed per module.
      const moduleIds = modules.map((m) => m.id);
      const parentBranchId = app.editingVersion?.branchId ?? null;

      // (0) Single defaultBranch lookup (not per module). Modules are never workflows here.
      const defaultBranch = await manager.findOne(WorkspaceBranch, {
        where: { organizationId: app.organizationId, isDefault: true },
        select: ['id'],
      });
      const gitEnabled = !!defaultBranch;

      // (1a) Branch-row preference: latest non-stub row on parentBranchId per module.
      //      When set, the module uses this row and skips fallback + overlay + the no-DRAFT throw.
      let branchMap = new Map<string, AppVersion>();
      if (parentBranchId) {
        const branchRows = await manager
          .createQueryBuilder(AppVersion, 'av')
          .distinctOn(['av.appId'])
          .where('av.appId IN (:...moduleIds)', { moduleIds })
          .andWhere('av.branchId = :parentBranchId', { parentBranchId })
          .andWhere('av.isStub = false')
          .orderBy('av.appId', 'ASC')
          .addOrderBy('av.updatedAt', 'DESC')
          .getMany();
        branchMap = new Map(branchRows.map((v) => [v.appId, v]));
      }

      // (1b) editingVersion fallback: latest non-branch non-stub row per module (updatedAt DESC).
      const editingRows = await manager
        .createQueryBuilder(AppVersion, 'av')
        .distinctOn(['av.appId'])
        .where('av.appId IN (:...moduleIds)', { moduleIds })
        .andWhere('av.versionType != :branchType', { branchType: AppVersionType.BRANCH })
        .andWhere('av.isStub = false')
        .orderBy('av.appId', 'ASC')
        .addOrderBy('av.updatedAt', 'DESC')
        .getMany();
      const editingMap = new Map(editingRows.map((v) => [v.appId, v]));

      // (2) metadata source row per module.
      const metaQb = manager
        .createQueryBuilder(AppVersion, 'av')
        .distinctOn(['av.appId'])
        .where('av.appId IN (:...moduleIds)', { moduleIds })
        .orderBy('av.appId', 'ASC')
        .addOrderBy('av.updatedAt', 'DESC');
      if (gitEnabled) {
        // git-on: latest DRAFT on target branch (parentBranchId ?? defaultBranch.id).
        const targetBranchId = parentBranchId ?? defaultBranch.id;
        metaQb.andWhere(
          new Brackets((qb) => {
            qb.where('av.branchId = :targetBranchId AND av.status = :draftStatus', {
              targetBranchId,
              draftStatus: AppVersionStatus.DRAFT,
            }).orWhere('av.branchId IS NULL AND av.status = :publishedStatus', {
              publishedStatus: AppVersionStatus.PUBLISHED,
            });
          })
        );
      }
      // git-off: no extra filter — latest any row per module.
      const metaRows = await metaQb.getMany();
      const metaMap = new Map(metaRows.map((v) => [v.appId, v]));

      for (const moduleApp of modules as any[]) {
        // (1) Branch-row preference + early return: parent viewed on a branch and module has a
        //     branch row → use it, skip fallback + overlay + the no-DRAFT throw.
        if (parentBranchId && branchMap.has(moduleApp.id)) {
          const bv = branchMap.get(moduleApp.id);
          moduleApp.editingVersion = bv;
          moduleApp.appVersions = [bv];
          continue;
        }

        const ev = editingMap.get(moduleApp.id);
        if (ev) {
          moduleApp.editingVersion = ev;
          moduleApp.appVersions = [ev];
        } else if (!gitEnabled) {
          // git-off: no editing row → mark stub
          moduleApp.isStub = true;
        }
        // git-on with no editingVersion: leave as-is

        const meta = metaMap.get(moduleApp.id);
        if (gitEnabled && !meta && parentBranchId) {
          throw new BadRequestException(
            `No DRAFT version found for app ${moduleApp.id} on branch ${parentBranchId}.`
          );
        }
        if (meta) {
          // apps.name/slug/icon/isPublic are NULL for modules (metadata on app_versions).
          if (meta.appName != null) moduleApp.name = meta.appName;
          if (meta.slug != null) moduleApp.slug = meta.slug;
          if (meta.icon != null) moduleApp.icon = meta.icon;
          if (meta.isPublic != null) moduleApp.isPublic = meta.isPublic;
        }
      }

      return modules;
    });
  }
  async findAllOrganizationApps(organizationId: string): Promise<WorkspaceAppsResponseDto[]> {
    return await this.appRepository.findAllOrganizationApps(organizationId);
  }

  async findTooljetDbTables(appId: string): Promise<{ table_id: string }[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const tooljetDbDataQueries = await manager
        .createQueryBuilder(DataQuery, 'data_queries')
        .innerJoin(DataSource, 'data_sources', 'data_queries.data_source_id = data_sources.id')
        .innerJoin(AppVersion, 'app_versions', 'app_versions.id = data_queries.app_version_id')
        .where('app_versions.app_id = :appId', { appId })
        .andWhere('data_sources.kind = :kind', { kind: 'tooljetdb' })
        .getMany();

      const uniqTableIds = new Set();
      tooljetDbDataQueries.forEach((dq) => {
        if (dq.options?.operation === 'join_tables') {
          // The primary table is only in join_table.from.name — no top-level table_id for join queries
          const fromName = dq.options?.join_table?.from?.name;
          if (fromName) uniqTableIds.add(fromName);

          const joinOptions = dq.options?.join_table?.joins ?? [];
          (joinOptions || []).forEach((join) => {
            const { table, conditions } = join;
            if (table) uniqTableIds.add(table);
            conditions?.conditionsList?.forEach((condition) => {
              const { leftField, rightField } = condition;
              if (leftField?.table) {
                uniqTableIds.add(leftField?.table);
              }
              if (rightField?.table) {
                uniqTableIds.add(rightField?.table);
              }
            });
          });
        }
        if (dq.options.table_id) uniqTableIds.add(dq.options.table_id);
      });

      return [...uniqTableIds].map((table_id) => {
        return { table_id };
      });
    });
  }

  async findByAppName(name: string, organizationId: string): Promise<App> {
    return this.appRepository.findByAppName(name, organizationId);
  }

  async findByAppId(appId: string, manager?: EntityManager): Promise<App> {
    return dbTransactionWrap((manager: EntityManager) => {
      return this.appRepository.findByAppId(appId, manager);
    }, manager);
  }

  /**
   * Determines if the editor should be frozen based on version status, type, and git configuration.
   * Workspace-level git sync replaced the per-app allowEditing toggle — branching alone now
   * decides whether default-branch VERSION rows are frozen.
   */
  shouldFreezeEditor(editingVersion: AppVersion, orgGit: any): boolean {
    if (editingVersion?.status === AppVersionStatus.PUBLISHED) return true;

    if (editingVersion?.versionType === AppVersionType.VERSION) {
      if (editingVersion?.status !== AppVersionStatus.DRAFT) return true;
      if (orgGit?.isBranchingEnabled) return true;
    }

    return false;
  }

  async checkModuleInUseByApps(moduleApp: App, manager: EntityManager): Promise<void> {
    if (!moduleApp?.co_relation_id) return;
    try {
      // co_relation_id = stable module identity across branches. Self-ref excluded so a
      // module can reference itself without blocking its own deletion.
      const consumingApps = await manager
        .createQueryBuilder(Component, 'component')
        .innerJoin('component.page', 'page')
        .innerJoin('page.appVersion', 'appVersion')
        .innerJoin(App, 'app', 'app.id = appVersion.appId')
        .select('DISTINCT app.name', 'appName')
        .where('component.type = :type', { type: 'ModuleViewer' })
        .andWhere(`(component.properties::jsonb -> 'moduleAppId' ->> 'value') = :coRel`, {
          coRel: moduleApp.co_relation_id,
        })
        .andWhere('app.id != :selfId', { selfId: moduleApp.id })
        .getRawMany();

      const appNames = consumingApps.map((r) => r.appName).filter(Boolean);
      if (appNames.length > 0) {
        throw new BadRequestException(`Cannot delete this module.\nUsed by:\n${appNames.join('\n')}`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Failed to check if module is in use', error?.stack || error);
      throw new BadRequestException('Failed to validate module references');
    }
  }

  async checkModulesReleasedInApp(versionId: string, organizationId: string, manager: EntityManager): Promise<void> {
    try {
      // Every ModuleViewer's resolved row must be the module's released version.
      // Modules not consumed by this version may stay in draft — only the in-use set
      // is checked here (resolveAllModuleViewersForVersion scopes to versionId's components).
      // Block on:
      //   no-row             — module unusable
      //   orphan-fallback    — UUID pin matched no row; runtime drifts
      //   unpinned-fallback  — empty pin; runtime drifts
      //   pin-hit + DRAFT    — pinned directly at editing draft
      //   pin-hit + module never released (moduleCurrentVersionId null)
      //   pin-hit + pin != module's current_version_id
      const resolved = await resolveAllModuleViewersForVersion(manager, versionId, organizationId);
      const offenders = resolved.filter((v) => {
        if (v.matchKind === 'no-row' || v.matchKind === 'orphan-fallback' || v.matchKind === 'unpinned-fallback') {
          return true;
        }
        if (!v.resolved) return true;
        if (v.resolved.status === AppVersionStatus.DRAFT) return true;
        if (!v.resolved.moduleCurrentVersionId) return true;
        return v.resolved.moduleCurrentVersionId !== v.resolved.rowId;
      });

      if (offenders.length > 0) {
        const seen = new Set<string>();
        const unique: ResolvedModuleViewer[] = [];
        for (const o of offenders) {
          // componentId tiebreaker — prevents malformed components collapsing to one bucket.
          const key = o.moduleName ?? (o.moduleAppCoRel || o.componentId);
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(o);
        }
        const formatEntry = (m: ResolvedModuleViewer) => {
          const name = m.moduleName ?? 'unknown module';
          if (m.matchKind === 'no-row') {
            return `Module "${name}" has no saved version yet. Save and release the module first.`;
          }
          if (m.matchKind === 'orphan-fallback') {
            return `Module "${name}" pin is invalid. Pin a released version.`;
          }
          if (m.matchKind === 'unpinned-fallback') {
            return `Module "${name}" has active draft pinned. Pin a released version.`;
          }
          // pin-hit branches.
          const versionName = m.resolved?.versionName ?? 'draft';
          if (m.resolved?.status === AppVersionStatus.DRAFT) {
            return `Module "${name}" version "${versionName}" is still in draft. Release the module first.`;
          }
          // Module never released OR pinned to non-released version.
          return `Module "${name}" version "${versionName}" is not released. Release the module first.`;
        };
        const moduleList = unique.map(formatEntry).join(' ');
        const message =
          unique.length === 1
            ? `Release blocked - ${formatEntry(unique[0])}`
            : `Release blocked - ${unique.length} modules need attention. ${moduleList}`;
        throw new BadRequestException({
          message: { error: message, details: moduleList },
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Failed to check module release state', error?.stack || error);
      throw new BadRequestException('Failed to validate module versions for release');
    }
  }

  /**
   * Overlay name/slug/icon/isPublic from the right app_version row onto the App entity
   * in-memory so single-app reads (`getOne`, `getBySlug`, etc.) return the correct
   * user-facing metadata. Workflows are skipped — they keep metadata on apps.* directly.
   *
   * Source resolution (mirrors AppsRepository.resolveMetadataVersion):
   *   1. Detect git-sync state via the default-branch lookup.
   *   2. Git enabled + branchId supplied → DRAFT row on that branch (throws if none).
   *   3. Git enabled + no branchId       → DRAFT row on the default branch.
   *   4. Git off                         → any version row (every row carries
   *                                        identical metadata).
   *
   * DRAFT scoping in the git-enabled cases matches the metadata-write path
   * (AppsUtilService.update writes the DRAFT branch row) so published/released
   * snapshots can't shadow the current metadata.
   */
  async overlayAppMetadata(app: App, branchId?: string): Promise<void> {
    if (!app || app.type === APP_TYPES.WORKFLOW) return;

    return dbTransactionWrap(async (manager: EntityManager) => {
      const defaultBranch = await manager.findOne(WorkspaceBranch, {
        where: { organizationId: app.organizationId, isDefault: true },
        select: ['id'],
      });
      const gitEnabled = !!defaultBranch;

      let source: AppVersion | null = null;
      if (gitEnabled) {
        const targetBranchId = branchId ?? defaultBranch.id;
        source = await manager.findOne(AppVersion, {
          where: { appId: app.id, branchId: targetBranchId, status: AppVersionStatus.DRAFT },
          order: { updatedAt: 'DESC' },
          select: ['id', 'appName', 'slug', 'icon', 'isPublic'],
        });
        if (!source && branchId) {
          throw new BadRequestException(`No DRAFT version found for app ${app.id} on branch ${branchId}.`);
        }
      } else {
        // Git off: pick any version row — every row carries identical metadata.
        source = await manager.findOne(AppVersion, {
          where: { appId: app.id },
          order: { updatedAt: 'DESC' },
          select: ['id', 'appName', 'slug', 'icon', 'isPublic'],
        });
      }

      if (!source) return;
      if (source.appName != null) app.name = source.appName;
      if (source.slug != null) app.slug = source.slug;
      if (source.icon != null) app.icon = source.icon;
      if (source.isPublic != null) app.isPublic = source.isPublic;
    });
  }
}
