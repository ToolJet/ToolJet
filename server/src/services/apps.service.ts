import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { App } from 'src/entities/app.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';

@Injectable()
export class AppsService {

  constructor(
    private readonly entityManager: EntityManager,

    @InjectRepository(App)
    private appsRepository: Repository<App>,

    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>,

    @InjectRepository(AppUser)
    private appUsersRepository: Repository<AppUser>,

    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,

    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>,

    @InjectRepository(FolderApp)
    private folderAppsRepository: Repository<FolderApp>,
  ) { }

  async find(id: string): Promise<App> {
    return this.appsRepository.findOne(id, {
      relations: ['dataQueries']
    });
  }

  async findBySlug(slug: string): Promise<App> {
    return await this.appsRepository.findOne({
      where: {
        slug
      },
      relations: ['dataQueries']
    });
  }

  async findVersion(id: string): Promise<AppVersion> {
    return this.appVersionsRepository.findOne(id, {
      relations: ['app']
    });
  }

  async create(user: User): Promise<App> {
    const app = await this.appsRepository.save(this.appsRepository.create({
        name: 'Untitled app',
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: user.organization.id,
        user: user
    }));

    await this.appUsersRepository.save(this.appUsersRepository.create({
      userId: user.id,
      appId: app.id,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return app;
  }

  async clone(existingApp: App, user: User): Promise<App> {
    let clonedApp: App;

    await this.entityManager.transaction(async (manager) => {
      clonedApp = await this.createClonedAppForUser(manager, existingApp, user);
      await this.buildClonedAppAssociations(manager, clonedApp, existingApp);
    });

    return clonedApp;
  }

  async createClonedAppForUser(
    manager: EntityManager,
    existingApp: App,
    currentUser: User,
  ): Promise<App> {
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
      const newSource = manager.create(DataSource, {
        app: newApp,
        name: source.name,
        options: source.options,
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

  async count(user: User) {
    return await this.appsRepository.count({
        where: {
            organizationId: user.organizationId,
        },
     });
  }

  async all(user: User, page: number): Promise<App[]> {

    return await this.appsRepository.find({
        relations: ['user'],
        where: {
            organizationId: user.organizationId,
        },
        take: 10,
        skip: 10 * (page - 1),
        order: {
            createdAt: 'DESC'
        }
    });
  }

  async update(user: User, appId: string, params: any) {
    const currentVersionId = params['current_version_id'];
    const isPublic = params['is_public'];
    const { name, slug } = params;

    const updateableParams = {
      name,
      slug,
      isPublic,
      currentVersionId
    }

    // removing keys with undefined values
    Object.keys(updateableParams).forEach(key => updateableParams[key] === undefined ? delete updateableParams[key] : {});

    return await this.appsRepository.update(appId, updateableParams);
  }

  async delete(appId: string) {

    await this.appsRepository.update(appId, { currentVersionId: null } );

    const repositoriesToFetchEntitiesToBeDeleted:Repository<any>[] = [
      this.appUsersRepository,
      this.folderAppsRepository,
      this.dataQueriesRepository,
      this.dataSourcesRepository,
      this.appVersionsRepository
    ];

    for(const repository of repositoriesToFetchEntitiesToBeDeleted) {
      const entities = await repository.find({
        where: { appId }
      })
      for(const entity of entities) { await repository.delete(entity.id) };
    }

    return await this.appsRepository.delete(appId);
  }

  async fetchUsers(user: any, appId: string): Promise<AppUser[]> {

    const appUsers = await this.appUsersRepository.find({
      where: { appId },
      relations: ['user']
    });

    // serialize
    const serializedUsers = []
    for(const appUser of appUsers) {
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

  async createVersion(user: User, app: App, versionName: string): Promise<AppVersion> {
   const lastVersion = await this.appVersionsRepository.findOne({
     where: { appId: app.id },
      order: {
        createdAt: 'DESC',
      },
    });

    return await this.appVersionsRepository.save(this.appVersionsRepository.create({
      name: versionName,
      app,
      definition: lastVersion?.definition,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

  }

  async updateVersion(user: User, version: AppVersion, definition: any) {
    return await this.appVersionsRepository.update(version.id, { definition });
  }

}
