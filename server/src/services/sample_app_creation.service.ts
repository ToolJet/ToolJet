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

    const sampleApp = await this.findSampleApp(
      appIdentifierMapping,
      identifier,
    );

    const newApp = await this.createNewAppForUser(sampleApp, currentUser);
    await this.buildNewAppAssociations(newApp, sampleApp);

    return newApp;
  }

  async findSampleApp(
    appIdentifierMapping: {
      [x: string]: any;
      'github-contributors'?: string;
      'customer-dashboard'?: string;
    },
    identifier: string,
  ): Promise<App> {
    const sampleAppId = appIdentifierMapping[identifier];
    return await this.entityManager.findOne(App, {
      id: sampleAppId,
    });
  }

  async createNewAppForUser(sampleApp: App, currentUser: User): Promise<App> {
    const newApp = this.entityManager.create(App, {
      name: sampleApp.name,
      organizationId: currentUser.organizationId,
      user: currentUser,
    });
    await this.entityManager.save(newApp);

    const newAppUser = this.entityManager.create(AppUser, {
      app: newApp,
      user: currentUser,
      role: 'admin',
    });
    await this.entityManager.save(newAppUser);
    return newApp;
  }

  async buildNewAppAssociations(newApp: App, sampleApp: App) {
    const dataSourceMapping = {};
    const newDefinition = sampleApp.editingVersion?.definition;

    const sampleDataSources = await this.entityManager.find(DataSource, {
      app: sampleApp,
    });
    sampleDataSources.forEach(async (source) => {
      const newSource = this.entityManager.create(DataSource, {
        app: newApp,
        name: source.name,
        options: source.options,
        kind: source.kind,
      });
      await this.entityManager.save(newSource);
      dataSourceMapping[source.id] = newSource.id;
    });

    const sampleDataQueries = await this.entityManager.find(DataQuery, {
      app: sampleApp,
    });
    sampleDataQueries.forEach(async (query) => {
      const newQuery = this.entityManager.create(DataQuery, {
        app: newApp,
        name: query.name,
        options: query.options,
        kind: query.kind,
        dataSourceId: dataSourceMapping[query.dataSourceId],
      });
      await this.entityManager.save(newQuery);
      dataSourceMapping[query.id] = newQuery.id;
    });

    const version = this.entityManager.create(AppVersion, {
      app: newApp,
      definition: newDefinition,
      name: 'v0',
    });
    await this.entityManager.save(version);

    await this.entityManager.update(App, newApp, {
      currentVersionId: version.id,
    });
  }
}
