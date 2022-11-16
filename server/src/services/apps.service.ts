import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { EntityManager, getManager, Repository, DeleteResult } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { AppImportExportService } from './app_import_export.service';
import { DataSourcesService } from './data_sources.service';
import { Credential } from 'src/entities/credential.entity';
import { cleanObject, dbTransactionWrap } from 'src/helpers/utils.helper';
import { AppUpdateDto } from '@dto/app-update.dto';
import { viewableAppsQuery } from 'src/helpers/queries';
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

    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>,

    @InjectRepository(GroupPermission)
    private groupPermissionsRepository: Repository<GroupPermission>,

    @InjectRepository(AppGroupPermission)
    private appGroupPermissionsRepository: Repository<AppGroupPermission>,

    private appImportExportService: AppImportExportService,
    private dataSourcesService: DataSourcesService
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
    const appVersion = await this.appVersionsRepository.findOne({
      where: { id },
      relations: ['app', 'dataQueries', 'dataQueries.plugin', 'dataQueries.plugin.manifestFile'],
    });

    if (appVersion?.dataQueries) {
      for (const query of appVersion?.dataQueries) {
        if (query?.pluginId) {
          query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
        }
      }
    }

    return appVersion;
  }

  async findDataQueriesForVersion(appVersionId: string): Promise<DataQuery[]> {
    return this.dataQueriesRepository.find({
      where: { appVersionId },
    });
  }

  async create(user: User): Promise<App> {
    const app = await this.appsRepository.save(
      this.appsRepository.create({
        name: 'Untitled app',
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: user.organizationId,
        userId: user.id,
      })
    );

    await this.appUsersRepository.save(
      this.appUsersRepository.create({
        userId: user.id,
        appId: app.id,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    await this.createAppGroupPermissionsForAdmin(app);

    return app;
  }

  async createAppGroupPermissionsForAdmin(app: App) {
    const orgDefaultGroupPermissions = await this.groupPermissionsRepository.find({
      where: {
        organizationId: app.organizationId,
        group: 'admin',
      },
    });

    for (const groupPermission of orgDefaultGroupPermissions) {
      const appGroupPermission = this.appGroupPermissionsRepository.create({
        groupPermissionId: groupPermission.id,
        appId: app.id,
        ...this.fetchDefaultAppGroupPermissions(groupPermission.group),
      });

      await this.appGroupPermissionsRepository.save(appGroupPermission);
    }
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

  async update(user: User, appId: string, appUpdateDto: AppUpdateDto) {
    const currentVersionId = appUpdateDto.current_version_id;
    const isPublic = appUpdateDto.is_public;
    const isMaintenanceOn = appUpdateDto.is_maintenance_on;
    const { name, slug, icon } = appUpdateDto;

    const updateableParams = {
      name,
      slug,
      isPublic,
      isMaintenanceOn,
      currentVersionId,
      icon,
    };

    // removing keys with undefined values
    cleanObject(updateableParams);

    return await this.appsRepository.update(appId, updateableParams);
  }

  async delete(appId: string) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(AppUser, { appId });
      await manager.delete(FolderApp, { appId });
      await manager.delete(DataQuery, { appId });
      await manager.delete(DataSource, { appId });
      await manager.delete(AppVersion, { appId });
      await manager.delete(App, { id: appId });
    });
    return;
  }

  async fetchUsers(user: any, appId: string): Promise<AppUser[]> {
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

  async createVersion(user: User, app: App, versionName: string, versionFromId: string): Promise<AppVersion> {
    const versionFrom = await this.appVersionsRepository.findOne({
      where: { id: versionFromId },
    });

    const versionNameExists = await this.appVersionsRepository.findOne({
      where: { name: versionName, appId: app.id },
    });

    if (versionNameExists) {
      throw new BadRequestException('Version name already exists.');
    }

    let appVersion: AppVersion;
    await getManager().transaction(async (manager) => {
      appVersion = await manager.save(
        AppVersion,
        manager.create(AppVersion, {
          name: versionName,
          app,
          definition: versionFrom?.definition,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      await this.setupDataSourcesAndQueriesForVersion(manager, appVersion, versionFrom);
    });

    return appVersion;
  }

  async deleteVersion(app: App, version: AppVersion): Promise<DeleteResult> {
    if (app.currentVersionId === version.id) {
      throw new BadRequestException('You cannot delete a released version');
    }

    let result: DeleteResult;

    await getManager().transaction(async (manager) => {
      await manager.delete(DataSource, { appVersionId: version.id });
      await manager.delete(DataQuery, { appVersionId: version.id });
      result = await manager.delete(AppVersion, {
        id: version.id,
        appId: app.id,
      });
    });

    return result;
  }

  async setupDataSourcesAndQueriesForVersion(manager: EntityManager, appVersion: AppVersion, versionFrom: AppVersion) {
    if (versionFrom) {
      await this.createNewDataSourcesAndQueriesForVersion(manager, appVersion, versionFrom);
    } else {
      // TODO: Remove this when default version will be create when app creation is done
      const totalVersions = await manager.count(AppVersion, {
        where: { appId: appVersion.appId },
      });

      if (totalVersions > 1) {
        throw new BadRequestException('More than one version found. Version to create from not specified.');
      }
      await this.associateExistingDataSourceAndQueriesToVersion(manager, appVersion);
    }
  }

  async associateExistingDataSourceAndQueriesToVersion(manager: EntityManager, appVersion: AppVersion) {
    const dataSources = await manager.find(DataSource, {
      where: { appId: appVersion.appId, appVersionId: null },
    });
    for await (const dataSource of dataSources) {
      await manager.update(DataSource, dataSource.id, {
        appVersionId: appVersion.id,
      });
    }

    const dataQueries = await manager.find(DataQuery, {
      where: { appId: appVersion.appId, appVersionId: null },
    });
    for await (const dataQuery of dataQueries) {
      await manager.update(DataQuery, dataQuery.id, {
        appVersionId: appVersion.id,
      });
    }
  }

  async createNewDataSourcesAndQueriesForVersion(
    manager: EntityManager,
    appVersion: AppVersion,
    versionFrom: AppVersion
  ) {
    const oldDataSourceToNewMapping = {};
    const oldDataQueryToNewMapping = {};

    const dataSources = await manager.find(DataSource, {
      where: { appVersionId: versionFrom.id },
    });

    for await (const dataSource of dataSources) {
      const convertedOptions = this.convertToArrayOfKeyValuePairs(dataSource.options);
      const newOptions = await this.dataSourcesService.parseOptionsForCreate(convertedOptions, manager);
      await this.setNewCredentialValueFromOldValue(newOptions, convertedOptions, manager);
      const dataSourceParams = {
        name: dataSource.name,
        kind: dataSource.kind,
        options: newOptions,
        appId: dataSource.appId,
        appVersionId: appVersion.id,
      };
      const newDataSource = await manager.save(manager.create(DataSource, dataSourceParams));

      oldDataSourceToNewMapping[dataSource.id] = newDataSource.id;
    }

    const dataQueries = await manager.find(DataQuery, {
      where: { appVersionId: versionFrom.id },
    });
    const newDataQueries = [];
    for await (const dataQuery of dataQueries) {
      const dataQueryParams = {
        name: dataQuery.name,
        kind: dataQuery.kind,
        options: dataQuery.options,
        dataSourceId: oldDataSourceToNewMapping[dataQuery.dataSourceId],
        appId: dataQuery.appId,
        appVersionId: appVersion.id,
      };

      const newQuery = await manager.save(manager.create(DataQuery, dataQueryParams));
      oldDataQueryToNewMapping[dataQuery.id] = newQuery.id;
      newDataQueries.push(newQuery);
    }

    for (const newQuery of newDataQueries) {
      const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(newQuery.options, oldDataQueryToNewMapping);
      newQuery.options = newOptions;
      await manager.save(newQuery);
    }

    appVersion.definition = this.replaceDataQueryIdWithinDefinitions(appVersion.definition, oldDataQueryToNewMapping);
    await manager.save(appVersion);
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

  async updateVersion(user: User, version: AppVersion, body: any) {
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

    return await this.appVersionsRepository.update(version.id, editableParams);
  }

  convertToArrayOfKeyValuePairs(options): Array<object> {
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
