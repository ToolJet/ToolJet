import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { EntityManager, getManager, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { DataSourcesService } from './data_sources.service';

@Injectable()
export class AppImportExportService {
  constructor(
    @InjectRepository(App)
    private appsRepository: Repository<App>,
    private dataSourcesService: DataSourcesService,
    private readonly entityManager: EntityManager
  ) {}

  async export(user: User, id: string): Promise<App> {
    // https://github.com/typeorm/typeorm/issues/3857
    // Making use of query builder
    const queryForappToExport = getManager()
      .createQueryBuilder(App, 'apps')
      .where('apps.id = :id AND apps.organization_id = :organizationId', {
        id,
        organizationId: user.organizationId,
      });
    const appToExport = await queryForappToExport.getOne();

    const dataQueries = await getManager()
      .createQueryBuilder(DataQuery, 'data_queries')
      .where('app_id = :appId', {
        appId: appToExport.id,
      })
      .orderBy('data_queries.created_at', 'ASC')
      .getMany();
    const dataSources = await getManager()
      .createQueryBuilder(DataSource, 'data_sources')
      .where('app_id = :appId', {
        appId: appToExport.id,
      })
      .orderBy('data_sources.created_at', 'ASC')
      .getMany();
    const appVersions = await getManager()
      .createQueryBuilder(AppVersion, 'app_versions')
      .where('app_id = :appId', {
        appId: appToExport.id,
      })
      .orderBy('app_versions.created_at', 'ASC')
      .getMany();

    appToExport['dataQueries'] = dataQueries;
    appToExport['dataSources'] = dataSources;
    appToExport['appVersions'] = appVersions;

    return appToExport;
  }

  async import(user: User, appParams: any): Promise<App> {
    if (typeof appParams !== 'object') {
      throw new BadRequestException('Invalid params for app import');
    }

    let importedApp: App;

    await this.entityManager.transaction(async (manager) => {
      importedApp = await this.createImportedAppForUser(manager, appParams, user);
      await this.buildImportedAppAssociations(manager, importedApp, appParams);
      await this.createAdminGroupPermissions(manager, importedApp);
    });

    // FIXME: App slug updation callback doesnt work while wrapped in transaction
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
      user: user,
      slug: null, // Prevent db unique constraint error.
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await manager.save(importedApp);
    return importedApp;
  }

  async buildImportedAppAssociations(manager: EntityManager, importedApp: App, appParams: any) {
    const dataSourceMapping = {};
    const dataQueryMapping = {};
    const appVersionMapping = {};
    let currentVersionId: string;
    const dataSources = appParams?.dataSources || [];
    const dataQueries = appParams?.dataQueries || [];
    const appVersions = appParams?.appVersions || [];

    // create new app versions
    for (const appVersion of appVersions) {
      const version = manager.create(AppVersion, {
        app: importedApp,
        definition: appVersion.definition,
        name: appVersion.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await manager.save(version);

      if (appVersion.id == appParams.currentVersionId) {
        currentVersionId = version.id;
        await manager.update(App, importedApp, { currentVersionId });
      }
      appVersionMapping[appVersion.id] = version.id;
    }

    // associate data sources and queries for each of the app versions
    for (const appVersion of appVersions) {
      for (const source of dataSources) {
        const convertedOptions = this.convertToArrayOfKeyValuePairs(source.options);
        const newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, manager);
        let appVersionId: any;

        // Handle exports prior to 0.12.0
        // If there are more variances in imports when tooljet version changes,
        // we can split this service based on app export definition's tooljet version.
        if (source.appVersionId) {
          if (source.appVersionId !== appVersion.id) {
            continue;
          }
          appVersionId = appVersionMapping[appVersion.id];
        } else {
          appVersionId = appVersionMapping[appVersion.id];
        }
        const newSource = manager.create(DataSource, {
          app: importedApp,
          name: source.name,
          kind: source.kind,
          appVersionId,
          options: newOptions,
        });
        await manager.save(newSource);
        dataSourceMapping[source.id] = newSource.id;
      }

      const newDataQueries = [];
      for (const query of dataQueries) {
        let appVersionId: any;

        if (query.appVersionId) {
          if (query.appVersionId !== appVersion.id) {
            continue;
          }
          appVersionId = appVersionMapping[query.appVersionId];
        } else {
          appVersionId = appVersionMapping[appVersion.id];
        }

        const newQuery = manager.create(DataQuery, {
          app: importedApp,
          name: query.name,
          options: query.options,
          kind: query.kind,
          appVersionId,
          dataSourceId: dataSourceMapping[query.dataSourceId],
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

      const version = await manager.findOne(AppVersion, {
        where: { id: appVersionMapping[appVersion.id] },
      });
      version.definition = this.replaceDataQueryIdWithinDefinitions(version.definition, dataQueryMapping);
      await manager.save(version);
    }
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
    if (definition?.components) {
      for (const id of Object.keys(definition.components)) {
        const component = definition.components[id].component;

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

        definition.components[id].component = component;
      }
    }
    return definition;
  }
}
