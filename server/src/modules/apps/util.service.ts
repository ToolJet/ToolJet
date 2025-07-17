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
import { EntityManager, MoreThan, SelectQueryBuilder } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppsRepository } from './repository';
import { AppVersion } from '@entities/app_version.entity';
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
import { cloneDeep } from 'lodash';
import { merge } from 'lodash';
import { mergeWith } from 'lodash';
import { isArray } from 'lodash';
import { UserAppsPermissions, UserWorkflowPermissions } from '@modules/ability/types';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { IAppsUtilService } from './interfaces/IUtilService';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { APP_TYPES } from './constants';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { WorkspaceAppsResponseDto } from '@modules/external-apis/dto';
import { DataQuery } from '@entities/data_query.entity';

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
    manager: EntityManager
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
              aiGenerationMetadata: {
                steps: [
                  {
                    name: 'Describe app',
                    id: 'describe_app',
                    loadingStates: ['Generating PRD', 'PRD generated successfully'],
                  },
                  {
                    name: 'Define specs',
                    id: 'define_specs',
                    loadingStates: ['Generating app', 'App generated successfully'],
                  },
                  {
                    name: 'Setup database',
                    id: 'setup_database',
                    loadingStates: ['Generating app', 'App generated successfully'],
                  },
                  {
                    name: 'Generate app',
                    id: 'generate_app',
                    loadingStates: ['Generating app', 'App generated successfully'],
                  },
                ],
                activeStep: 'describe_app',
                completedSteps: [],
                version: 'v1',
              },
            }),
            isInitialisedFromPrompt: isInitialisedFromPrompt,
            appBuilderMode: isInitialisedFromPrompt ? 'ai' : 'visual',
            ...(type === APP_TYPES.WORKFLOW && { workflowApiToken: uuidv4() }),
          })
        );
      }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'This app name is already taken.' }]);

      //create default app version
      const firstPriorityEnv = await this.appEnvironmentUtilService.get(user.organizationId, null, true, manager);
      const appVersion = await this.versionRepository.createOne('v1', app.id, firstPriorityEnv.id, null, manager);

      const defaultHomePage = await manager.save(
        manager.create(Page, {
          name: 'Home',
          handle: 'home',
          appVersionId: appVersion.id,
          index: 1,
          autoComputeLayout: true,
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
            styles: {
              backgroundColor: { value: '#fff' },
            },
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

      // Set default values for app version
      appVersion.showViewerNavigation = type === 'module' ? false : true;
      appVersion.homePageId = defaultHomePage.id;
      appVersion.globalSettings = {
        hideHeader: false,
        appInMaintenance: false,
        canvasMaxWidth: 100,
        canvasMaxWidthType: '%',
        canvasMaxHeight: 2400,
        canvasBackgroundColor: 'var(--cc-appBackground-surface)',
        backgroundFxQuery: '',
        appMode: 'auto',
      };
      await manager.save(appVersion);
      return app;
    }, manager);
  }

  async findAppWithIdOrSlug(slug: string, organizationId: string): Promise<App> {
    let app: App;
    try {
      app = await this.appRepository.findById(slug, organizationId);
    } catch (error) {
      /* means: UUID error. so the slug isn't not the id of the app */
      if (error?.code === `22P02`) {
        /* Search against slug */
        app = await this.appRepository.findBySlug(slug, organizationId);
      }
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
    const { name, slug, icon } = appUpdateDto;
    const { id: appId, currentVersionId: lastReleasedVersion } = app;

    const updatableParams = {
      name,
      slug,
      isPublic,
      isMaintenanceOn,
      currentVersionId,
      icon,
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
      return await catchDbException(async () => {
        return await manager.update(App, appId, updatableParams);
      }, [
        { dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'This app name is already taken.' },
        { dbConstraint: DataBaseConstraints.APP_SLUG_UNIQUE, message: 'This app slug is already taken.' },
      ]);
    }, manager);
  }

  async updateWorflowVersion(version: AppVersion, body: AppVersionUpdateDto, app: App) {
    const { name, currentEnvironmentId, definition } = body;
    const { currentVersionId, organizationId } = app;
    let currentEnvironment: AppEnvironment;

    if (version.id === currentVersionId && !body?.is_user_switched_version)
      throw new BadRequestException('You cannot update a released version');

    if (currentEnvironmentId || definition) {
      currentEnvironment = await AppEnvironment.findOne({
        where: { id: version.currentEnvironmentId },
      });
    }

    const editableParams = {};
    if (name) {
      //means user is trying to update the name
      const versionNameExists = await this.versionRepository.findOne({
        where: { name, appId: version.appId },
      });

      if (versionNameExists) {
        throw new BadRequestException('Version name already exists.');
      }
      editableParams['name'] = name;
    }

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
      .where('app_versions.id = :currentVersionId', {
        versionId,
      })
      .getOne();
  }

  async all(user: User, page: number, searchKey: string, type: string): Promise<AppBase[]> {
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
      resources: [{ resource: resourceType }],
      organizationId: user.organizationId,
    });
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const viewableAppsQb = this.viewableAppsQueryUsingPermissions(
        user,
        userPermission[resourceType],
        manager,
        searchKey,
        undefined,
        type
      );

      // Eagerly load appVersions for modules
      if (type === APP_TYPES.MODULE) {
        viewableAppsQb.leftJoinAndSelect('apps.appVersions', 'appVersions');
      }

      if (page) {
        return await viewableAppsQb
          .take(9)
          .skip(9 * (page - 1))
          .getMany();
      }
      return await viewableAppsQb.getMany();
    });
  }

  protected viewableAppsQueryUsingPermissions(
    user: User,
    userAppPermissions: UserAppsPermissions | UserWorkflowPermissions,
    manager: EntityManager,
    searchKey?: string,
    select?: Array<string>,
    type?: string
  ): SelectQueryBuilder<AppBase> {
    const viewableAppsQb = manager
      .createQueryBuilder(AppBase, 'apps')
      .innerJoin('apps.user', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .where('apps.organizationId = :organizationId', { organizationId: user.organizationId });

    if (type === APP_TYPES.MODULE) {
      viewableAppsQb.leftJoinAndSelect('apps.appVersions', 'versions');
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
    return userAppPermissions.hideAll
      ? [null, ...userAppPermissions.editableAppsId]
      : [
          null,
          ...Array.from(
            new Set([
              ...userAppPermissions.editableAppsId,
              ...userAppPermissions.viewableAppsId.filter((id) => !userAppPermissions.hiddenAppsId.includes(id)),
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

  async count(user: User, searchKey, type: APP_TYPES): Promise<number> {
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
      const apps = await this.viewableAppsQueryUsingPermissions(
        user,
        userPermission[resourceType],
        manager,
        searchKey,
        undefined,
        type
      ).getCount();

      return apps;
    });
  }

  mergeDefaultComponentData(pages) {
    return pages.map((page) => ({
      ...page,
      components: this.buildComponentMetaDefinition(page.components),
    }));
  }

  protected buildComponentMetaDefinition(components = {}) {
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
              ['DropdownV2', 'MultiselectV2', 'Steps'].includes(currentComponentData?.component?.component) &&
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
              .where('app.id IN (:...moduleAppIds)', { moduleAppIds })
              .distinct(true)
              .getMany()
          : [];
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
}
