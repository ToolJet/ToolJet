import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { createQueryBuilder, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { UsersService } from './users.service';
import { AppImportExportService } from './app_import_export.service';

@Injectable()
export class AppsService {
  constructor(
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

    @InjectRepository(GroupPermission)
    private groupPermissionsRepository: Repository<GroupPermission>,

    @InjectRepository(AppGroupPermission)
    private appGroupPermissionsRepository: Repository<AppGroupPermission>,

    private usersService: UsersService,
    private appImportExportService: AppImportExportService
  ) {}

  async find(id: string): Promise<App> {
    return this.appsRepository.findOne(id, {
      relations: ['dataQueries'],
    });
  }

  async findBySlug(slug: string): Promise<App> {
    return await this.appsRepository.findOne({
      where: {
        slug,
      },
      relations: ['dataQueries'],
    });
  }

  async findVersion(id: string): Promise<AppVersion> {
    return this.appVersionsRepository.findOne(id, {
      relations: ['app'],
    });
  }

  async create(user: User): Promise<App> {
    const app = await this.appsRepository.save(
      this.appsRepository.create({
        name: 'Untitled app',
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: user.organization.id,
        user: user,
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

  async count(user: User): Promise<number> {
    return await createQueryBuilder(App, 'apps')
      .innerJoin('apps.groupPermissions', 'group_permissions')
      .innerJoin('apps.appGroupPermissions', 'app_group_permissions')
      .innerJoin(
        UserGroupPermission,
        'user_group_permissions',
        'app_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
      )
      .where('user_group_permissions.user_id = :userId', { userId: user.id })
      .andWhere('app_group_permissions.read = :value', { value: true })
      .orWhere('(apps.is_public = :value AND apps.organization_id = :organizationId) OR apps.user_id = :userId', {
        value: true,
        organizationId: user.organizationId,
        userId: user.id,
      })
      .getCount();
  }

  async all(user: User, page: number): Promise<App[]> {
    const viewableAppsQb = await createQueryBuilder(App, 'apps')
      .innerJoin('apps.groupPermissions', 'group_permissions')
      .innerJoinAndSelect('apps.appGroupPermissions', 'app_group_permissions')
      .innerJoin(
        UserGroupPermission,
        'user_group_permissions',
        'app_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
      )
      .where('user_group_permissions.user_id = :userId', { userId: user.id })
      .andWhere('app_group_permissions.read = :value', { value: true })
      .orWhere('(apps.is_public = :value AND apps.organization_id = :organizationId) OR apps.user_id = :userId', {
        value: true,
        organizationId: user.organizationId,
        userId: user.id,
      });

    // FIXME:
    // TypeORM gives error when using query builder with order by
    // https://github.com/typeorm/typeorm/issues/8213
    // hence sorting results in memory
    if (page) {
      const viewableApps = await viewableAppsQb
        .take(10)
        .skip(10 * (page - 1))
        .getMany();

      return viewableApps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return await viewableAppsQb.orderBy('apps.created_at', 'DESC').getMany();
  }

  async update(user: User, appId: string, params: any) {
    const currentVersionId = params['current_version_id'];
    const isPublic = params['is_public'];
    const { name, slug } = params;

    const updateableParams = {
      name,
      slug,
      isPublic,
      currentVersionId,
    };

    // removing keys with undefined values
    Object.keys(updateableParams).forEach((key) =>
      updateableParams[key] === undefined ? delete updateableParams[key] : {}
    );

    return await this.appsRepository.update(appId, updateableParams);
  }

  async delete(appId: string) {
    await this.appsRepository.update(appId, { currentVersionId: null });

    const repositoriesToFetchEntitiesToBeDeleted: Repository<any>[] = [
      this.appUsersRepository,
      this.folderAppsRepository,
      this.dataQueriesRepository,
      this.dataSourcesRepository,
      this.appVersionsRepository,
    ];

    for (const repository of repositoriesToFetchEntitiesToBeDeleted) {
      const entities = await repository.find({
        where: { appId },
      });
      for (const entity of entities) {
        await repository.delete(entity.id);
      }
    }

    return await this.appsRepository.delete(appId);
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

  async createVersion(user: User, app: App, versionName: string): Promise<AppVersion> {
    const lastVersion = await this.appVersionsRepository.findOne({
      where: { appId: app.id },
      order: {
        createdAt: 'DESC',
      },
    });

    return await this.appVersionsRepository.save(
      this.appVersionsRepository.create({
        name: versionName,
        app,
        definition: lastVersion?.definition,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  async updateVersion(user: User, version: AppVersion, definition: any) {
    return await this.appVersionsRepository.update(version.id, { definition });
  }
}
