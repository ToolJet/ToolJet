import { BadRequestException, Injectable } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { EntityManager } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { DataSourcesService } from './data_sources.service';
import { dbTransactionWrap, defaultAppEnvironments } from 'src/helpers/utils.helper';
import { isEmpty } from 'lodash';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { AppEnvironmentService } from './app_environments.service';
import { convertAppDefinitionFromSinglePageToMultiPage } from '../../lib/single-page-to-and-from-multipage-definition-conversion';
import { DataSourceScopes, DataSourceTypes } from 'src/helpers/data_source.constants';
import { Organization } from 'src/entities/organization.entity';

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
    const { versionId = undefined } = searchParams;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queryForAppToExport = manager
        .createQueryBuilder(App, 'apps')
        .where('apps.id = :id AND apps.organization_id = :organizationId', {
          id,
          organizationId: user.organizationId,
        });
      const appToExport = await queryForAppToExport.getOne();

      const queryAppVersions = await manager
        .createQueryBuilder(AppVersion, 'app_versions')
        .where('app_versions.appId = :appId', {
          appId: appToExport.id,
        });

      if (versionId) {
        queryAppVersions.andWhere('app_versions.id = :versionId', { versionId });
      }
      const appVersions = await queryAppVersions.orderBy('app_versions.created_at', 'ASC').getMany();

      const dataSources =
        appVersions?.length &&
        (await manager
          .createQueryBuilder(DataSource, 'data_sources')
          .where('data_sources.appVersionId IN(:...versionId)', {
            versionId: appVersions.map((v) => v.id),
          })
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
        .leftJoinAndSelect('data_query.dataSource', 'dataSource')
        .where('data_query.appVersionId IN(:...versionId)', {
          versionId: appVersions.map((v) => v.id),
        })
        .andWhere('dataSource.scope = :scope', { scope: DataSourceScopes.GLOBAL })
        .getMany();

      if (dataSources?.length) {
        dataQueries = await manager
          .createQueryBuilder(DataQuery, 'data_queries')
          .where('data_queries.dataSourceId IN(:...dataSourceId)', {
            dataSourceId: dataSources?.map((v) => v.id),
          })
          .orderBy('data_queries.created_at', 'ASC')
          .getMany();

        dataSourceOptions = await manager
          .createQueryBuilder(DataSourceOptions, 'data_source_options')
          .where('data_source_options.environmentId IN(:...environmentId)', {
            environmentId: appEnvironments.map((v) => v.id),
          })
          .orderBy('data_source_options.createdAt', 'ASC')
          .getMany();
      }

      if (globalQueries?.length) {
        dataQueries = [...dataQueries, ...globalQueries];
      }

      appToExport['dataQueries'] = dataQueries;
      appToExport['dataSources'] = dataSources;
      appToExport['appVersions'] = appVersions;
      appToExport['appEnvironments'] = appEnvironments;
      appToExport['dataSourceOptions'] = dataSourceOptions;
      appToExport['schemaDetails'] = {
        multiPages: true,
        multiEnv: true,
      };

      return { appV2: appToExport };
    });
  }

  async import(user: User, appParamsObj: any): Promise<App> {
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

    let importedApp: App;

    const schemaUnifiedAppParams = appParams?.schemaDetails?.multiPages
      ? appParams
      : convertSinglePageSchemaToMultiPageSchema(appParams);

    await dbTransactionWrap(async (manager) => {
      importedApp = await this.createImportedAppForUser(manager, schemaUnifiedAppParams, user);
      await this.buildImportedAppAssociations(manager, importedApp, schemaUnifiedAppParams, user);
      await this.createAdminGroupPermissions(manager, importedApp);
    });

    // NOTE: App slug updation callback doesn't work while wrapped in transaction
    // hence updating slug explicitly
    await importedApp.reload();
    importedApp.slug = importedApp.id;
    await this.entityManager.save(importedApp);

    return importedApp;
  }

  async createImportedAppForUser(manager: EntityManager, appParams: any, user: User): Promise<App> {
    const importedApp = manager.create(App, {
      name: appParams.name,
      organizationId: user.organizationId,
      userId: user.id,
      slug: null, // Prevent db unique constraint error.
      icon: appParams.icon,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await manager.save(importedApp);
    return importedApp;
  }

  async buildImportedAppAssociations(manager: EntityManager, importedApp: App, appParams: any, user: User) {
    const dataSourceMapping = {};
    const defaultDataSourceIdMapping = {};
    const dataQueryMapping = {};
    const appVersionMapping = {};
    const appEnvironmentMapping = {};
    const appDefaultEnvironmentMapping = {};
    let currentVersionId: string;
    const dataSources = appParams?.dataSources || [];
    const dataQueries = appParams?.dataQueries || [];
    const appVersions = appParams?.appVersions || [];
    const appEnvironments = appParams?.appEnvironments || [];
    const dataSourceOptions = appParams?.dataSourceOptions || [];
    const newDataQueries = [];

    if (!appVersions?.length) {
      // Old version without app version
      // Handle exports prior to 0.12.0
      const version = manager.create(AppVersion, {
        appId: importedApp.id,
        definition: appParams.definition,
        name: 'v1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await manager.save(version);

      await manager.update(App, importedApp, { currentVersionId: version.id });

      // Create default data sources
      const defaultDataSourceIds = await this.createDefaultDataSourceForVersion(
        user.organizationId,
        version.id,
        [],
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
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            await manager.save(env);
            envIdArray.push(env.id);
          })
        );
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
            let newOptions;
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
          options: query.options,
          dataSourceId: !dataSourceId ? defaultDataSourceIds[query.kind] : dataSourceId,
          appVersionId: query.appVersionId,
        });
        await manager.save(newQuery);
        dataQueryMapping[query.id] = newQuery.id;
        newDataQueries.push(newQuery);
      }

      for (const newQuery of newDataQueries) {
        const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(newQuery.options, dataQueryMapping);
        newQuery.options = newOptions;
        await manager.save(newQuery);
      }

      await manager.update(
        AppVersion,
        { id: version.id },
        { definition: this.replaceDataQueryIdWithinDefinitions(version.definition, dataQueryMapping) }
      );

      return;
    }

    // With version support v1 & v2
    // create new app versions
    for (const appVersion of appVersions) {
      const version = manager.create(AppVersion, {
        appId: importedApp.id,
        definition: appVersion.definition,
        name: appVersion.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await manager.save(version);

      let envIdArray: string[] = [];
      const organization: Organization = await manager.findOne(Organization, {
        where: { id: user.organizationId },
        relations: ['appEnvironments'],
      });
      envIdArray = [...organization.appEnvironments.map((env) => env.id)];

      appDefaultEnvironmentMapping[appVersion.id] = envIdArray;

      if (appVersion.id == appParams.currentVersionId) {
        currentVersionId = version.id;
        await manager.update(App, importedApp, { currentVersionId });
      }
      appVersionMapping[appVersion.id] = version.id;
    }

    // associate App environments for each of the app versions
    for (const appVersion of appVersions) {
      const currentOrgEnvironments = await this.appEnvironmentService.getAll(user.organizationId, manager);

      if (!appEnvironments?.length) {
        currentOrgEnvironments.map((env) => (appEnvironmentMapping[env.id] = env.id));
      } else {
        //For apps imported on v2 where organizationId not available
        for (const currentOrgEnv of currentOrgEnvironments) {
          const appEnvironment = appEnvironments.filter((appEnv) => appEnv.name === currentOrgEnv.name)[0];
          if (appEnvironment) {
            appEnvironmentMapping[appEnvironment.id] = currentOrgEnv.id;
          } else {
            const env = manager.create(AppEnvironment, {
              organizationId: user.organizationId,
              name: currentOrgEnv.name,
              isDefault: currentOrgEnv.isDefault,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            await manager.save(env);
            appEnvironmentMapping[env.id] = env.id;
          }
        }
      }

      const dsKindsToCreate = [];

      if (!dataSources?.some((ds) => ds.kind === 'restapi' && ds.type === DataSourceTypes.STATIC)) {
        dsKindsToCreate.push('restapi');
      }

      if (!dataSources?.some((ds) => ds.kind === 'runjs' && ds.type === DataSourceTypes.STATIC)) {
        dsKindsToCreate.push('runjs');
      }

      if (!dataSources?.some((ds) => ds.kind === 'tooljetdb' && ds.type === DataSourceTypes.STATIC)) {
        dsKindsToCreate.push('tooljetdb');
      }

      if (!dataSources?.some((ds) => ds.kind === 'runpy' && ds.type === DataSourceTypes.STATIC)) {
        dsKindsToCreate.push('runpy');
      }

      if (dsKindsToCreate.length > 0) {
        // Create default data sources
        defaultDataSourceIdMapping[appVersion.id] = await this.createDefaultDataSourceForVersion(
          user.organizationId,
          appVersionMapping[appVersion.id],
          dsKindsToCreate,
          manager
        );
      }

      let dataSourcesToIterate = dataSources; // 0.9.0 -> add all data sources & queries to all versions
      let dataQueriesToIterate = dataQueries;
      const globalQueriesToIterate = dataQueries?.filter(
        (dq) => dq.dataSource?.scope === DataSourceScopes.GLOBAL && dq.appVersionId === appVersion.id
      );

      if (dataSources[0]?.appVersionId || dataQueries[0]?.appVersionId) {
        // v1 - Data queries without dataSourceId present
        dataSourcesToIterate = dataSources?.filter((ds) => ds.appVersionId === appVersion.id);
        dataQueriesToIterate = dataQueries?.filter((dq) => !dq.dataSourceId && dq.appVersionId === appVersion.id);
      }

      // associate data sources and queries for each of the app versions
      for (const source of dataSourcesToIterate) {
        const newSource = manager.create(DataSource, {
          name: source.name,
          kind: source.kind,
          type: source.type || DataSourceTypes.DEFAULT,
          appVersionId: appVersionMapping[appVersion.id],
        });
        await manager.save(newSource);

        if (source.options) {
          // v1
          const convertedOptions = this.convertToArrayOfKeyValuePairs(source.options);

          await Promise.all(
            appDefaultEnvironmentMapping[appVersion.id].map(async (envId) => {
              const newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, true, manager);
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

        for (const dataSourceOption of dataSourceOptions.filter((dso) => dso.dataSourceId === source.id)) {
          if (dataSourceOption?.environmentId in appEnvironmentMapping) {
            const convertedOptions = this.convertToArrayOfKeyValuePairs(dataSourceOption.options);
            const newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, true, manager);
            const dsOption = manager.create(DataSourceOptions, {
              options: newOptions,
              environmentId: appEnvironmentMapping[dataSourceOption.environmentId],
              dataSourceId: newSource.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            await manager.save(dsOption);
          }
        }

        for (const query of dataQueries.filter((dq) => dq.dataSourceId === source.id)) {
          const newQuery = manager.create(DataQuery, {
            name: query.name,
            options: query.options,
            dataSourceId: newSource.id,
            appVersionId: appVersionMapping[appVersion.id],
          });
          await manager.save(newQuery);
          dataQueryMapping[query.id] = newQuery.id;
          newDataQueries.push(newQuery);
        }
      }

      for (const query of dataQueriesToIterate) {
        // for v1
        const newQuery = manager.create(DataQuery, {
          name: query.name,
          options: query.options,
          dataSourceId: defaultDataSourceIdMapping[appVersion.id][query.kind],
          appVersionId: appVersionMapping[appVersion.id],
        });
        await manager.save(newQuery);
        dataQueryMapping[query.id] = newQuery.id;
        newDataQueries.push(newQuery);
      }

      for (const query of globalQueriesToIterate) {
        const newQuery = manager.create(DataQuery, {
          name: query.name,
          options: query.options,
          dataSourceId: query.dataSourceId,
          appVersionId: appVersionMapping[appVersion.id],
        });
        await manager.save(newQuery);
        dataQueryMapping[query.id] = newQuery.id;
        newDataQueries.push(newQuery);
      }
    }

    for (const newQuery of newDataQueries) {
      const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(newQuery.options, dataQueryMapping);
      newQuery.options = newOptions;
      await manager.save(newQuery);
    }

    for (const appVersion of appVersions) {
      await manager.update(
        AppVersion,
        { id: appVersionMapping[appVersion.id] },
        { definition: this.replaceDataQueryIdWithinDefinitions(appVersion.definition, dataQueryMapping) }
      );
    }

    await this.setEditingVersionAsLatestVersion(manager, appVersionMapping, appVersions);
  }

  async createDefaultDataSourceForVersion(
    organizationId: string,
    versionId: string,
    kinds: string[] = ['restapi', 'runjs', 'tooljetdb'],
    manager: EntityManager
  ): Promise<any> {
    //create default data sources
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

  convertToArrayOfKeyValuePairs(options): Array<object> {
    if (!options) return;
    return Object.keys(options).map((key) => {
      return {
        key: key,
        value: options[key]['value'],
        encrypted: options[key]['encrypted'],
      };
    });
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
}

function convertSinglePageSchemaToMultiPageSchema(appParams: any) {
  const appParamsWithMultipageSchema = {
    ...appParams,
    appVersions: appParams.appVersions?.map((appVersion) => ({
      ...appVersion,
      definition: convertAppDefinitionFromSinglePageToMultiPage(appVersion.definition),
    })),
  };
  return appParamsWithMultipageSchema;
}
