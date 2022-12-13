import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { EntityManager, Repository } from 'typeorm';
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
import { cleanObject, dbTransactionWrap, defaultAppEnvironments } from 'src/helpers/utils.helper';
import { AppUpdateDto } from '@dto/app-update.dto';
import { viewableAppsQuery } from 'src/helpers/queries';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { AppEnvironmentService } from './app_environments.service';
import { decode } from 'js-base64';

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

  async findDataQueriesForVersion(appVersionId: string): Promise<DataQuery[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return manager
        .createQueryBuilder(DataQuery, 'data_query')
        .innerJoin('data_query.dataSource', 'data_source')
        .addSelect('data_source.kind')
        .where('data_source.appVersionId = :appVersionId', { appVersionId })
        .getMany();
    });
  }

  async create(user: User, manager: EntityManager): Promise<App> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const app = await manager.save(
        manager.create(App, {
          name: 'Untitled app',
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: user.organizationId,
          userId: user.id,
        })
      );

      //create default app version
      await this.createVersion(user, app, 'v1', null, manager);

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
    }, manager);
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

  async clone(existingApp: App, user: User): Promise<App> {
    const appWithRelations = await this.appImportExportService.export(user, existingApp.id);
    const clonedApp = await this.appImportExportService.import(user, appWithRelations);

    return clonedApp;
  }

  async count(user: User, searchKey): Promise<number> {
    return await viewableAppsQuery(user, searchKey).getCount();
  }

  async all(user: User, page: number, searchKey: string): Promise<App[]> {
    const viewableAppsQb = viewableAppsQuery(user, searchKey);

    if (page) {
      return await viewableAppsQb
        .take(10)
        .skip(10 * (page - 1))
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
      return await manager.update(App, appId, updatableParams);
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
    manager?: EntityManager
  ): Promise<AppVersion> {
    if (!versionName) {
      throw new BadRequestException('Version name cannot be empty.');
    }
    if (versionName.length > 25) {
      throw new BadRequestException('Version name cannot be longer than 25 characters.');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      let versionFrom: AppVersion;
      if (versionFromId) {
        versionFrom = await manager.findOneOrFail(AppVersion, {
          where: { id: versionFromId },
          relations: ['appEnvironments', 'dataSources', 'dataSources.dataQueries', 'dataSources.dataSourceOptions'],
        });
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

      const appVersion = await manager.save(
        AppVersion,
        manager.create(AppVersion, {
          name: versionName,
          appId: app.id,
          definition: versionFrom?.definition,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      await this.createNewDataSourcesAndQueriesForVersion(manager, appVersion, versionFrom);
      return appVersion;
    }, manager);
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
    versionFrom: AppVersion
  ) {
    const oldDataQueryToNewMapping = {};

    if (!versionFrom) {
      await this.createEnvironments(defaultAppEnvironments, manager, appVersion);
      //create default data sources
      for await (const defaultSource of ['restapi', 'runjs']) {
        const dataSource = await this.dataSourcesService.createDefaultDataSource(
          defaultSource,
          appVersion.id,
          null,
          manager
        );
        await this.appEnvironmentService.createDataSourceInAllEnvironments(appVersion.id, dataSource.id, manager);
      }
    } else {
      const appEnvironments: AppEnvironment[] = versionFrom?.appEnvironments;
      const dataSources = versionFrom?.dataSources;
      if (dataSources?.length && appEnvironments?.length) {
        for await (const appEnvironment of appEnvironments) {
          const newAppEnvironment = await this.appEnvironmentService.create(
            appVersion.id,
            appEnvironment.name,
            appEnvironment.isDefault,
            manager
          );
          for await (const dataSource of dataSources) {
            const dataSourceOption = await manager.findOneOrFail(DataSourceOptions, {
              where: { dataSourceId: dataSource.id, environmentId: appEnvironment.id },
            });

            const convertedOptions = this.convertToArrayOfKeyValuePairs(dataSourceOption.options);
            const newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, false, manager);
            await this.setNewCredentialValueFromOldValue(newOptions, convertedOptions, manager);

            const dataSourceParams = {
              name: dataSource.name,
              kind: dataSource.kind,
              appVersionId: appVersion.id,
            };
            const newDataSource = await manager.save(manager.create(DataSource, dataSourceParams));

            await manager.save(
              manager.create(DataSourceOptions, {
                options: newOptions,
                dataSourceId: newDataSource.id,
                environmentId: newAppEnvironment.id,
              })
            );

            const dataQueries = versionFrom?.dataSources?.find((ds) => ds.id === dataSource.id).dataQueries;

            const newDataQueries = [];
            for await (const dataQuery of dataQueries) {
              const dataQueryParams = {
                name: dataQuery.name,
                options: dataQuery.options,
                dataSourceId: newDataSource.id,
              };

              const newQuery = await manager.save(manager.create(DataQuery, dataQueryParams));
              oldDataQueryToNewMapping[dataQuery.id] = newQuery.id;
              newDataQueries.push(newQuery);
            }

            for (const newQuery of newDataQueries) {
              const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(
                newQuery.options,
                oldDataQueryToNewMapping
              );
              newQuery.options = newOptions;
              await manager.save(newQuery);
            }
          }

          appVersion.definition = this.replaceDataQueryIdWithinDefinitions(
            appVersion.definition,
            oldDataQueryToNewMapping
          );
          await manager.save(appVersion);
        }
      } else {
        await this.createEnvironments(appEnvironments, manager, appVersion);
      }
    }
  }

  private async createEnvironments(appEnvironments: any[], manager: EntityManager, appVersion: AppVersion) {
    for await (const appEnvironment of appEnvironments) {
      await this.appEnvironmentService.create(appVersion.id, appEnvironment.name, appEnvironment.isDefault, manager);
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

    for await (const newOption of newOptionsWithCredentials) {
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

  async updateVersion(version: AppVersion, body: any) {
    if (version.id === version.app.currentVersionId)
      throw new BadRequestException('You cannot update a released version');

    const editableParams = {};
    if (body.definition) editableParams['definition'] = body.definition;
    if (body.name) editableParams['name'] = body.name;

    if (body.name) {
      //means user is trying to update the name
      const versionNameExists = await this.appVersionsRepository.findOne({
        where: { name: body.name, appId: version.appId },
      });

      if (versionNameExists) {
        throw new BadRequestException('Version name already exists.');
      }
    }
    editableParams['updatedAt'] = new Date();

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
}
