import { App } from '@entities/app.entity';
import { Page } from '@entities/page.entity';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { catchDbException, cleanObject } from '@helpers/utils.helper';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from '@entities/data_source.entity';
import { EntityManager, MoreThan, Not, SelectQueryBuilder } from 'typeorm';
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
import { APP_TYPES } from './constants';
import { Component } from 'src/entities/component.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { Layout } from 'src/entities/layout.entity';
import { WorkspaceAppsResponseDto } from '@modules/external-apis/dto';
import { DataQuery } from '@entities/data_query.entity';
import { isUUID } from 'class-validator';

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
    branchId?: string
  ): Promise<App> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const app = await catchDbException(() => {
        return manager.save(
          manager.create(App, {
            type,
            name,
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
        const branchVersion = await manager.save(
          AppVersion,
          manager.create(AppVersion, {
            // name: uuidv4(),
            name: type === APP_TYPES.WORKFLOW ? 'v1' : workspaceBranch!.name,
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
          })
        );

        const branchHomePage = await manager.save(
          manager.create(Page, {
            name: 'Home',
            handle: 'home',
            appVersionId: branchVersion.id,
            index: 1,
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
              styles: { backgroundColor: { value: '#fff' } },
              displayPreferences: {
                showOnDesktop: { value: '{{true}}' },
                showOnMobile: { value: '{{true}}' },
              },
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
        const appVersion = await this.versionRepository.createOne('v1', app.id, firstPriorityEnv.id, null, manager);

        const defaultHomePage = await manager.save(
          manager.create(Page, {
            name: 'Home',
            handle: 'home',
            appVersionId: appVersion.id,
            index: 1,
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
              styles: { backgroundColor: { value: '#fff' } },
              displayPreferences: {
                showOnDesktop: { value: '{{true}}' },
                showOnMobile: { value: '{{true}}' },
              },
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
    if (environmentName && !isMultiEnvironmentEnabled) {
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
    const { id: appId, currentVersionId: lastReleasedVersion } = app;

    const updatableParams = {
      name,
      slug,
      isPublic,
      isMaintenanceOn,
      currentVersionId,
      icon,
      appBuilderMode,
    };

    // removing keys with undefined values
    cleanObject(updatableParams);
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (updatableParams.currentVersionId) {
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

      if (updatableParams.slug) {
        const conflictingApp = await manager.findOne(App, {
          where: { slug: updatableParams.slug, organizationId, id: Not(appId) },
        });
        if (conflictingApp) {
          await manager.update(App, conflictingApp.id, { slug: conflictingApp.id });
        }
      }

      return await catchDbException(async () => {
        return await manager.update(App, appId, updatableParams);
      }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'This app name is already taken.' }]);
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
    //Migrate it to app utility files
    let resourceType: MODULES;

    switch (type) {
      case APP_TYPES.WORKFLOW:
        resourceType = MODULES.WORKFLOWS;
        break;
      case APP_TYPES.FRONT_END:
        resourceType = MODULES.APP;
        break;
      case APP_TYPES.MODULE:
        resourceType = MODULES.APP;
        break;
      default:
        resourceType = MODULES.APP;
    }
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: resourceType }, { resource: MODULES.FOLDER }],
      organizationId: user.organizationId,
    });
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const viewableAppsQb = this.viewableAppsQueryUsingPermissions(
        user,
        userPermission[resourceType],
        manager,
        searchKey,
        isGetAll ? ['id', 'slug', 'name', 'currentVersionId'] : undefined,
        type,
        branchId
      );

      // Eagerly load appVersions for modules, branch-filtered like apps.
      // We intentionally DO NOT filter out stub versions at this outer join —
      // after a branch-create or workspace pull a net-new module has only a
      // stub version on the branch, and filtering it out would hide the module
      // from the dashboard entirely (apps work the same way without the filter).
      // The UUID-name-leak concern is handled by the inner `versions`-aliased
      // join in viewableAppsQueryUsingPermissions, which is what ModuleManager
      // reads when a user drags a ModuleViewer onto a canvas. Stubs clicked from
      // the dashboard hydrate lazily via AppsService.getOne → hydrateStubApp.
      if (type === APP_TYPES.MODULE && !isGetAll) {
        if (branchId) {
          viewableAppsQb.innerJoinAndSelect('apps.appVersions', 'appVersions', 'appVersions.branchId = :branchId', {
            branchId,
          });
        } else {
          viewableAppsQb.leftJoinAndSelect('apps.appVersions', 'appVersions');
        }
      } else if (branchId && type === APP_TYPES.FRONT_END) {
        // If branchId is provided -> Gitsync -> need to load app versions of the branch.
        // Inner joining -> show on dashboard only if there is a version on the branch, which means the app is gitsynced to the branch.
        // Workflows remain common across all branches - no branch filter applied.
        viewableAppsQb.innerJoinAndSelect('apps.appVersions', 'appVersions', 'appVersions.branchId = :branchId', {
          branchId,
        });
      }

      if (isGetAll) {
        return await viewableAppsQb.getMany();
      }

      return await viewableAppsQb
        .take(9)
        .skip(9 * (page - 1))
        .getMany();
    });
  }

  protected viewableAppsQueryUsingPermissions(
    user: User,
    userAppPermissions: UserAppsPermissions | UserWorkflowPermissions,
    manager: EntityManager,
    searchKey?: string,
    select?: Array<string>,
    type?: string,
    branchId?: string
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
      viewableAppsQb.andWhere('LOWER(apps.name) like :searchKey', {
        searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
      });
    }

    if (select) {
      viewableAppsQb.select(select.map((col) => `apps.${col}`));
    }

    viewableAppsQb.orderBy('apps.createdAt', 'DESC');

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
    if (isAllEditable) return query;

    if ((isAllViewable && hideAll) || (!isAllViewable && !hideAll) || (!isAllViewable && hideAll)) {
      query.andWhere('apps.id IN (:...viewableApps)', {
        viewableApps,
      });
      return query;
    }

    const hiddenApps = userAppPermissions.hiddenAppsId.filter((id) => !userAppPermissions.editableAppsId.includes(id));
    if (!userAppPermissions.hideAll && isAllViewable && hiddenApps.length > 0) {
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
    let resourceType: MODULES;

    switch (type) {
      case APP_TYPES.WORKFLOW:
        resourceType = MODULES.WORKFLOWS;
        break;
      case APP_TYPES.FRONT_END:
        resourceType = MODULES.APP;
        break;
      default:
        resourceType = MODULES.APP;
    }
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: resourceType }],
      organizationId: user.organizationId,
    });
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await this.viewableAppsQueryUsingPermissions(
        user,
        userPermission[resourceType],
        manager,
        searchKey,
        undefined,
        type,
        branchId
      ).getCount();
    });
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
                'Navigation',
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
    const versionToLoad = versionId
      ? await this.versionRepository.findVersion(versionId)
      : app.currentVersionId
        ? await this.versionRepository.findVersion(app.currentVersionId)
        : await this.versionRepository.findVersion(app.editingVersion?.id);

    const modules = await dbTransactionWrap(async (manager) => {
      const moduleComponents = await manager
        .createQueryBuilder(Component, 'component')
        .leftJoinAndSelect(Page, 'page', 'page.id = component.page_id')
        .leftJoinAndSelect(AppVersion, 'app_version', 'app_version.id = page.app_version_id')
        .leftJoinAndSelect(App, 'app', 'app.id = app_version.app_id')
        .andWhere(
          `component.type = :module ${allVersions ? '' : 'AND app_version.id = :appVersionId'} AND app.id = :appId`,
          {
            module: 'ModuleViewer',
            appVersionId: versionToLoad.id,
            appId: app.id,
          }
        )
        .getMany();

      const moduleAppIds = moduleComponents.map((moduleComponent) => moduleComponent.properties.moduleAppId.value);

      const modules =
        moduleAppIds.length > 0
          ? await manager
              .createQueryBuilder(App, 'app')
              .where('app.co_relation_id IN (:...moduleAppIds)', { moduleAppIds })
              .andWhere('app.organization_id = :organizationId', { organizationId: app.organizationId })
              .andWhere('app.type = :moduleType', { moduleType: APP_TYPES.MODULE })
              .distinct(true)
              .getMany()
          : [];

      // Branch-scope each module's editingVersion to match the parent app's branch.
      // The App subscriber sets editingVersion to the VERSION-type (default-branch) version
      // because it has no branch context. When the parent app is being viewed on a feature
      // branch, callers rely on module.editingVersion downstream (pages/queries/events), so
      // stale default-branch content leaks through unless we override here.
      const parentBranchId = app.editingVersion?.branchId;
      if (parentBranchId && modules.length > 0) {
        await Promise.all(
          modules.map(async (moduleApp: any) => {
            const branchVersion = await manager.findOne(AppVersion, {
              where: { appId: moduleApp.id, branchId: parentBranchId, isStub: false },
              order: { updatedAt: 'DESC' },
            });
            if (branchVersion) {
              moduleApp.editingVersion = branchVersion;
            }
          })
        );
      }

      return modules;
    });
    return modules;
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
   * Determines if the editor should be frozen based on version status, type, and git configuration
   * @param editingVersion - The app version being edited
   * @param environmentPriority - The priority of the current environment (> 1 means production-like)
   * @param appGit - The app's git configuration
   * @param orgGit - The organization's git configuration
   * @returns boolean indicating if editor should be frozen
   */
  shouldFreezeEditor(editingVersion: AppVersion, appGit: any, orgGit: any): boolean {
    let shouldFreezeEditor = false;
    // Check version status and type
    if (editingVersion?.status === AppVersionStatus.PUBLISHED) {
      shouldFreezeEditor = true;
    } else if (
      editingVersion?.versionType === AppVersionType.VERSION &&
      editingVersion?.status === AppVersionStatus.DRAFT &&
      (!orgGit || !orgGit?.isBranchingEnabled)
    ) {
      // Draft VERSION without branching — not frozen
    } else if (
      editingVersion?.versionType === AppVersionType.VERSION &&
      editingVersion?.status !== AppVersionStatus.DRAFT
    ) {
      shouldFreezeEditor = true;
    } else {
      // Workspace branching takes precedence: if branching is enabled, VERSION-type drafts on the
      // default branch are always frozen (edits must happen on feature branches).
      if (orgGit && orgGit?.isBranchingEnabled && editingVersion?.versionType === AppVersionType.VERSION) {
        shouldFreezeEditor = true;
      } else if (editingVersion?.versionType === AppVersionType.BRANCH) {
        // Feature-branch versions are editable by definition — allowEditing on the
        // canonical appGit (default branch) must not freeze branch copies.
      } else if (appGit) {
        shouldFreezeEditor = !appGit?.allowEditing || shouldFreezeEditor;
      }
    }

    return shouldFreezeEditor;
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

  async checkModulesReleasedInApp(
    versionId: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<void> {
    try {
      // 3-case moduleVersionId resolution — see VersionUtilService.checkDraftModulesInApp
      // for the cases. Predicate: the module's apps.current_version_id (released version)
      // must equal the resolved mod_ver.id. Null current_version_id means never released.
      const unreleasedModules = await manager
        .createQueryBuilder(Component, 'component')
        .innerJoin('component.page', 'page')
        .innerJoin('page.appVersion', 'appVersion')
        .innerJoin(
          'app_versions',
          'mod_ver',
          `mod_ver.id::text = (component.properties::jsonb -> 'moduleVersionId' ->> 'value')
           OR (
             (component.properties::jsonb -> 'moduleVersionId' ->> 'value') = mod_ver.name
             AND mod_ver.version_type = 'version'
             AND mod_ver.app_id IN (
               SELECT id FROM apps
               WHERE co_relation_id::text = (component.properties::jsonb -> 'moduleAppId' ->> 'value')
                 AND type = 'module'
             )
           )
           OR (
             (component.properties::jsonb -> 'moduleVersionId' ->> 'value') IN (
               SELECT branch_name FROM organization_git_sync_branches WHERE organization_id = :orgId
             )
             AND mod_ver.version_type = 'version'
             AND mod_ver.branch_id = (
               SELECT id FROM organization_git_sync_branches
               WHERE is_default = true AND organization_id = :orgId
             )
             AND mod_ver.app_id IN (
               SELECT id FROM apps
               WHERE co_relation_id::text = (component.properties::jsonb -> 'moduleAppId' ->> 'value')
                 AND type = 'module'
             )
           )`,
          { orgId: organizationId }
        )
        .innerJoin('apps', 'mod_app', 'mod_app.id = mod_ver.app_id')
        .select('DISTINCT mod_app.name', 'moduleName')
        .addSelect('mod_ver.name', 'versionName')
        .where('component.type = :type', { type: 'ModuleViewer' })
        .andWhere('appVersion.id = :versionId', { versionId })
        .andWhere('(mod_app.current_version_id IS NULL OR mod_app.current_version_id != mod_ver.id)')
        .getRawMany();

      if (unreleasedModules.length > 0) {
        const moduleList = unreleasedModules.map((m) => `${m.moduleName} (${m.versionName})`).join(', ');
        const message =
          unreleasedModules.length === 1
            ? `Release blocked - Module "${unreleasedModules[0].moduleName} (${unreleasedModules[0].versionName})" hasn't been released yet.`
            : `Release blocked - ${unreleasedModules.length} dependent modules haven't been released yet.`;
        throw new BadRequestException({
          message: { error: message, details: `Modules not released: ${moduleList}` },
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Failed to check module release state', error?.stack || error);
      throw new BadRequestException('Failed to validate module versions for release');
    }
  }
}
