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
import { UserAppsPermissions } from '@modules/ability/types';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { IAppsUtilService } from './interfaces/IUtilService';
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';

@Injectable()
export class AppsUtilService implements IAppsUtilService {
  constructor(
    protected readonly appRepository: AppsRepository,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly versionRepository: VersionRepository,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly abilityService: AbilityService,
    protected readonly dataSourceRepository: DataSourcesRepository,
    protected readonly dataSourceUtilService: DataSourcesUtilService
  ) {}
  async create(name: string, user: User, type: string, manager: EntityManager): Promise<App> {
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
            isMaintenanceOn: type === 'workflow' ? true : false,
            ...(type === 'workflow' && { workflowApiToken: uuidv4() }),
          })
        );
      }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'This app name is already taken.' }]);

      //create default app version
      const firstPriorityEnv = await this.appEnvironmentUtilService.get(user.organizationId, null, true, manager);
      const appVersion = await this.versionRepository.createOne('v1', app.id, firstPriorityEnv.id, null, manager);

      for (const defaultSource of ['restapi', 'runjs', 'runpy', 'tooljetdb', 'workflows']) {
        const dataSource = await this.dataSourceRepository.createDefaultDataSource(
          defaultSource,
          appVersion.id,
          manager
        );
        await this.dataSourceUtilService.createDataSourceInAllEnvironments(user.organizationId, dataSource.id, manager);
      }
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
        canvasBackgroundColor: '#edeff5',
        backgroundFxQuery: '',
        appMode: 'auto',
      };
      await manager.save(appVersion);
      return app;
    }, manager);
  }

  // async createVersion(
  //   user: User,
  //   app: App,
  //   versionName: string,
  //   versionFromId: string,
  //   manager?: EntityManager
  // ): Promise<AppVersion> {
  //   return await dbTransactionWrap(async (manager: EntityManager) => {
  //     let versionFrom: AppVersion;
  //     const { organizationId } = user;

  //     if (versionFromId) {
  //       versionFrom = await manager.findOneOrFail(AppVersion, {
  //         where: {
  //           id: versionFromId,
  //           app: {
  //             id: app.id,
  //             organizationId,
  //           },
  //         },
  //         relations: ['app', 'dataSources', 'dataSources.dataQueries', 'dataSources.dataSourceOptions'],
  //       });
  //     }

  //     const noOfVersions = await manager.count(AppVersion, { where: { appId: app?.id } });

  //     if (noOfVersions && !versionFrom) {
  //       throw new BadRequestException('Version from should not be empty');
  //     }

  //     if (versionFrom) {
  //     }

  //     return appVersion;
  //   }, manager);
  // }

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
    const isMultiEnvironmentEnabled = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);
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

  async update(app: App, appUpdateDto: AppUpdateDto, organizationId?: string, manager?: EntityManager) {
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
          LICENSE_FIELD.MULTI_ENVIRONMENT
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
      if (!(await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT))) {
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
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.APP }],
      organizationId: user.organizationId,
    });
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const viewableAppsQb = this.viewableAppsQueryUsingPermissions(
        user,
        userPermission[MODULES.APP],
        manager,
        searchKey,
        undefined,
        type
      );

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
    userAppPermissions: UserAppsPermissions,
    manager: EntityManager,
    searchKey?: string,
    select?: Array<string>,
    type?: string
  ): SelectQueryBuilder<AppBase> {
    const viewableApps = userAppPermissions.hideAll
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
    const viewableAppsQb = manager
      .createQueryBuilder(AppBase, 'viewable_apps')
      .innerJoin('viewable_apps.user', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .where('viewable_apps.organizationId = :organizationId', { organizationId: user.organizationId });

    if (type === 'module') {
      viewableAppsQb.leftJoinAndSelect('viewable_apps.appVersions', 'versions');
    }

    if (type) viewableAppsQb.andWhere('viewable_apps.type = :type', { type: type });

    if (searchKey) {
      viewableAppsQb.andWhere('LOWER(viewable_apps.name) like :searchKey', {
        searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
      });
    }

    if (select) {
      viewableAppsQb.select(select.map((col) => `viewable_apps.${col}`));
    }
    viewableAppsQb.orderBy('viewable_apps.createdAt', 'DESC');
    if (this.isSuperAdmin(user)) {
      return viewableAppsQb;
    }

    const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;
    if (isAllEditable) return viewableAppsQb;
    if ((isAllViewable && hideAll) || (!isAllViewable && !hideAll) || (!isAllViewable && hideAll)) {
      viewableAppsQb.andWhere('viewable_apps.id IN (:...viewableApps)', {
        viewableApps,
      });
      return viewableAppsQb;
    }
    const hiddenApps = userAppPermissions.hiddenAppsId.filter((id) => !userAppPermissions.editableAppsId.includes(id));
    if (!userAppPermissions.hideAll && isAllViewable && hiddenApps.length > 0) {
      viewableAppsQb.andWhere('viewable_apps.id NOT IN (:...hiddenApps)', {
        hiddenApps,
      });
    }
    return viewableAppsQb;
  }

  protected isSuperAdmin(user: User) {
    return !!(user?.userType === USER_TYPE.INSTANCE);
  }

  async count(user: User, searchKey, type: string): Promise<number> {
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.APP }],
      organizationId: user.organizationId,
    });
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const apps = await this.viewableAppsQueryUsingPermissions(
        user,
        userPermission[MODULES.APP],
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
              ['DropdownV2', 'MultiselectV2'].includes(currentComponentData?.component?.component) &&
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
}
