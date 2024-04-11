import { BadRequestException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { EntityManager, MoreThan, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { AppImportExportService } from './app_import_export.service';
import { DataSourcesService } from './data_sources.service';
import { Credential } from 'src/entities/credential.entity';
import { catchDbException, cleanObject, dbTransactionWrap, defaultAppEnvironments } from 'src/helpers/utils.helper';
import { AppUpdateDto } from '@dto/app-update.dto';
import { viewableAppsQuery } from 'src/helpers/queries';
import { VersionEditDto } from '@dto/version-edit.dto';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { AppEnvironmentService } from './app_environments.service';
import { decode } from 'js-base64';
import { DataSourceScopes } from 'src/helpers/data_source.constants';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { Page } from 'src/entities/page.entity';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { Layout } from 'src/entities/layout.entity';

import { Component } from 'src/entities/component.entity';
import { EventHandler } from 'src/entities/event_handler.entity';
import { AppBase } from 'src/entities/app_base.entity';

const uuid = require('uuid');
@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private appsRepository: Repository<App>,

    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>,

    @InjectRepository(AppUser)
    private appUsersRepository: Repository<AppUser>,

    private appImportExportService: AppImportExportService,
    private dataSourcesService: DataSourcesService,
    private appEnvironmentService: AppEnvironmentService
  ) {}
  async find(id: string): Promise<App> {
    return this.appsRepository.findOne({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<App> {
    return await this.appsRepository.findOne({
      where: {
        slug,
      },
    });
  }

  async findVersion(id: string): Promise<AppVersion> {
    const appVersion = await this.appVersionsRepository.findOneOrFail({
      where: { id },
      relations: [
        'app',
        'dataQueries',
        'dataQueries.dataSource',
        'dataQueries.plugins',
        'dataQueries.plugins.manifestFile',
      ],
    });

    if (appVersion?.dataQueries) {
      // eslint-disable-next-line no-unsafe-optional-chaining
      for (const query of appVersion?.dataQueries) {
        if (query?.plugin) {
          query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
        }
      }
    }

    return appVersion;
  }

  async findAppFromVersion(id: string): Promise<App> {
    return (
      await this.appVersionsRepository.findOneOrFail({
        where: { id },
        relations: ['app'],
      })
    ).app;
  }

  async findVersionFromName(name: string, appId: string): Promise<AppVersion> {
    return await this.appVersionsRepository.findOne({
      where: { name, appId },
    });
  }

  async findDataQueriesForVersion(appVersionId: string): Promise<DataQuery[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return manager
        .createQueryBuilder(DataQuery, 'data_query')
        .innerJoin('data_query.dataSource', 'data_source')
        .addSelect('data_source.kind')
        .where('data_query.appVersionId = :appVersionId', { appVersionId })
        .getMany();
    });
  }

  async create(name: string, user: User, manager: EntityManager): Promise<App> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await catchDbException(async () => {
        const app = await manager.save(
          manager.create(App, {
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
            organizationId: user.organizationId,
            userId: user.id,
          })
        );

        //create default app version
        const appVersion = await this.createVersion(user, app, 'v1', null, null, manager);

        const defaultHomePage = await manager.save(
          manager.create(Page, {
            name: 'Home',
            handle: 'home',
            appVersionId: appVersion.id,
            index: 1,
          })
        );

        // Set default values for app version
        appVersion.showViewerNavigation = true;
        appVersion.homePageId = defaultHomePage.id;
        appVersion.globalSettings = {
          hideHeader: false,
          appInMaintenance: false,
          canvasMaxWidth: 100,
          canvasMaxWidthType: '%',
          canvasMaxHeight: 2400,
          canvasBackgroundColor: '#edeff5',
          backgroundFxQuery: '',
        };
        await manager.save(appVersion);

        await manager.save(
          manager.create(AppUser, {
            userId: user.id,
            appId: app.id,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

        await this.createAppGroupPermissionsForAdmin(app, manager);
        return app;
      }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'This app name is already taken.' }]);
    });
  }

  async createAppGroupPermissionsForAdmin(app: App, manager: EntityManager): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const orgDefaultGroupPermissions = await manager.find(GroupPermission, {
        where: {
          organizationId: app.organizationId,
          group: 'admin',
        },
      });

      for (const groupPermission of orgDefaultGroupPermissions) {
        const appGroupPermission = manager.create(AppGroupPermission, {
          groupPermissionId: groupPermission.id,
          appId: app.id,
          ...this.fetchDefaultAppGroupPermissions(groupPermission.group),
        });

        await manager.save(appGroupPermission);
      }
    }, manager);
  }

  fetchDefaultAppGroupPermissions(group: string): {
    read: boolean;
    update: boolean;
    delete: boolean;
  } {
    switch (group) {
      case 'all_users':
        return { read: true, update: false, delete: false };
      case 'admin':
        return { read: true, update: true, delete: true };
      default:
        throw `${group} is not a default group`;
    }
  }

  async clone(existingApp: App, user: User, appName: string): Promise<App> {
    const appWithRelations = await this.appImportExportService.export(user, existingApp.id);
    const clonedApp = await this.appImportExportService.import(user, appWithRelations, appName);

    return clonedApp;
  }

  async count(user: User, searchKey): Promise<number> {
    return await viewableAppsQuery(user, searchKey).getCount();
  }

  getAppVersionsCount = async (appId: string) => {
    return await this.appVersionsRepository.count({
      where: { appId },
    });
  };

  async all(user: User, page: number, searchKey: string): Promise<AppBase[]> {
    const viewableAppsQb = viewableAppsQuery(user, searchKey);

    if (page) {
      return await viewableAppsQb
        .take(9)
        .skip(9 * (page - 1))
        .getMany();
    }

    return await viewableAppsQb.getMany();
  }

  async update(appId: string, appUpdateDto: AppUpdateDto, manager?: EntityManager) {
    const currentVersionId = appUpdateDto.current_version_id;
    const isPublic = appUpdateDto.is_public;
    const isMaintenanceOn = appUpdateDto.is_maintenance_on;
    const { name, slug, icon } = appUpdateDto;

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
        const currentEnvironment: AppEnvironment = await manager
          .createQueryBuilder(AppEnvironment, 'app_environments')
          .select(['app_environments.id', 'app_environments.isDefault'])
          .innerJoinAndSelect(
            'app_versions',
            'app_versions',
            'app_versions.current_environment_id = app_environments.id'
          )
          .where('app_versions.id = :currentVersionId', {
            currentVersionId,
          })
          .getOne();

        if (!currentEnvironment?.isDefault) {
          throw new BadRequestException('You can only release when the version is promoted to production');
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

  async delete(appId: string) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(App, { id: appId });
    });
    return;
  }

  async fetchUsers(appId: string): Promise<AppUser[]> {
    const appUsers = await this.appUsersRepository.find({
      where: { appId },
      relations: ['user'],
    });

    // serialize
    const serializedUsers = [];
    for (const appUser of appUsers) {
      serializedUsers.push({
        email: appUser.user.email,
        firstName: appUser.user.firstName,
        lastName: appUser.user.lastName,
        name: `${appUser.user.firstName} ${appUser.user.lastName}`,
        id: appUser.id,
        role: appUser.role,
      });
    }

    return serializedUsers;
  }

  async fetchVersions(user: any, appId: string): Promise<AppVersion[]> {
    return await this.appVersionsRepository.find({
      where: { appId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createVersion(
    user: User,
    app: App,
    versionName: string,
    versionFromId: string,
    environmentId: string,
    manager?: EntityManager
  ): Promise<AppVersion> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let versionFrom: AppVersion;
      const { organizationId } = user;
      if (versionFromId) {
        versionFrom = await manager.findOneOrFail(AppVersion, {
          where: { id: versionFromId },
          relations: ['dataSources', 'dataSources.dataQueries', 'dataSources.dataSourceOptions'],
        });

        if (defaultAppEnvironments.length > 1) {
          const environmentWhereUserCreatingVersion = await this.appEnvironmentService.get(
            app.organizationId,
            environmentId,
            false,
            manager
          );

          //check if the user is creating version from development environment only
          if (environmentWhereUserCreatingVersion.priority !== 1) {
            throw new BadRequestException('New versions can only be created in development environment');
          }
        }
      }

      const noOfVersions = await manager.count(AppVersion, { where: { appId: app?.id } });

      if (noOfVersions && !versionFrom) {
        throw new BadRequestException('Version from should not be empty');
      }

      const versionNameExists = await manager.findOne(AppVersion, {
        where: { name: versionName, appId: app.id },
      });

      if (versionNameExists) {
        throw new BadRequestException('Version name already exists.');
      }

      const firstPriorityEnv = await this.appEnvironmentService.get(organizationId, null, true, manager);

      const appVersion = await manager.save(
        AppVersion,
        manager.create(AppVersion, {
          name: versionName,
          appId: app.id,
          definition: versionFrom?.definition,
          currentEnvironmentId: firstPriorityEnv?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      if (versionFrom) {
        (appVersion.showViewerNavigation = versionFrom.showViewerNavigation),
          (appVersion.globalSettings = versionFrom.globalSettings),
          await manager.save(appVersion);

        const oldDataQueryToNewMapping = await this.createNewDataSourcesAndQueriesForVersion(
          manager,
          appVersion,
          versionFrom,
          organizationId
        );

        const { oldComponentToNewComponentMapping, oldPageToNewPageMapping } =
          await this.createNewPagesAndComponentsForVersion(manager, appVersion, versionFrom.id, versionFrom.homePageId);

        await this.updateEventActionsForNewVersionWithNewMappingIds(
          manager,
          appVersion.id,
          oldDataQueryToNewMapping,
          oldComponentToNewComponentMapping,
          oldPageToNewPageMapping
        );
      }

      return appVersion;
    }, manager);
  }

  async updateEventActionsForNewVersionWithNewMappingIds(
    manager: EntityManager,
    versionId: string,
    oldDataQueryToNewMapping: Record<string, unknown>,
    oldComponentToNewComponentMapping: Record<string, unknown>,
    oldPageToNewPageMapping: Record<string, unknown>
  ) {
    const allEvents = await manager.find(EventHandler, {
      where: { appVersionId: versionId },
    });

    for (const event of allEvents) {
      const eventDefinition = event.event;

      if (eventDefinition?.actionId === 'run-query') {
        eventDefinition.queryId = oldDataQueryToNewMapping[eventDefinition.queryId];
      }

      if (eventDefinition?.actionId === 'control-component') {
        eventDefinition.componentId = oldComponentToNewComponentMapping[eventDefinition.componentId];
      }

      if (eventDefinition?.actionId === 'switch-page') {
        eventDefinition.pageId = oldPageToNewPageMapping[eventDefinition.pageId];
      }

      if (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'close-modal') {
        eventDefinition.modal = oldComponentToNewComponentMapping[eventDefinition.modal];
      }

      event.event = eventDefinition;

      await manager.save(event);
    }
  }

  async createNewPagesAndComponentsForVersion(
    manager: EntityManager,
    appVersion: AppVersion,
    versionFromId: string,
    prevHomePagePage: string
  ) {
    const pages = await manager
      .createQueryBuilder(Page, 'page')
      .leftJoinAndSelect('page.components', 'component')
      .leftJoinAndSelect('component.layouts', 'layout')
      .where('page.appVersionId = :appVersionId', { appVersionId: versionFromId })
      .getMany();

    const allEvents = await manager.find(EventHandler, {
      where: { appVersionId: versionFromId },
    });

    let homePageId = prevHomePagePage;

    const newComponents = [];
    const newComponentLayouts = [];
    const oldComponentToNewComponentMapping = {};
    const oldPageToNewPageMapping = {};

    const isChildOfTabsOrCalendar = (component, allComponents = [], componentParentId = undefined) => {
      if (componentParentId) {
        const parentId = component?.parent?.split('-').slice(0, -1).join('-');

        const parentComponent = allComponents.find((comp) => comp.id === parentId);

        if (parentComponent) {
          return parentComponent.type === 'Tabs' || parentComponent.type === 'Calendar';
        }
      }

      return false;
    };

    const isChildOfKanbanModal = (componentParentId: string, allComponents = []) => {
      if (!componentParentId.includes('modal')) return false;

      if (componentParentId) {
        const parentId = componentParentId.split('-').slice(0, -1).join('-');
        const isParentKandban = allComponents.find((comp) => comp.id === parentId)?.type === 'Kanban';

        return isParentKandban;
      }
    };

    for (const page of pages) {
      const savedPage = await manager.save(
        manager.create(Page, {
          name: page.name,
          handle: page.handle,
          index: page.index,
          disabled: page.disabled,
          hidden: page.hidden,
          appVersionId: appVersion.id,
        })
      );
      oldPageToNewPageMapping[page.id] = savedPage.id;
      if (page.id === prevHomePagePage) {
        homePageId = savedPage.id;
      }

      const pageEvents = allEvents.filter((event) => event.sourceId === page.id);

      pageEvents.forEach(async (event, index) => {
        const newEvent = new EventHandler();

        newEvent.id = uuid.v4();
        newEvent.name = event.name;
        newEvent.sourceId = savedPage.id;
        newEvent.target = event.target;
        newEvent.event = event.event;
        newEvent.index = event.index ?? index;
        newEvent.appVersionId = appVersion.id;

        await manager.save(newEvent);
      });

      page.components.forEach(async (component) => {
        const newComponent = new Component();
        const componentEvents = allEvents.filter((event) => event.sourceId === component.id);

        newComponent.id = uuid.v4();

        oldComponentToNewComponentMapping[component.id] = newComponent.id;

        newComponent.name = component.name;
        newComponent.type = component.type;
        newComponent.pageId = savedPage.id;
        newComponent.properties = component.properties;
        newComponent.styles = component.styles;
        newComponent.validation = component.validation;
        newComponent.general = component.general;
        newComponent.generalStyles = component.generalStyles;
        newComponent.displayPreferences = component.displayPreferences;
        newComponent.parent = component.parent;
        newComponent.page = savedPage;

        newComponents.push(newComponent);

        component.layouts.forEach((layout) => {
          const newLayout = new Layout();
          newLayout.id = uuid.v4();
          newLayout.type = layout.type;
          newLayout.top = layout.top;
          newLayout.left = layout.left;
          newLayout.width = layout.width;
          newLayout.height = layout.height;
          newLayout.componentId = layout.componentId;

          newLayout.component = newComponent;

          newComponentLayouts.push(newLayout);
        });

        componentEvents.forEach(async (event, index) => {
          const newEvent = new EventHandler();

          newEvent.id = uuid.v4();
          newEvent.name = event.name;
          newEvent.sourceId = newComponent.id;
          newEvent.target = event.target;
          newEvent.event = event.event;
          newEvent.index = event.index ?? index;
          newEvent.appVersionId = appVersion.id;

          await manager.save(newEvent);
        });
      });

      newComponents.forEach((component) => {
        let parentId = component.parent ? component.parent : null;

        if (!parentId) return;

        const isParentTabOrCalendar = isChildOfTabsOrCalendar(component, page.components, parentId);

        if (isParentTabOrCalendar) {
          const childTabId = component.parent.split('-')[component.parent.split('-').length - 1];
          const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
          const mappedParentId = oldComponentToNewComponentMapping[_parentId];

          parentId = `${mappedParentId}-${childTabId}`;
        } else if (isChildOfKanbanModal(component.parent, page.components)) {
          const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
          const mappedParentId = oldComponentToNewComponentMapping[_parentId];

          parentId = `${mappedParentId}-modal`;
        } else {
          parentId = oldComponentToNewComponentMapping[parentId];
        }

        component.parent = parentId;
      });

      await manager.save(newComponents);
      await manager.save(newComponentLayouts);
    }

    await manager.update(AppVersion, { id: appVersion.id }, { homePageId });

    return { oldComponentToNewComponentMapping, oldPageToNewPageMapping };
  }

  async deleteVersion(app: App, version: AppVersion): Promise<void> {
    if (app.currentVersionId === version.id) {
      throw new BadRequestException('You cannot delete a released version');
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(AppVersion, {
        id: version.id,
        appId: app.id,
      });
    });
  }

  async createNewDataSourcesAndQueriesForVersion(
    manager: EntityManager,
    appVersion: AppVersion,
    versionFrom: AppVersion,
    organizationId: string
  ) {
    const oldDataQueryToNewMapping = {};

    let appEnvironments: AppEnvironment[] = await this.appEnvironmentService.getAll(organizationId, manager);

    if (!appEnvironments?.length) {
      await this.createEnvironments(defaultAppEnvironments, manager, organizationId);
      appEnvironments = await this.appEnvironmentService.getAll(organizationId, manager);
    }

    if (!versionFrom) {
      //create default data sources
      for (const defaultSource of ['restapi', 'runjs', 'tooljetdb']) {
        const dataSource = await this.dataSourcesService.createDefaultDataSource(
          defaultSource,
          appVersion.id,
          null,
          manager
        );
        await this.appEnvironmentService.createDataSourceInAllEnvironments(organizationId, dataSource.id, manager);
      }
    } else {
      const globalQueries: DataQuery[] = await manager
        .createQueryBuilder(DataQuery, 'data_query')
        .leftJoinAndSelect('data_query.dataSource', 'dataSource')
        .where('data_query.appVersionId = :appVersionId', { appVersionId: versionFrom?.id })
        .andWhere('dataSource.scope = :scope', { scope: DataSourceScopes.GLOBAL })
        .getMany();
      const dataSources = versionFrom?.dataSources; //Local data sources
      const globalDataSources = [...new Map(globalQueries.map((gq) => [gq.dataSource.id, gq.dataSource])).values()];

      const dataSourceMapping = {};
      const newDataQueries = [];
      const allEvents = await manager.find(EventHandler, {
        where: { appVersionId: versionFrom?.id, target: 'data_query' },
      });

      if (dataSources?.length > 0 || globalDataSources?.length > 0) {
        if (dataSources?.length > 0) {
          for (const dataSource of dataSources) {
            const dataSourceParams: Partial<DataSource> = {
              name: dataSource.name,
              kind: dataSource.kind,
              type: dataSource.type,
              appVersionId: appVersion.id,
            };
            const newDataSource = await manager.save(manager.create(DataSource, dataSourceParams));
            dataSourceMapping[dataSource.id] = newDataSource.id;

            const dataQueries = versionFrom?.dataSources?.find((ds) => ds.id === dataSource.id).dataQueries;

            for (const dataQuery of dataQueries) {
              const dataQueryParams = {
                name: dataQuery.name,
                options: dataQuery.options,
                dataSourceId: newDataSource.id,
                appVersionId: appVersion.id,
              };
              const newQuery = await manager.save(manager.create(DataQuery, dataQueryParams));

              const dataQueryEvents = allEvents.filter((event) => event.sourceId === dataQuery.id);

              dataQueryEvents.forEach(async (event, index) => {
                const newEvent = new EventHandler();

                newEvent.id = uuid.v4();
                newEvent.name = event.name;
                newEvent.sourceId = newQuery.id;
                newEvent.target = event.target;
                newEvent.event = event.event;
                newEvent.index = event.index ?? index;
                newEvent.appVersionId = appVersion.id;

                await manager.save(newEvent);
              });

              oldDataQueryToNewMapping[dataQuery.id] = newQuery.id;
              newDataQueries.push(newQuery);
            }
          }
        }

        if (globalQueries?.length > 0) {
          for (const globalQuery of globalQueries) {
            const dataQueryParams = {
              name: globalQuery.name,
              options: globalQuery.options,
              dataSourceId: globalQuery.dataSourceId,
              appVersionId: appVersion.id,
            };

            const newQuery = await manager.save(manager.create(DataQuery, dataQueryParams));
            const dataQueryEvents = allEvents.filter((event) => event.sourceId === globalQuery.id);

            dataQueryEvents.forEach(async (event, index) => {
              const newEvent = new EventHandler();

              newEvent.id = uuid.v4();
              newEvent.name = event.name;
              newEvent.sourceId = newQuery.id;
              newEvent.target = event.target;
              newEvent.event = event.event;
              newEvent.index = event.index ?? index;
              newEvent.appVersionId = appVersion.id;

              await manager.save(newEvent);
            });
            oldDataQueryToNewMapping[globalQuery.id] = newQuery.id;
            newDataQueries.push(newQuery);
          }
        }

        for (const newQuery of newDataQueries) {
          const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(
            newQuery.options,
            oldDataQueryToNewMapping
          );
          newQuery.options = newOptions;

          await manager.save(newQuery);
        }

        appVersion.definition = this.replaceDataQueryIdWithinDefinitions(
          appVersion.definition,
          oldDataQueryToNewMapping
        );
        await manager.save(appVersion);

        for (const appEnvironment of appEnvironments) {
          for (const dataSource of dataSources) {
            const dataSourceOption = await manager.findOneOrFail(DataSourceOptions, {
              where: { dataSourceId: dataSource.id, environmentId: appEnvironment.id },
            });

            const convertedOptions = this.convertToArrayOfKeyValuePairs(dataSourceOption.options);
            const newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, false, manager);
            await this.setNewCredentialValueFromOldValue(newOptions, convertedOptions, manager);

            await manager.save(
              manager.create(DataSourceOptions, {
                options: newOptions,
                dataSourceId: dataSourceMapping[dataSource.id],
                environmentId: appEnvironment.id,
              })
            );
          }
        }
      }
    }

    return oldDataQueryToNewMapping;
  }

  private async createEnvironments(appEnvironments: any[], manager: EntityManager, organizationId: string) {
    for (const appEnvironment of appEnvironments) {
      await this.appEnvironmentService.create(
        organizationId,
        appEnvironment.name,
        appEnvironment.isDefault,
        appEnvironment.priority,
        manager
      );
    }
  }

  replaceDataQueryOptionsWithNewDataQueryIds(options, dataQueryMapping) {
    if (options && options.events) {
      const replacedEvents = options.events.map((event) => {
        if (event.queryId) {
          event.queryId = dataQueryMapping[event.queryId];
        }
        return event;
      });
      options.events = replacedEvents;
    }
    return options;
  }

  replaceDataQueryIdWithinDefinitions(definition, dataQueryMapping) {
    if (definition?.pages) {
      for (const pageId of Object.keys(definition?.pages)) {
        if (definition.pages[pageId].events) {
          const replacedPageEvents = definition.pages[pageId].events.map((event) => {
            if (event.queryId) {
              event.queryId = dataQueryMapping[event.queryId];
            }
            return event;
          });
          definition.pages[pageId].events = replacedPageEvents;
        }
        if (definition.pages[pageId].components) {
          for (const id of Object.keys(definition.pages[pageId].components)) {
            const component = definition.pages[pageId].components[id].component;

            if (component?.definition?.events) {
              const replacedComponentEvents = component.definition.events.map((event) => {
                if (event.queryId) {
                  event.queryId = dataQueryMapping[event.queryId];
                }
                return event;
              });
              component.definition.events = replacedComponentEvents;
            }

            if (component?.definition?.properties?.actions?.value) {
              for (const value of component.definition.properties.actions.value) {
                if (value?.events) {
                  const replacedComponentActionEvents = value.events.map((event) => {
                    if (event.queryId) {
                      event.queryId = dataQueryMapping[event.queryId];
                    }
                    return event;
                  });
                  value.events = replacedComponentActionEvents;
                }
              }
            }

            if (component?.component === 'Table') {
              for (const column of component?.definition?.properties?.columns?.value ?? []) {
                if (column?.events) {
                  const replacedComponentActionEvents = column.events.map((event) => {
                    if (event.queryId) {
                      event.queryId = dataQueryMapping[event.queryId];
                    }
                    return event;
                  });
                  column.events = replacedComponentActionEvents;
                }
              }
            }

            definition.pages[pageId].components[id].component = component;
          }
        }
      }
    }
    return definition;
  }

  async setNewCredentialValueFromOldValue(newOptions: any, oldOptions: any, manager: EntityManager) {
    const newOptionsWithCredentials = this.convertToArrayOfKeyValuePairs(newOptions).filter((opt) => opt['encrypted']);

    for (const newOption of newOptionsWithCredentials) {
      const oldOption = oldOptions.find((oldOption) => oldOption['key'] == newOption['key']);
      const oldCredential = await manager.findOne(Credential, {
        where: { id: oldOption.credential_id },
      });
      const newCredential = await manager.findOne(Credential, {
        where: { id: newOption['credential_id'] },
      });
      newCredential.valueCiphertext = oldCredential.valueCiphertext;

      await manager.save(newCredential);
    }
  }

  async updateVersion(version: AppVersion, body: VersionEditDto, organizationId: string) {
    const { name, currentEnvironmentId, definition } = body;
    let currentEnvironment: AppEnvironment;

    if (version.id === version.app.currentVersionId && !body?.is_user_switched_version)
      throw new BadRequestException('You cannot update a released version');

    if (currentEnvironmentId || definition) {
      currentEnvironment = await AppEnvironment.findOne({
        where: { id: version.currentEnvironmentId },
      });
    }

    const editableParams = {};
    if (name) {
      //means user is trying to update the name
      const versionNameExists = await this.appVersionsRepository.findOne({
        where: { name, appId: version.appId },
      });

      if (versionNameExists) {
        throw new BadRequestException('Version name already exists.');
      }
      editableParams['name'] = name;
    }

    //check if the user is trying to promote the environment & raise an error if the currentEnvironmentId is not correct
    if (currentEnvironmentId) {
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
      if (editableParams['definition'] && environments > 1 && currentEnvironment.priority !== 1) {
        throw new BadRequestException('You cannot update a promoted version');
      }
      editableParams['definition'] = definition;
    }

    editableParams['updatedAt'] = new Date();

    return await this.appVersionsRepository.update(version.id, editableParams);
  }

  async updateAppVersion(version: AppVersion, body: AppVersionUpdateDto) {
    const editableParams = {};

    const { globalSettings, homePageId } = await this.appVersionsRepository.findOne({
      where: { id: version.id },
    });

    if (body?.homePageId && homePageId !== body.homePageId) {
      editableParams['homePageId'] = body.homePageId;
    }

    if (body?.globalSettings) {
      editableParams['globalSettings'] = {
        ...globalSettings,
        ...body.globalSettings,
      };
    }

    if (typeof body?.showViewerNavigation === 'boolean') {
      editableParams['showViewerNavigation'] = body.showViewerNavigation;
    }

    return await this.appVersionsRepository.update(version.id, editableParams);
  }

  convertToArrayOfKeyValuePairs(options): Array<object> {
    if (!options) return;
    return Object.keys(options).map((key) => {
      return {
        key: key,
        value: options[key]['value'],
        encrypted: options[key]['encrypted'],
        credential_id: options[key]['credential_id'],
      };
    });
  }

  async findAppWithIdOrSlug(slug: string): Promise<App> {
    let app: App;
    try {
      app = await this.find(slug);
    } catch (error) {
      /* means: UUID error. so the slug isn't not the id of the app */
      if (error?.code === `22P02`) {
        /* Search against slug */
        app = await this.findBySlug(slug);
      }
    }

    if (!app) throw new NotFoundException('App not found. Invalid app id');
    return app;
  }

  async findTooljetDbTables(appId: string): Promise<{ table_id: string }[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const tooljetDbDataQueries = await manager
        .createQueryBuilder(DataQuery, 'data_queries')
        .innerJoin(DataSource, 'data_sources', 'data_queries.data_source_id = data_sources.id')
        .innerJoin(AppVersion, 'app_versions', 'app_versions.id = data_sources.app_version_id')
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
}
