import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { App } from '../entities/app.entity';
import { AppVersion } from '../entities/app_version.entity';
import { AppUser } from '../entities/app_user.entity';
import { DataSource } from '../entities/data_source.entity';
import { DataQuery } from '../entities/data_query.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SampleAppCreationService {
  constructor(private readonly entityManager: EntityManager) {}

  async perform(currentUser: User, identifier: string): Promise<App> {
    return this.createNewAppfromSampleApp(currentUser, identifier);
  }

  async createNewAppfromSampleApp(
    currentUser: User,
    identifier: string,
  ): Promise<App> {
    const appIdentifierMapping = {
      'github-contributors': '47283446-3c9b-4fbb-b2f3-75540664df8c',
      'customer-dashboard': 'd041993a-4737-4a47-930c-9513eac99645',
    };
    let newApp: App;

    await this.entityManager.transaction(async (manager) => {
      const sampleApp = await this.findSampleApp(
        manager,
        appIdentifierMapping,
        identifier,
      );

      newApp = await this.createNewAppForUser(manager, sampleApp, currentUser);
      await this.buildNewAppAssociations(manager, newApp, sampleApp);
    });

    return newApp;
  }

  async findSampleApp(
    manager: EntityManager,
    appIdentifierMapping: {
      [x: string]: any;
      'github-contributors'?: string;
      'customer-dashboard'?: string;
    },
    identifier: string,
  ): Promise<App> {
    const sampleAppId = appIdentifierMapping[identifier];
    return await manager.findOne(App, {
      id: sampleAppId,
    });
  }

  async createNewAppForUser(
    manager: EntityManager,
    sampleApp: App,
    currentUser: User,
  ): Promise<App> {
    const newApp = manager.create(App, {
      name: sampleApp.name,
      organizationId: currentUser.organizationId,
      user: currentUser,
    });
    await manager.save(newApp);

    const newAppUser = manager.create(AppUser, {
      app: newApp,
      user: currentUser,
      role: 'admin',
    });
    await manager.save(newAppUser);
    return newApp;
  }

  async buildNewAppAssociations(manager, newApp: App, sampleApp: App) {
    const dataSourceMapping = {};
    const newDefinition = sampleApp.editingVersion?.definition;

    const sampleDataSources = await manager.find(DataSource, {
      app: sampleApp,
    });

    for (const source of sampleDataSources) {
      const newSource = manager.create(DataSource, {
        app: newApp,
        name: source.name,
        options: source.options,
        kind: source.kind,
      });

      await manager.save(newSource);
      dataSourceMapping[source.id] = newSource.id;
    }

    const sampleDataQueries = await manager.find(DataQuery, {
      app: sampleApp,
    });

    for (const query of sampleDataQueries) {
      const newQuery = manager.create(DataQuery, {
        app: newApp,
        name: query.name,
        options: query.options,
        kind: query.kind,
        dataSourceId: dataSourceMapping[query.dataSourceId],
      });
      await manager.save(newQuery);
      dataSourceMapping[query.id] = newQuery.id;
    }

    const version = manager.create(AppVersion, {
      app: newApp,
      definition: newDefinition,
      name: 'v0',
    });
    await manager.save(version);

    await manager.update(App, newApp, {
      currentVersionId: version.id,
    });
  }
}
