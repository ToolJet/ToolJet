import { BadRequestException, Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { App } from 'src/entities/app.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { DataSourcesService } from './data_sources.service';
import {
  dbTransactionWrap,
  defaultAppEnvironments,
  catchDbException,
  extractMajorVersion,
  isTooljetVersionWithNormalizedAppDefinitionSchem,
  isVersionGreaterThanOrEqual,
} from 'src/helpers/utils.helper';
import { AppEnvironmentService } from './app_environments.service';
import { convertAppDefinitionFromSinglePageToMultiPage } from '../../lib/single-page-to-and-from-multipage-definition-conversion';
import { DataSourceScopes, DataSourceTypes } from 'src/helpers/data_source.constants';
import { Organization } from 'src/entities/organization.entity';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Plugin } from 'src/entities/plugin.entity';
import { Page } from 'src/entities/page.entity';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { EventHandler, Target } from 'src/entities/event_handler.entity';
import { v4 as uuid } from 'uuid';

interface AppResourceMappings {
  defaultDataSourceIdMapping: Record<string, string>;
  dataQueryMapping: Record<string, string>;
  appVersionMapping: Record<string, string>;
  appEnvironmentMapping: Record<string, string>;
  appDefaultEnvironmentMapping: Record<string, string[]>;
  pagesMapping: Record<string, string>;
  componentsMapping: Record<string, string>;
}

type DefaultDataSourceKind = 'restapi' | 'runjs' | 'runpy' | 'tooljetdb' | 'workflows';
type DefaultDataSourceName =
  | 'restapidefault'
  | 'runjsdefault'
  | 'runpydefault'
  | 'tooljetdbdefault'
  | 'workflowsdefault';

type NewRevampedComponent = 'Text' | 'TextInput' | 'PasswordInput' | 'NumberInput';

const DefaultDataSourceNames: DefaultDataSourceName[] = [
  'restapidefault',
  'runjsdefault',
  'runpydefault',
  'tooljetdbdefault',
  'workflowsdefault',
];
const DefaultDataSourceKinds: DefaultDataSourceKind[] = ['restapi', 'runjs', 'runpy', 'tooljetdb', 'workflows'];
const NewRevampedComponents: NewRevampedComponent[] = ['Text', 'TextInput', 'PasswordInput', 'NumberInput'];

@Injectable()
export class AppImportExportService {
  constructor(
    private dataSourcesService: DataSourcesService,
    private appEnvironmentService: AppEnvironmentService,
    private readonly entityManager: EntityManager
  ) {}

  async export(user: User, id: string, searchParams: any = {}): Promise<{ appV2: App }> {
    // https://github.com/typeorm/typeorm/issues/3857
    // Making use of query builder
    // filter by search params
    const versionId = searchParams?.version_id;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queryForAppToExport = manager
        .createQueryBuilder(App, 'apps')
        .where('apps.id = :id AND apps.organization_id = :organizationId', {
          id,
          organizationId: user.organizationId,
        });
      const appToExport = await queryForAppToExport.getOne();

      const queryAppVersions = manager
        .createQueryBuilder(AppVersion, 'app_versions')
        .where('app_versions.appId = :appId', {
          appId: appToExport.id,
        });

      if (versionId) {
        queryAppVersions.andWhere('app_versions.id = :versionId', { versionId });
      }
      const appVersions = await queryAppVersions.orderBy('app_versions.created_at', 'ASC').getMany();

      const legacyLocalDataSources =
        appVersions?.length &&
        (await manager
          .createQueryBuilder(DataSource, 'data_sources')
          .where('data_sources.appVersionId IN(:...versionId)', {
            versionId: appVersions.map((v) => v.id),
          })
          .andWhere('data_sources.scope != :scope', { scope: DataSourceScopes.GLOBAL })
          .orderBy('data_sources.created_at', 'ASC')
          .getMany());

      const appEnvironments = await manager
        .createQueryBuilder(AppEnvironment, 'app_environments')
        .where('app_environments.organizationId = :organizationId', {
          organizationId: user.organizationId,
        })
        .orderBy('app_environments.createdAt', 'ASC')
        .getMany();

      let dataQueries: DataQuery[] = [];
      let dataSourceOptions: DataSourceOptions[] = [];

      const globalQueries: DataQuery[] = await manager
        .createQueryBuilder(DataQuery, 'data_query')
        .innerJoinAndSelect('data_query.dataSource', 'dataSource')
        .where('data_query.appVersionId IN(:...versionId)', {
          versionId: appVersions.map((v) => v.id),
        })
        .andWhere('dataSource.scope = :scope', { scope: DataSourceScopes.GLOBAL })
        .getMany();

      const globalDataSources = [...new Map(globalQueries.map((gq) => [gq.dataSource.id, gq.dataSource])).values()];

      const dataSources = [...legacyLocalDataSources, ...globalDataSources];

      if (dataSources?.length) {
        dataQueries = await manager
          .createQueryBuilder(DataQuery, 'data_queries')
          .where('data_queries.dataSourceId IN(:...dataSourceId)', {
            dataSourceId: dataSources?.map((v) => v.id),
          })
          .andWhere('data_queries.appVersionId IN(:...versionId)', {
            versionId: appVersions.map((v) => v.id),
          })
          .orderBy('data_queries.created_at', 'ASC')
          .getMany();

        dataSourceOptions = await manager
          .createQueryBuilder(DataSourceOptions, 'data_source_options')
          .where(
            'data_source_options.environmentId IN(:...environmentId) AND data_source_options.dataSourceId IN(:...dataSourceId)',
            {
              environmentId: appEnvironments.map((v) => v.id),
              dataSourceId: dataSources.map((v) => v.id),
            }
          )
          .orderBy('data_source_options.createdAt', 'ASC')
          .getMany();

        dataSourceOptions?.forEach((dso) => {
          delete dso?.options?.tokenData;
        });
      }

      const pages = await manager
        .createQueryBuilder(Page, 'pages')
        .where('pages.appVersionId IN(:...versionId)', {
          versionId: appVersions.map((v) => v.id),
        })
        .orderBy('pages.created_at', 'ASC')
        .getMany();

      const components =
        pages.length > 0
          ? await manager
              .createQueryBuilder(Component, 'components')
              .leftJoinAndSelect('components.layouts', 'layouts')
              .where('components.pageId IN(:...pageId)', {
                pageId: pages.map((v) => v.id),
              })
              .orderBy('components.created_at', 'ASC')
              .getMany()
          : [];

      const events = await manager
        .createQueryBuilder(EventHandler, 'event_handlers')
        .where('event_handlers.appVersionId IN(:...versionId)', {
          versionId: appVersions.map((v) => v.id),
        })
        .orderBy('event_handlers.created_at', 'ASC')
        .getMany();

      appToExport['components'] = components;
      appToExport['pages'] = pages;
      appToExport['events'] = events;
      appToExport['dataQueries'] = dataQueries;
      appToExport['dataSources'] = dataSources;
      appToExport['appVersions'] = appVersions;
      appToExport['appEnvironments'] = appEnvironments;
      appToExport['dataSourceOptions'] = dataSourceOptions;
      appToExport['schemaDetails'] = {
        multiPages: true,
        multiEnv: true,
        globalDataSources: true,
      };

      return { appV2: appToExport };
    });
  }

  async import(
    user: User,
    appParamsObj: any,
    appName: string,
    externalResourceMappings = {},
    tooljetVersion = '',
    cloning = false
  ): Promise<App> {
    if (typeof appParamsObj !== 'object') {
      throw new BadRequestException('Invalid params for app import');
    }

    let appParams = appParamsObj;

    if (appParams?.appV2) {
      appParams = { ...appParams.appV2 };
    }

    if (!appParams?.name) {
      throw new BadRequestException('Invalid params for app import');
    }

    const schemaUnifiedAppParams = appParams?.schemaDetails?.multiPages
      ? appParams
      : convertSinglePageSchemaToMultiPageSchema(appParams);
    schemaUnifiedAppParams.name = appName;

    const importedAppTooljetVersion = !cloning && extractMajorVersion(tooljetVersion);
    const isNormalizedAppDefinitionSchema = cloning
      ? true
      : isTooljetVersionWithNormalizedAppDefinitionSchem(importedAppTooljetVersion);

    const importedApp = await this.createImportedAppForUser(this.entityManager, schemaUnifiedAppParams, user);
    const currentTooljetVersion = !cloning ? tooljetVersion : null;

    await this.setupImportedAppAssociations(
      this.entityManager,
      importedApp,
      schemaUnifiedAppParams,
      user,
      externalResourceMappings,
      isNormalizedAppDefinitionSchema,
      currentTooljetVersion
    );
    await this.createAdminGroupPermissions(this.entityManager, importedApp);

    // NOTE: App slug updation callback doesn't work while wrapped in transaction
    // hence updating slug explicitly
    await importedApp.reload();
    importedApp.slug = importedApp.id;
    await this.entityManager.save(importedApp);

    return importedApp;
  }

  async createImportedAppForUser(manager: EntityManager, appParams: any, user: User): Promise<App> {
    return await catchDbException(async () => {
      const importedApp = manager.create(App, {
        name: appParams.name,
        organizationId: user.organizationId,
        userId: user.id,
        slug: null,
        icon: appParams.icon,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await manager.save(importedApp);
      return importedApp;
    }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'This app name is already taken.' }]);
  }

  extractImportDataFromAppParams(appParams: Record<string, any>): {
    importingDataSources: DataSource[];
    importingDataQueries: DataQuery[];
    importingAppVersions: AppVersion[];
    importingAppEnvironments: AppEnvironment[];
    importingDataSourceOptions: DataSourceOptions[];
    importingDefaultAppEnvironmentId: string;
    importingPages: Page[];
    importingComponents: Component[];
    importingEvents: EventHandler[];
  } {
    const importingDataSources = appParams?.dataSources || [];
    const importingDataQueries = appParams?.dataQueries || [];
    const importingAppVersions = appParams?.appVersions || [];
    const importingAppEnvironments = appParams?.appEnvironments || [];
    const importingDataSourceOptions = appParams?.dataSourceOptions || [];
    const importingDefaultAppEnvironmentId = importingAppEnvironments.find(
      (env: { isDefault: any }) => env.isDefault
    )?.id;

    const importingPages = appParams?.pages || [];
    const importingComponents = appParams?.components || [];
    const importingEvents = appParams?.events || [];

    return {
      importingDataSources,
      importingDataQueries,
      importingAppVersions,
      importingAppEnvironments,
      importingDataSourceOptions,
      importingDefaultAppEnvironmentId,
      importingPages,
      importingComponents,
      importingEvents,
    };
  }

  /*
   * With new multi-env changes. the imported apps will not have any released versions from now (if the importing schema has any currentVersionId).
   * All version's default environment will be development or least priority environment only.
   */
  async setupImportedAppAssociations(
    manager: EntityManager,
    importedApp: App,
    appParams: any,
    user: User,
    externalResourceMappings: Record<string, unknown>,
    isNormalizedAppDefinitionSchema: boolean,
    tooljetVersion: string | null
  ) {
    // Old version without app version
    // Handle exports prior to 0.12.0
    // TODO: have version based conditional based on app versions
    // isLessThanExportVersion(appParams.tooljet_version, 'v0.12.0')
    if (!appParams?.appVersions) {
      await this.performLegacyAppImport(manager, importedApp, appParams, externalResourceMappings, user);
      return;
    }

    let appResourceMappings: AppResourceMappings = {
      defaultDataSourceIdMapping: {},
      dataQueryMapping: {},
      appVersionMapping: {},
      appEnvironmentMapping: {},
      appDefaultEnvironmentMapping: {},
      pagesMapping: {},
      componentsMapping: {},
    };
    const {
      importingDataSources,
      importingDataQueries,
      importingAppVersions,
      importingAppEnvironments,
      importingDataSourceOptions,
      importingDefaultAppEnvironmentId,
      importingPages,
      importingComponents,
      importingEvents,
    } = this.extractImportDataFromAppParams(appParams);

    const { appDefaultEnvironmentMapping, appVersionMapping } = await this.createAppVersionsForImportedApp(
      manager,
      user,
      importedApp,
      importingAppVersions,
      appResourceMappings,
      isNormalizedAppDefinitionSchema
    );
    appResourceMappings.appDefaultEnvironmentMapping = appDefaultEnvironmentMapping;
    appResourceMappings.appVersionMapping = appVersionMapping;

    /**
     * as multiple operations are run within a single transaction using  the transaction method provides a convenient way to handle transactions.
     *  The transaction will automatically committed when the function completes without throwing an error.
     * If an error occurs during the function execution, the transaction will rolled back.
     */

    await manager.transaction(async (transactionalEntityManager) => {
      appResourceMappings = await this.setupAppVersionAssociations(
        transactionalEntityManager,
        importingAppVersions,
        user,
        appResourceMappings,
        externalResourceMappings,
        importingAppEnvironments,
        importingDataSources,
        importingDataSourceOptions,
        importingDataQueries,
        importingDefaultAppEnvironmentId,
        importingPages,
        importingComponents,
        importingEvents,
        tooljetVersion
      );

      if (!isNormalizedAppDefinitionSchema) {
        for (const importingAppVersion of importingAppVersions) {
          const updatedDefinition = this.replaceDataQueryIdWithinDefinitions(
            importingAppVersion.definition,
            appResourceMappings.dataQueryMapping
          );

          let updateHomepageId = null;

          if (updatedDefinition?.pages) {
            for (const pageId of Object.keys(updatedDefinition?.pages)) {
              const page = updatedDefinition.pages[pageId];

              const pageEvents = page.events || [];
              const componentEvents = [];

              const pagePostionIntheList = Object.keys(updatedDefinition?.pages).indexOf(pageId);

              const isHompage = (updatedDefinition['homePageId'] as any) === pageId;

              const pageComponents = page.components;

              const mappedComponents = transformComponentData(
                pageComponents,
                componentEvents,
                appResourceMappings.componentsMapping,
                isNormalizedAppDefinitionSchema,
                tooljetVersion
              );

              const componentLayouts = [];

              const newPage = transactionalEntityManager.create(Page, {
                name: page.name,
                handle: page.handle,
                appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                index: pagePostionIntheList,
                disabled: page.disabled || false,
                hidden: page.hidden || false,
              });
              const pageCreated = await transactionalEntityManager.save(newPage);

              appResourceMappings.pagesMapping[pageId] = pageCreated.id;

              mappedComponents.forEach((component) => {
                component.page = pageCreated;
              });

              const savedComponents = await transactionalEntityManager.save(Component, mappedComponents);

              for (const componentId in pageComponents) {
                const componentLayout = pageComponents[componentId]['layouts'];

                if (componentLayout && appResourceMappings.componentsMapping[componentId]) {
                  for (const type in componentLayout) {
                    const layout = componentLayout[type];
                    const newLayout = new Layout();
                    newLayout.type = type;
                    newLayout.top = layout.top;
                    newLayout.left = layout.left;
                    newLayout.width = layout.width;
                    newLayout.height = layout.height;
                    newLayout.componentId = appResourceMappings.componentsMapping[componentId];

                    componentLayouts.push(newLayout);
                  }
                }
              }

              await transactionalEntityManager.save(Layout, componentLayouts);

              //Event handlers

              if (pageEvents.length > 0) {
                pageEvents.forEach(async (event, index) => {
                  const newEvent = {
                    name: event.eventId,
                    sourceId: pageCreated.id,
                    target: Target.page,
                    event: event,
                    index: pageEvents.index || index,
                    appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                  };

                  await transactionalEntityManager.save(EventHandler, newEvent);
                });
              }

              componentEvents.forEach((eventObj) => {
                if (eventObj.event?.length === 0) return;

                eventObj.event.forEach(async (event, index) => {
                  const newEvent = transactionalEntityManager.create(EventHandler, {
                    name: event.eventId,
                    sourceId: appResourceMappings.componentsMapping[eventObj.componentId],
                    target: Target.component,
                    event: event,
                    index: eventObj.index || index,
                    appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                  });

                  await transactionalEntityManager.save(EventHandler, newEvent);
                });
              });

              savedComponents.forEach(async (component) => {
                if (component.type === 'Table') {
                  const tableActions = component.properties?.actions?.value || [];
                  const tableColumns = component.properties?.columns?.value || [];

                  const tableActionAndColumnEvents = [];

                  tableActions.forEach((action) => {
                    const actionEvents = action.events || [];

                    actionEvents.forEach((event, index) => {
                      tableActionAndColumnEvents.push({
                        name: event.eventId,
                        sourceId: component.id,
                        target: Target.tableAction,
                        event: { ...event, ref: action.name },
                        index: event.index ?? index,
                        appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                      });
                    });
                  });

                  tableColumns.forEach((column) => {
                    if (column?.columnType !== 'toggle') return;
                    const columnEvents = column.events || [];

                    columnEvents.forEach((event, index) => {
                      tableActionAndColumnEvents.push({
                        name: event.eventId,
                        sourceId: component.id,
                        target: Target.tableColumn,
                        event: { ...event, ref: column.name },
                        index: event.index ?? index,
                        appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                      });
                    });
                  });

                  await transactionalEntityManager.save(EventHandler, tableActionAndColumnEvents);
                }
              });

              if (isHompage) {
                updateHomepageId = pageCreated.id;
              }
            }
          }

          await transactionalEntityManager.update(
            AppVersion,
            { id: appResourceMappings.appVersionMapping[importingAppVersion.id] },
            {
              definition: updatedDefinition,
              homePageId: updateHomepageId,
            }
          );
        }
      }
    });

    const appVersionIds = Object.values(appResourceMappings.appVersionMapping);

    for (const appVersionId of appVersionIds) {
      await this.updateEventActionsForNewVersionWithNewMappingIds(
        manager,
        appVersionId,
        appResourceMappings.dataQueryMapping,
        appResourceMappings.componentsMapping,
        appResourceMappings.pagesMapping
      );
    }

    await this.setEditingVersionAsLatestVersion(manager, appResourceMappings.appVersionMapping, importingAppVersions);

    return appResourceMappings;
  }

  async setupAppVersionAssociations(
    manager: EntityManager,
    importingAppVersions: AppVersion[],
    user: User,
    appResourceMappings: AppResourceMappings,
    externalResourceMappings: Record<string, unknown>,
    importingAppEnvironments: AppEnvironment[],
    importingDataSources: DataSource[],
    importingDataSourceOptions: DataSourceOptions[],
    importingDataQueries: DataQuery[],
    importingDefaultAppEnvironmentId: string,
    importingPages: Page[],
    importingComponents: Component[],
    importingEvents: EventHandler[],
    tooljetVersion: string | null
  ): Promise<AppResourceMappings> {
    appResourceMappings = { ...appResourceMappings };

    for (const importingAppVersion of importingAppVersions) {
      let isHomePage = false;
      let updateHomepageId = null;

      const { appEnvironmentMapping } = await this.associateAppEnvironmentsToAppVersion(
        manager,
        user,
        importingAppEnvironments,
        importingAppVersion,
        appResourceMappings
      );
      appResourceMappings.appEnvironmentMapping = appEnvironmentMapping;

      const { defaultDataSourceIdMapping } = await this.createDefaultDatasourcesForAppVersion(
        manager,
        importingAppVersion,
        user,
        appResourceMappings
      );
      appResourceMappings.defaultDataSourceIdMapping = defaultDataSourceIdMapping;

      const importingDataSourcesForAppVersion = await this.rejectMarketplacePluginsNotInstalled(
        manager,
        importingDataSources
      );

      const importingDataQueriesForAppVersion = importingDataQueries.filter(
        (dq: { dataSourceId: string; appVersionId: string }) => dq.appVersionId === importingAppVersion.id
      );

      // associate data sources and queries for each of the app versions
      for (const importingDataSource of importingDataSourcesForAppVersion) {
        const dataSourceForAppVersion = await this.findOrCreateDataSourceForAppVersion(
          manager,
          importingDataSource,
          appResourceMappings.appVersionMapping[importingAppVersion.id],
          user
        );

        // TODO: Have version based conditional based on app versions
        // currently we are checking on existence of keys and handling
        // imports accordingly. Would be pragmatic to do:
        // isLessThanExportVersion(appParams.tooljet_version, 'v2.0.0')
        // Will need to have JSON schema setup for each versions
        if (importingDataSource.options) {
          const convertedOptions = this.convertToArrayOfKeyValuePairs(importingDataSource.options);

          await Promise.all(
            appResourceMappings.appDefaultEnvironmentMapping[importingAppVersion.id].map(async (envId: any) => {
              if (this.isExistingDataSource(dataSourceForAppVersion)) return;

              const newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, true, manager);
              const dsOption = manager.create(DataSourceOptions, {
                environmentId: envId,
                dataSourceId: dataSourceForAppVersion.id,
                options: newOptions,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              await manager.save(dsOption);
            })
          );
        }

        const isDefaultDatasource = DefaultDataSourceNames.includes(importingDataSource.name as DefaultDataSourceName);
        if (!isDefaultDatasource) {
          await this.createDataSourceOptionsForExistingAppEnvs(
            manager,
            importingAppVersion,
            dataSourceForAppVersion,
            importingDataSourceOptions,
            importingDataSource,
            importingAppEnvironments,
            appResourceMappings,
            importingDefaultAppEnvironmentId
          );
        }

        const { dataQueryMapping } = await this.createDataQueriesForAppVersion(
          manager,
          importingDataQueriesForAppVersion,
          importingDataSource,
          dataSourceForAppVersion,
          importingAppVersion,
          appResourceMappings,
          externalResourceMappings
        );
        appResourceMappings.dataQueryMapping = dataQueryMapping;
      }

      const pagesOfAppVersion = importingPages.filter((page) => page.appVersionId === importingAppVersion.id);

      for (const page of pagesOfAppVersion) {
        const newPage = manager.create(Page, {
          name: page.name,
          handle: page.handle,
          appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
          index: page.index,
          disabled: page.disabled || false,
          hidden: page.hidden || false,
        });

        const pageCreated = await manager.save(newPage);

        appResourceMappings.pagesMapping[page.id] = pageCreated.id;

        isHomePage = importingAppVersion.homePageId === page.id;

        if (isHomePage) {
          updateHomepageId = pageCreated.id;
        }

        const pageComponents = importingComponents.filter((component) => component.pageId === page.id);

        const newComponentIdsMap = {};

        for (const component of pageComponents) {
          newComponentIdsMap[component.id] = uuid();
        }

        for (const component of pageComponents) {
          let skipComponent = false;
          const newComponent = new Component();

          let parentId = component.parent ? component.parent : null;

          const isParentTabOrCalendar = isChildOfTabsOrCalendar(component, pageComponents, parentId, true);

          if (isParentTabOrCalendar) {
            const childTabId = component.parent.split('-')[component.parent.split('-').length - 1];
            const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
            const mappedParentId = newComponentIdsMap[_parentId];

            parentId = `${mappedParentId}-${childTabId}`;
          } else if (isChildOfKanbanModal(component, pageComponents, parentId, true)) {
            const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
            const mappedParentId = newComponentIdsMap[_parentId];

            parentId = `${mappedParentId}-modal`;
          } else {
            if (component.parent && !newComponentIdsMap[parentId]) {
              skipComponent = true;
            }

            parentId = newComponentIdsMap[parentId];
          }
          if (!skipComponent) {
            const { properties, styles, general, validation, generalStyles } = migrateProperties(
              component.type as NewRevampedComponent,
              component,
              NewRevampedComponents,
              tooljetVersion
            );
            newComponent.id = newComponentIdsMap[component.id];
            newComponent.name = component.name;
            newComponent.type = component.type;
            newComponent.properties = properties;
            newComponent.styles = styles;
            newComponent.generalStyles = generalStyles;
            newComponent.general = general;
            newComponent.displayPreferences = component.displayPreferences;
            newComponent.validation = validation;
            newComponent.parent = component.parent ? parentId : null;

            newComponent.page = pageCreated;

            const savedComponent = await manager.save(newComponent);

            appResourceMappings.componentsMapping[component.id] = savedComponent.id;
            const componentLayout = component.layouts;

            componentLayout.forEach(async (layout) => {
              const newLayout = new Layout();
              newLayout.type = layout.type;
              newLayout.top = layout.top;
              newLayout.left = layout.left;
              newLayout.width = layout.width;
              newLayout.height = layout.height;
              newLayout.component = savedComponent;

              await manager.save(newLayout);
            });

            const componentEvents = importingEvents.filter((event) => event.sourceId === component.id);

            if (componentEvents.length > 0) {
              componentEvents.forEach(async (componentEvent) => {
                const newEvent = await manager.create(EventHandler, {
                  name: componentEvent.name,
                  sourceId: savedComponent.id,
                  target: componentEvent.target,
                  event: componentEvent.event,
                  index: componentEvent.index,
                  appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                });

                await manager.save(EventHandler, newEvent);
              });
            }
          }
        }

        const pageEvents = importingEvents.filter((event) => event.sourceId === page.id);

        if (pageEvents.length > 0) {
          pageEvents.forEach(async (pageEvent) => {
            const newEvent = await manager.create(EventHandler, {
              name: pageEvent.name,
              sourceId: pageCreated.id,
              target: pageEvent.target,
              event: pageEvent.event,
              index: pageEvent.index,
              appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
            });

            await manager.save(EventHandler, newEvent);
          });
        }
      }

      const newDataQueries = await manager.find(DataQuery, {
        where: { appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id] },
      });

      for (const importedDataQuery of importingDataQueriesForAppVersion) {
        const mappedNewDataQuery = newDataQueries.find(
          (dq) => dq.id === appResourceMappings.dataQueryMapping[importedDataQuery.id]
        );

        if (!mappedNewDataQuery) continue;

        const importingQueryEvents = importingEvents.filter(
          (event) => event.target === Target.dataQuery && event.sourceId === importedDataQuery.id
        );

        if (importingQueryEvents.length > 0) {
          importingQueryEvents.forEach(async (dataQueryEvent) => {
            const newEvent = await manager.create(EventHandler, {
              name: dataQueryEvent.name,
              sourceId: mappedNewDataQuery.id,
              target: dataQueryEvent.target,
              event: dataQueryEvent.event,
              index: dataQueryEvent.index,
              appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
            });

            await manager.save(EventHandler, newEvent);
          });
        } else {
          this.replaceDataQueryOptionsWithNewDataQueryIds(
            mappedNewDataQuery?.options,
            appResourceMappings.dataQueryMapping
          );
          const queryEvents = mappedNewDataQuery?.options?.events || [];

          delete mappedNewDataQuery?.options?.events;

          if (queryEvents.length > 0) {
            queryEvents.forEach(async (event, index) => {
              const newEvent = await manager.create(EventHandler, {
                name: event.eventId,
                sourceId: mappedNewDataQuery.id,
                target: Target.dataQuery,
                event: event,
                index: event.index ?? index,
                appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
              });

              await manager.save(EventHandler, newEvent);
            });
          }
        }

        await manager.save(mappedNewDataQuery);
      }

      await manager.update(
        AppVersion,
        { id: appResourceMappings.appVersionMapping[importingAppVersion.id] },
        {
          homePageId: updateHomepageId,
        }
      );
    }

    // const appVersionIds = Object.values(appResourceMappings.appVersionMapping);

    // for (const appVersionId of appVersionIds) {
    //   await this.updateEventActionsForNewVersionWithNewMappingIds(
    //     manager,
    //     appVersionId,
    //     appResourceMappings.dataQueryMapping,
    //     appResourceMappings.componentsMapping,
    //     appResourceMappings.pagesMapping
    //   );
    // }

    return appResourceMappings;
  }

  async rejectMarketplacePluginsNotInstalled(
    manager: EntityManager,
    importingDataSources: DataSource[]
  ): Promise<DataSource[]> {
    const pluginsFound = new Set<string>();

    const isPluginInstalled = async (kind: string): Promise<boolean> => {
      if (pluginsFound.has(kind)) return true;

      const pluginExists = !!(await manager.findOne(Plugin, { where: { pluginId: kind } }));

      if (pluginExists) pluginsFound.add(kind);

      return pluginExists;
    };

    const filteredDataSources: DataSource[] = [];

    for (const ds of importingDataSources) {
      const isPlugin = !!ds.pluginId;
      if (!isPlugin || (isPlugin && (await isPluginInstalled(ds.kind)))) {
        filteredDataSources.push(ds);
      }
    }

    return filteredDataSources;
  }

  async createDataQueriesForAppVersion(
    manager: EntityManager,
    importingDataQueriesForAppVersion: DataQuery[],
    importingDataSource: DataSource,
    dataSourceForAppVersion: DataSource,
    importingAppVersion: AppVersion,
    appResourceMappings: AppResourceMappings,
    externalResourceMappings: { [x: string]: any }
  ) {
    appResourceMappings = { ...appResourceMappings };
    const importingQueriesForSource = importingDataQueriesForAppVersion.filter(
      (dq: { dataSourceId: any }) => dq.dataSourceId === importingDataSource.id
    );
    if (isEmpty(importingDataQueriesForAppVersion)) return appResourceMappings;

    for (const importingQuery of importingQueriesForSource) {
      const options =
        importingDataSource.kind === 'tooljetdb'
          ? this.replaceTooljetDbTableIds(importingQuery.options, externalResourceMappings['tooljet_database'])
          : importingQuery.options;

      const newQuery = manager.create(DataQuery, {
        name: importingQuery.name,
        options,
        dataSourceId: dataSourceForAppVersion.id,
        appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
      });

      await manager.save(newQuery);
      appResourceMappings.dataQueryMapping[importingQuery.id] = newQuery.id;
    }

    return appResourceMappings;
  }

  isExistingDataSource(dataSourceForAppVersion: DataSource): boolean {
    return !!dataSourceForAppVersion.createdAt;
  }

  async createDataSourceOptionsForExistingAppEnvs(
    manager: EntityManager,
    appVersion: AppVersion,
    dataSourceForAppVersion: DataSource,
    dataSourceOptions: DataSourceOptions[],
    importingDataSource: DataSource,
    appEnvironments: AppEnvironment[],
    appResourceMappings: AppResourceMappings,
    defaultAppEnvironmentId: string
  ) {
    appResourceMappings = { ...appResourceMappings };
    const importingDatasourceOptionsForAppVersion = dataSourceOptions.filter(
      (dso: { dataSourceId: string }) => dso.dataSourceId === importingDataSource.id
    );
    // create the datasource options for datasource if other environments present which is not in the export
    if (appEnvironments?.length !== appResourceMappings.appDefaultEnvironmentMapping[appVersion.id].length) {
      const availableEnvironments = importingDatasourceOptionsForAppVersion.map(
        (option) => appResourceMappings.appEnvironmentMapping[option.environmentId]
      );
      const otherEnvironmentsIds = appResourceMappings.appDefaultEnvironmentMapping[appVersion.id].filter(
        (defaultEnv) => !availableEnvironments.includes(defaultEnv)
      );
      const defaultEnvDsOption = importingDatasourceOptionsForAppVersion.find(
        (dso) => dso.environmentId === defaultAppEnvironmentId
      );
      for (const otherEnvironmentId of otherEnvironmentsIds) {
        const existingDataSourceOptions = await manager.findOne(DataSourceOptions, {
          where: {
            dataSourceId: dataSourceForAppVersion.id,
            environmentId: otherEnvironmentId,
          },
        });
        !existingDataSourceOptions &&
          (await this.createDatasourceOption(
            manager,
            defaultEnvDsOption.options,
            otherEnvironmentId,
            dataSourceForAppVersion.id
          ));
      }
    }

    // create datasource options only for newly created datasources
    for (const importingDataSourceOption of importingDatasourceOptionsForAppVersion) {
      if (importingDataSourceOption?.environmentId in appResourceMappings.appEnvironmentMapping) {
        const existingDataSourceOptions = await manager.findOne(DataSourceOptions, {
          where: {
            dataSourceId: dataSourceForAppVersion.id,
            environmentId: appResourceMappings.appEnvironmentMapping[importingDataSourceOption.environmentId],
          },
        });

        !existingDataSourceOptions &&
          (await this.createDatasourceOption(
            manager,
            importingDataSourceOption.options,
            appResourceMappings.appEnvironmentMapping[importingDataSourceOption.environmentId],
            dataSourceForAppVersion.id
          ));
      }
    }
  }

  async createDefaultDatasourcesForAppVersion(
    manager: EntityManager,
    appVersion: AppVersion,
    user: User,
    appResourceMappings: AppResourceMappings
  ) {
    const defaultDataSourceIds = await this.createDefaultDataSourceForVersion(
      user.organizationId,
      appResourceMappings.appVersionMapping[appVersion.id],
      DefaultDataSourceKinds,
      manager
    );
    appResourceMappings.defaultDataSourceIdMapping[appVersion.id] = defaultDataSourceIds;

    return appResourceMappings;
  }

  async findOrCreateDataSourceForAppVersion(
    manager: EntityManager,
    dataSource: DataSource,
    appVersionId: string,
    user: User
  ): Promise<DataSource> {
    const isDefaultDatasource = DefaultDataSourceNames.includes(dataSource.name as DefaultDataSourceName);
    const isPlugin = !!dataSource.pluginId;

    if (isDefaultDatasource) {
      const createdDefaultDatasource = await manager.findOne(DataSource, {
        where: {
          appVersionId,
          kind: dataSource.kind,
          type: DataSourceTypes.STATIC,
          scope: 'local',
        },
      });

      return createdDefaultDatasource;
    }

    const globalDataSourceWithSameIdExists = async (dataSource: DataSource) => {
      return await manager.findOne(DataSource, {
        where: {
          id: dataSource.id,
          kind: dataSource.kind,
          type: DataSourceTypes.DEFAULT,
          scope: 'global',
          organizationId: user.organizationId,
        },
      });
    };
    const globalDataSourceWithSameNameExists = async (dataSource: DataSource) => {
      return await manager.findOne(DataSource, {
        where: {
          name: dataSource.name,
          kind: dataSource.kind,
          type: DataSourceTypes.DEFAULT,
          scope: 'global',
          organizationId: user.organizationId,
        },
      });
    };
    const existingDatasource =
      (await globalDataSourceWithSameIdExists(dataSource)) || (await globalDataSourceWithSameNameExists(dataSource));

    if (existingDatasource) return existingDatasource;

    const createDsFromPluginInstalled = async (ds: DataSource): Promise<DataSource> => {
      const plugin = await manager.findOneOrFail(Plugin, {
        where: {
          pluginId: dataSource.kind,
        },
      });

      if (plugin) {
        const newDataSource = manager.create(DataSource, {
          organizationId: user.organizationId,
          name: dataSource.name,
          kind: dataSource.kind,
          type: DataSourceTypes.DEFAULT,
          appVersionId,
          scope: 'global',
          pluginId: plugin.id,
        });
        await manager.save(newDataSource);

        return newDataSource;
      }
    };

    const createNewGlobalDs = async (ds: DataSource): Promise<DataSource> => {
      const newDataSource = manager.create(DataSource, {
        organizationId: user.organizationId,
        name: dataSource.name,
        kind: dataSource.kind,
        type: DataSourceTypes.DEFAULT,
        appVersionId,
        scope: 'global',
        pluginId: null,
      });
      await manager.save(newDataSource);

      return newDataSource;
    };

    if (isPlugin) {
      return await createDsFromPluginInstalled(dataSource);
    } else {
      return await createNewGlobalDs(dataSource);
    }
  }

  async associateAppEnvironmentsToAppVersion(
    manager: EntityManager,
    user: User,
    appEnvironments: Record<string, any>[],
    appVersion: AppVersion,
    appResourceMappings: AppResourceMappings
  ) {
    appResourceMappings = { ...appResourceMappings };
    const currentOrgEnvironments = await this.appEnvironmentService.getAll(user.organizationId, manager);

    if (!appEnvironments?.length) {
      currentOrgEnvironments.map((env) => (appResourceMappings.appEnvironmentMapping[env.id] = env.id));
    } else if (appEnvironments?.length && appEnvironments[0]?.appVersionId) {
      const appVersionedEnvironments = appEnvironments.filter(
        (appEnv: { appVersionId: string }) => appEnv.appVersionId === appVersion.id
      );
      for (const currentOrgEnv of currentOrgEnvironments) {
        const appEnvironment = appVersionedEnvironments.filter(
          (appEnv: { name: string }) => appEnv.name === currentOrgEnv.name
        )[0];
        if (appEnvironment) {
          appResourceMappings.appEnvironmentMapping[appEnvironment.id] = currentOrgEnv.id;
        }
      }
    } else {
      //For apps imported on v2 where organizationId not available
      for (const currentOrgEnv of currentOrgEnvironments) {
        const appEnvironment = appEnvironments.filter(
          (appEnv: { name: string }) => appEnv.name === currentOrgEnv.name
        )[0];
        if (appEnvironment) {
          appResourceMappings.appEnvironmentMapping[appEnvironment.id] = currentOrgEnv.id;
        }
      }
    }

    return appResourceMappings;
  }

  async createAppVersionsForImportedApp(
    manager: EntityManager,
    user: User,
    importedApp: App,
    appVersions: AppVersion[],
    appResourceMappings: AppResourceMappings,
    isNormalizedAppDefinitionSchema: boolean
  ) {
    appResourceMappings = { ...appResourceMappings };
    const { appVersionMapping, appDefaultEnvironmentMapping } = appResourceMappings;
    const organization: Organization = await manager.findOne(Organization, {
      where: { id: user.organizationId },
      relations: ['appEnvironments'],
    });
    let currentEnvironmentId: string;

    for (const appVersion of appVersions) {
      const appEnvIds: string[] = [...organization.appEnvironments.map((env) => env.id)];

      //app is exported to CE
      if (defaultAppEnvironments.length === 1) {
        currentEnvironmentId = organization.appEnvironments.find((env: any) => env.isDefault)?.id;
      } else {
        //to EE or cloud
        currentEnvironmentId = organization.appEnvironments.find((env) => env.priority === 1)?.id;
      }

      const version = await manager.create(AppVersion, {
        appId: importedApp.id,
        definition: appVersion.definition,
        name: appVersion.name,
        currentEnvironmentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (isNormalizedAppDefinitionSchema) {
        version.showViewerNavigation = appVersion.showViewerNavigation;
        version.homePageId = appVersion.homePageId;
        version.globalSettings = appVersion.globalSettings;
      } else {
        version.showViewerNavigation = appVersion.definition.showViewerNavigation || true;
        version.homePageId = appVersion.definition?.homePageId;

        if (!appVersion.definition?.globalSettings) {
          version.globalSettings = {
            hideHeader: false,
            appInMaintenance: false,
            canvasMaxWidth: 100,
            canvasMaxWidthType: '%',
            canvasMaxHeight: 2400,
            canvasBackgroundColor: '#edeff5',
            backgroundFxQuery: '',
          };
        } else {
          version.globalSettings = appVersion.definition?.globalSettings;
        }
      }

      await manager.save(version);

      appDefaultEnvironmentMapping[appVersion.id] = appEnvIds;
      appVersionMapping[appVersion.id] = version.id;
    }

    return appResourceMappings;
  }

  async createDefaultDataSourceForVersion(
    organizationId: string,
    versionId: string,
    kinds: DefaultDataSourceKind[],
    manager: EntityManager
  ): Promise<any> {
    const response = {};
    for (const defaultSource of kinds) {
      const dataSource = await this.dataSourcesService.createDefaultDataSource(defaultSource, versionId, null, manager);
      response[defaultSource] = dataSource.id;
      await this.appEnvironmentService.createDataSourceInAllEnvironments(organizationId, dataSource.id, manager);
    }
    return response;
  }

  async setEditingVersionAsLatestVersion(manager: EntityManager, appVersionMapping: any, appVersions: Array<any>) {
    if (isEmpty(appVersions)) return;

    const lastVersionFromImport = appVersions[appVersions.length - 1];
    const lastVersionIdToUpdate = appVersionMapping[lastVersionFromImport.id];

    await manager.update(AppVersion, { id: lastVersionIdToUpdate }, { updatedAt: new Date() });
  }

  async createAdminGroupPermissions(manager: EntityManager, app: App) {
    const orgDefaultGroupPermissions = await manager.find(GroupPermission, {
      where: {
        organizationId: app.organizationId,
        group: 'admin',
      },
    });

    const adminPermissions = {
      read: true,
      update: true,
      delete: true,
    };

    for (const groupPermission of orgDefaultGroupPermissions) {
      const appGroupPermission = manager.create(AppGroupPermission, {
        groupPermissionId: groupPermission.id,
        appId: app.id,
        ...adminPermissions,
      });

      return await manager.save(AppGroupPermission, appGroupPermission);
    }
  }

  async createDatasourceOption(
    manager: EntityManager,
    options: Record<string, unknown>,
    environmentId: string,
    dataSourceId: string
  ) {
    const convertedOptions = this.convertToArrayOfKeyValuePairs(options);
    const newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, true, manager);
    const dsOption = manager.create(DataSourceOptions, {
      options: newOptions,
      environmentId,
      dataSourceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await manager.save(dsOption);
  }

  convertToArrayOfKeyValuePairs(options: Record<string, unknown>): Array<object> {
    if (!options) return;
    return Object.keys(options).map((key) => {
      return {
        key: key,
        value: options[key]['value'],
        encrypted: options[key]['encrypted'],
      };
    });
  }

  replaceDataQueryOptionsWithNewDataQueryIds(
    options: { events: Record<string, unknown>[] },
    dataQueryMapping: Record<string, string>
  ) {
    if (options && options.events) {
      const replacedEvents = options.events.map((event: { queryId: string }) => {
        if (event.queryId) {
          event.queryId = dataQueryMapping[event.queryId];
        }
        return event;
      });
      options.events = replacedEvents;
    }
    return options;
  }

  replaceDataQueryIdWithinDefinitions(
    definition: QueryDeepPartialEntity<any>,
    dataQueryMapping: Record<string, string>
  ): QueryDeepPartialEntity<any> {
    if (definition?.pages) {
      for (const pageId of Object.keys(definition?.pages)) {
        if (definition.pages[pageId].events) {
          const replacedPageEvents = definition.pages[pageId].events.map((event: { queryId: string }) => {
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
              const replacedComponentEvents = component.definition.events.map((event: { queryId: string }) => {
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
                  const replacedComponentActionEvents = value.events.map((event: { queryId: string }) => {
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
                  const replacedComponentActionEvents = column.events.map((event: { queryId: string }) => {
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

  async performLegacyAppImport(
    manager: EntityManager,
    importedApp: App,
    appParams: any,
    externalResourceMappings: any,
    user: any
  ) {
    const dataSourceMapping = {};
    const dataQueryMapping = {};
    const dataSources = appParams?.dataSources || [];
    const dataQueries = appParams?.dataQueries || [];
    let currentEnvironmentId = null;

    const version = manager.create(AppVersion, {
      appId: importedApp.id,
      definition: appParams.definition,
      name: 'v1',
      currentEnvironmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await manager.save(version);

    // Create default data sources
    const defaultDataSourceIds = await this.createDefaultDataSourceForVersion(
      user.organizationId,
      version.id,
      DefaultDataSourceKinds,
      manager
    );
    let envIdArray: string[] = [];

    const organization: Organization = await manager.findOne(Organization, {
      where: { id: user.organizationId },
      relations: ['appEnvironments'],
    });
    envIdArray = [...organization.appEnvironments.map((env) => env.id)];

    if (!envIdArray.length) {
      await Promise.all(
        defaultAppEnvironments.map(async (en) => {
          const env = manager.create(AppEnvironment, {
            organizationId: user.organizationId,
            name: en.name,
            isDefault: en.isDefault,
            priority: en.priority,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(env);
          if (defaultAppEnvironments.length === 1 || en.priority === 1) {
            currentEnvironmentId = env.id;
          }
          envIdArray.push(env.id);
        })
      );
    } else {
      //get starting env from the organization environments list
      const { appEnvironments } = organization;
      if (appEnvironments.length === 1) currentEnvironmentId = appEnvironments[0].id;
      else {
        appEnvironments.map((appEnvironment) => {
          if (appEnvironment.priority === 1) currentEnvironmentId = appEnvironment.id;
        });
      }
    }

    for (const source of dataSources) {
      const convertedOptions = this.convertToArrayOfKeyValuePairs(source.options);

      const newSource = manager.create(DataSource, {
        name: source.name,
        kind: source.kind,
        appVersionId: version.id,
      });
      await manager.save(newSource);
      dataSourceMapping[source.id] = newSource.id;

      await Promise.all(
        envIdArray.map(async (envId) => {
          let newOptions: Record<string, unknown>;
          if (source.options) {
            newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, true, manager);
          }

          const dsOption = manager.create(DataSourceOptions, {
            environmentId: envId,
            dataSourceId: newSource.id,
            options: newOptions,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(dsOption);
        })
      );
    }

    const newDataQueries = [];
    for (const query of dataQueries) {
      const dataSourceId = dataSourceMapping[query.dataSourceId];
      const newQuery = manager.create(DataQuery, {
        name: query.name,
        dataSourceId: !dataSourceId ? defaultDataSourceIds[query.kind] : dataSourceId,
        appVersionId: query.appVersionId,
        options:
          dataSourceId == defaultDataSourceIds['tooljetdb']
            ? this.replaceTooljetDbTableIds(query.options, externalResourceMappings['tooljet_database'])
            : query.options,
      });
      await manager.save(newQuery);
      dataQueryMapping[query.id] = newQuery.id;
      newDataQueries.push(newQuery);
    }

    for (const newQuery of newDataQueries) {
      const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(newQuery.options, dataQueryMapping);
      const queryEvents = newQuery.options?.events || [];
      delete newOptions?.events;

      newQuery.options = newOptions;
      await manager.save(newQuery);

      queryEvents.forEach(async (event, index) => {
        const newEvent = {
          name: event.eventId,
          sourceId: newQuery.id,
          target: Target.dataQuery,
          event: event,
          index: queryEvents.index || index,
          appVersionId: newQuery.appVersionId,
        };

        await manager.save(EventHandler, newEvent);
      });
    }

    await manager.update(
      AppVersion,
      { id: version.id },
      { definition: this.replaceDataQueryIdWithinDefinitions(version.definition, dataQueryMapping) }
    );
  }

  // Entire function should be santised for Undefined values
  replaceTooljetDbTableIds(queryOptions: any, tooljetDatabaseMapping: any) {
    if (queryOptions?.operation && queryOptions.operation === 'join_tables') {
      const joinOptions = { ...(queryOptions?.join_table ?? {}) };

      // JOIN Section
      if (joinOptions?.joins && joinOptions.joins.length > 0) {
        const joinsTableIdUpdatedList = joinOptions.joins.map((joinCondition) => {
          const updatedJoinCondition = { ...joinCondition };
          // Updating Join tableId
          if (updatedJoinCondition.table)
            updatedJoinCondition.table =
              tooljetDatabaseMapping[updatedJoinCondition.table]?.id ?? updatedJoinCondition.table;
          // Updating TableId on Conditions in Join Query
          if (updatedJoinCondition.conditions) {
            const updatedJoinConditionFilter = this.updateNewTableIdForFilter(
              updatedJoinCondition.conditions,
              tooljetDatabaseMapping
            );
            updatedJoinCondition.conditions = updatedJoinConditionFilter.conditions;
          }

          return updatedJoinCondition;
        });
        joinOptions.joins = joinsTableIdUpdatedList;
      }

      // Filter Section
      if (joinOptions?.conditions) {
        joinOptions.conditions = this.updateNewTableIdForFilter(
          joinOptions.conditions,
          tooljetDatabaseMapping
        ).conditions;
      }

      // Select Section
      if (joinOptions?.fields) {
        joinOptions.fields = joinOptions.fields.map((eachField) => {
          if (eachField.table) {
            eachField.table = tooljetDatabaseMapping[eachField.table]?.id ?? eachField.table;
            return eachField;
          }
          return eachField;
        });
      }

      // From Section
      if (joinOptions?.from) {
        const { name = '' } = joinOptions.from;
        joinOptions.from = { ...joinOptions.from, name: tooljetDatabaseMapping[name]?.id ?? name };
      }

      // Sort Section
      if (joinOptions?.order_by) {
        joinOptions.order_by = joinOptions.order_by.map((eachOrderBy) => {
          if (eachOrderBy.table) {
            eachOrderBy.table = tooljetDatabaseMapping[eachOrderBy.table]?.id ?? eachOrderBy.table;
            return eachOrderBy;
          }
          return eachOrderBy;
        });
      }

      return { ...queryOptions, table_id: tooljetDatabaseMapping[queryOptions.table_id]?.id, join_table: joinOptions };
    } else {
      return { ...queryOptions, table_id: tooljetDatabaseMapping[queryOptions.table_id]?.id };
    }
  }

  updateNewTableIdForFilter(joinConditions, tooljetDatabaseMapping) {
    const { conditionsList = [] } = { ...joinConditions };
    const updatedConditionList = conditionsList.map((condition) => {
      if (condition.conditions) {
        return this.updateNewTableIdForFilter(condition.conditions, tooljetDatabaseMapping);
      } else {
        const { operator = '=', leftField = {}, rightField = {} } = { ...condition };
        if (leftField?.type && leftField.type === 'Column')
          leftField['table'] = tooljetDatabaseMapping[leftField.table]?.id ?? leftField.table;
        if (rightField?.type && rightField.type === 'Column')
          rightField['table'] = tooljetDatabaseMapping[rightField.table]?.id ?? rightField.table;
        return { operator, leftField, rightField };
      }
    });
    return { conditions: { ...joinConditions, conditionsList: [...updatedConditionList] } };
  }

  async updateEventActionsForNewVersionWithNewMappingIds(
    manager: EntityManager,
    versionId: string,
    oldDataQueryToNewMapping: Record<string, unknown>,
    oldComponentToNewComponentMapping: Record<string, unknown>,
    oldPageToNewPageMapping: Record<string, unknown>
  ) {
    const allEvents = await manager
      .createQueryBuilder(EventHandler, 'event')
      .where('event.appVersionId = :versionId', { versionId })
      .getMany();

    for (const event of allEvents) {
      const eventDefinition = event.event;

      if (eventDefinition?.actionId === 'run-query' && oldDataQueryToNewMapping[eventDefinition.queryId]) {
        eventDefinition.queryId = oldDataQueryToNewMapping[eventDefinition.queryId];
      }

      if (
        eventDefinition?.actionId === 'control-component' &&
        oldComponentToNewComponentMapping[eventDefinition.componentId]
      ) {
        eventDefinition.componentId = oldComponentToNewComponentMapping[eventDefinition.componentId];
      }

      if (eventDefinition?.actionId === 'switch-page' && oldPageToNewPageMapping[eventDefinition.pageId]) {
        eventDefinition.pageId = oldPageToNewPageMapping[eventDefinition.pageId];
      }

      if (
        (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'close-modal') &&
        oldComponentToNewComponentMapping[eventDefinition.modal]
      ) {
        eventDefinition.modal = oldComponentToNewComponentMapping[eventDefinition.modal];
      }

      event.event = eventDefinition;

      await manager.save(event);
    }
  }
}

function convertSinglePageSchemaToMultiPageSchema(appParams: any) {
  const appParamsWithMultipageSchema = {
    ...appParams,
    appVersions: appParams.appVersions?.map((appVersion: { definition: any }) => ({
      ...appVersion,
      definition: convertAppDefinitionFromSinglePageToMultiPage(appVersion.definition),
    })),
  };
  return appParamsWithMultipageSchema;
}

/**
 * Migrates styles to properties of the component based on the specified component types.
 * @param {NewRevampedComponent} componentType - Component type for which to perform property migration.
 * @param {Component} component - The component object containing properties, styles, and general information.
 * @param {NewRevampedComponent[]} componentTypes - An array of component types for which to perform property migration.
 * @returns {object} An object containing the modified properties, styles, and general information.
 */
function migrateProperties(
  componentType: NewRevampedComponent,
  component: Component,
  componentTypes: NewRevampedComponent[],
  tooljetVersion: string | null
) {
  const properties = { ...component.properties };
  const styles = { ...component.styles };
  const general = { ...component.general };
  const validation = { ...component.validation };
  const generalStyles = { ...component.generalStyles };

  if (!tooljetVersion) {
    return { properties, styles, general, generalStyles, validation };
  }

  const shouldHandleBackwardCompatibility = isVersionGreaterThanOrEqual(tooljetVersion, '2.29.0') ? false : true;

  // Check if the component type is included in the specified component types
  if (componentTypes.includes(componentType as NewRevampedComponent)) {
    if (styles.visibility) {
      properties.visibility = styles.visibility;
      delete styles.visibility;
    }

    if (styles.disabledState) {
      properties.disabledState = styles.disabledState;
      delete styles.disabledState;
    }

    if (general?.tooltip) {
      properties.tooltip = general?.tooltip;
      delete general?.tooltip;
    }

    if (generalStyles?.boxShadow) {
      styles.boxShadow = generalStyles?.boxShadow;
      delete generalStyles?.boxShadow;
    }

    if (
      shouldHandleBackwardCompatibility &&
      (componentType === 'TextInput' || componentType === 'PasswordInput' || componentType === 'NumberInput')
    ) {
      properties.label = '';
    }

    if (componentType === 'NumberInput') {
      if (properties.minValue) {
        validation.minValue = properties?.minValue;
        delete properties.minValue;
      }

      if (properties.maxValue) {
        validation.maxValue = properties?.maxValue;
        delete properties.maxValue;
      }
    }
  }
  return { properties, styles, general, generalStyles, validation };
}

function transformComponentData(
  data: object,
  componentEvents: any[],
  componentsMapping: Record<string, string>,
  isNormalizedAppDefinitionSchema = true,
  tooljetVersion: string
): Component[] {
  const transformedComponents: Component[] = [];

  const allComponents = Object.keys(data).map((key) => {
    return {
      id: key,
      ...data[key],
    };
  });

  for (const componentId in data) {
    const component = data[componentId];
    const componentData = component['component'];

    let skipComponent = false;
    const transformedComponent: Component = new Component();

    let parentId = component.parent ? component.parent : null;

    const isParentTabOrCalendar = isChildOfTabsOrCalendar(
      component,
      allComponents,
      parentId,
      isNormalizedAppDefinitionSchema
    );

    if (isParentTabOrCalendar) {
      const childTabId = component.parent.split('-')[component.parent.split('-').length - 1];
      const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
      const mappedParentId = componentsMapping[_parentId];

      parentId = `${mappedParentId}-${childTabId}`;
    } else if (isChildOfKanbanModal(component, allComponents, parentId, true)) {
      const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
      const mappedParentId = componentsMapping[_parentId];

      parentId = `${mappedParentId}-modal`;
    } else {
      if (component.parent && !componentsMapping[parentId]) {
        skipComponent = true;
      }
      parentId = componentsMapping[parentId];
    }

    if (!skipComponent) {
      const { properties, styles, general, validation, generalStyles } = migrateProperties(
        componentData.component,
        componentData.definition,
        NewRevampedComponents,
        tooljetVersion
      );
      transformedComponent.id = uuid();
      transformedComponent.name = componentData.name;
      transformedComponent.type = componentData.component;
      transformedComponent.properties = properties || {};
      transformedComponent.styles = styles || {};
      transformedComponent.validation = validation || {};
      transformedComponent.general = general || {};
      transformedComponent.generalStyles = generalStyles || {};
      transformedComponent.displayPreferences = componentData.definition.others || {};
      transformedComponent.parent = component.parent ? parentId : null;

      transformedComponents.push(transformedComponent);

      componentEvents.push({
        componentId: componentId,
        event: componentData.definition.events,
      });
      componentsMapping[componentId] = transformedComponent.id;
    }
  }

  return transformedComponents;
}

const isChildOfTabsOrCalendar = (
  component,
  allComponents = [],
  componentParentId = undefined,
  isNormalizedAppDefinitionSchema: boolean
) => {
  if (componentParentId) {
    const parentId = component?.parent?.split('-').slice(0, -1).join('-');

    const parentComponent = allComponents.find((comp) => comp.id === parentId);

    if (parentComponent) {
      if (!isNormalizedAppDefinitionSchema) {
        return parentComponent.component.component === 'Tabs' || parentComponent.component.component === 'Calendar';
      }

      return parentComponent.type === 'Tabs' || parentComponent.type === 'Calendar';
    }
  }

  return false;
};

const isChildOfKanbanModal = (
  component,
  allComponents = [],
  componentParentId = undefined,
  isNormalizedAppDefinitionSchema: boolean
) => {
  if (!componentParentId || !componentParentId.includes('modal')) return false;

  const parentId = component?.parent?.split('-').slice(0, -1).join('-');

  const parentComponent = allComponents.find((comp) => comp.id === parentId);

  if (!isNormalizedAppDefinitionSchema) {
    return parentComponent.component.component === 'Kanban';
  }

  return parentComponent.type === 'Kanban';
};
