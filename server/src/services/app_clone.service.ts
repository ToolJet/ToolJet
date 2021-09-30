import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { App } from 'src/entities/app.entity';
import { User } from 'src/entities/user.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { Credential } from 'src/entities/credential.entity';

@Injectable()
export class AppCloneService {
  constructor(private readonly entityManager: EntityManager) {}

  async perform(existingApp: App, user: User): Promise<App> {
    let clonedApp: App;

    await this.entityManager.transaction(async (manager) => {
      clonedApp = await this.createClonedAppForUser(manager, existingApp, user);
      await this.buildClonedAppAssociations(manager, clonedApp, existingApp);
    });

    return clonedApp;
  }

  async createClonedAppForUser(manager: EntityManager, existingApp: App, currentUser: User): Promise<App> {
    const newApp = manager.create(App, {
      name: existingApp.name,
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

  async buildClonedAppAssociations(manager, newApp: App, existingApp: App) {
    const dataSourceMapping = {};
    const newDefinition = existingApp.editingVersion?.definition;

    const existingDataSources = await manager.find(DataSource, {
      app: existingApp,
    });

    for (const source of existingDataSources) {
      const clonedOptions = await this.cloneOptionsWithNewCredentials(manager, source.options);

      const newSource = manager.create(DataSource, {
        app: newApp,
        name: source.name,
        options: clonedOptions,
        kind: source.kind,
      });

      await manager.save(newSource);
      dataSourceMapping[source.id] = newSource.id;
    }

    const existingDataQueries = await manager.find(DataQuery, {
      app: existingApp,
    });

    for (const query of existingDataQueries) {
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

  async cloneOptionsWithNewCredentials(manager, options) {
    for (const key of Object.keys(options)) {
      if ('credential_id' in options[key]) {
        const existingCredential = await manager.findOne(Credential, {
          id: options[key]['credential_id'],
        });
        const newCredential = await manager.create(Credential, {
          valueCiphertext: existingCredential.valueCiphertext,
        });
        await manager.save(newCredential);
        options[key]['credential_id'] = newCredential.id;
      }
    }

    return options;
  }
}
