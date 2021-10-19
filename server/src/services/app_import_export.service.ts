import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { EntityManager, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';

@Injectable()
export class AppImportExportService {
  constructor(
    @InjectRepository(App)
    private appsRepository: Repository<App>,
    private readonly entityManager: EntityManager
  ) {}

  async export(user: User, id: string): Promise<App> {
    const appToExport = this.appsRepository.findOne(id, {
      relations: ['dataQueries', 'dataSources', 'appVersions'],
    });

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

    return importedApp;
  }

  async createImportedAppForUser(manager: EntityManager, appParams: any, user: User): Promise<App> {
    const importedApp = manager.create(App, {
      name: appParams.name,
      organizationId: user.organizationId,
      user: user,
      isPublic: true,
    });
    await manager.save(importedApp);
    return importedApp;
  }

  async buildImportedAppAssociations(manager: EntityManager, importedApp: App, appParams: any) {
    const dataSourceMapping = {};
    let currentVersionId: string;
    const dataSources = appParams?.dataSources || [];
    const dataQueries = appParams?.dataQueries || [];
    const appVersions = appParams?.appVersions || [];

    for (const source of dataSources) {
      const newSource = manager.create(DataSource, {
        app: importedApp,
        name: source.name,
        kind: source.kind,
        options: source.options,
      });

      await manager.save(newSource);
      dataSourceMapping[source.id] = newSource.id;
    }

    for (const query of dataQueries) {
      const newQuery = manager.create(DataQuery, {
        app: importedApp,
        name: query.name,
        options: query.options,
        kind: query.kind,
        dataSourceId: dataSourceMapping[query.dataSourceId],
      });
      await manager.save(newQuery);
    }

    for (const appVersion of appVersions) {
      const version = manager.create(AppVersion, {
        app: importedApp,
        definition: appVersion.definition,
        name: appVersion.name,
      });

      await manager.save(version);

      if (appVersion.id == appParams.currentVersionId) {
        currentVersionId = version.id;

        await manager.update(App, importedApp, { currentVersionId });
      }
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
}
