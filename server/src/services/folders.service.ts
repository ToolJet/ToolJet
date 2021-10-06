import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { createQueryBuilder, Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { Folder } from '../entities/folder.entity';
import { UsersService } from './users.service';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
    @InjectRepository(FolderApp)
    private folderAppsRepository: Repository<FolderApp>,
    @InjectRepository(App)
    private appsRepository: Repository<App>,
    private usersService: UsersService
  ) {}

  async create(user: User, folderName): Promise<Folder> {
    return this.foldersRepository.save(
      this.foldersRepository.create({
        name: folderName,
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: user.organizationId,
      })
    );
  }

  async all(user: User): Promise<Folder[]> {
    return createQueryBuilder(Folder, 'folders')
      .innerJoin('folders.apps', 'apps')
      .innerJoin('apps.groupPermissions', 'group_permissions')
      .innerJoin('apps.appGroupPermissions', 'app_group_permissions')
      .innerJoin(
        UserGroupPermission,
        'user_group_permissions',
        'app_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
      )
      .where('folders.organization_id = :organizationId', { organizationId: user.organizationId })
      .andWhere('user_group_permissions.user_id = :userId', { userId: user.id })
      .andWhere('app_group_permissions.read = :value', { value: true })
      .orWhere('apps.is_public = :value', { value: true })
      .loadRelationCountAndMap('folders.count', 'folders.apps')
      .getMany();
  }

  async findOne(folderId: string): Promise<Folder> {
    return await this.foldersRepository.findOneOrFail(folderId);
  }

  async userAppCount(user: User, folder: Folder) {
    if (await this.usersService.hasGroup(user, 'admin')) {
      const result = await this.foldersRepository
        .createQueryBuilder('folder')
        .where('id = :id', { id: folder.id })
        .loadRelationCountAndMap('folder.appCount', 'folder.apps', 'apps', (qb) =>
          qb.andWhere('apps.user_id = :user_id', { user_id: user.id })
        )
        .getMany();

      return result[0].appCount;
    } else {
      const folderApps = await this.folderAppsRepository.find({
        where: {
          folderId: folder.id,
        },
      });
      const folderAppIds = folderApps.map((folderApp) => folderApp.appId);

      return createQueryBuilder(App, 'apps')
        .innerJoin('apps.groupPermissions', 'group_permissions')
        .innerJoin('apps.appGroupPermissions', 'app_group_permissions')
        .innerJoin(
          UserGroupPermission,
          'user_group_permissions',
          'app_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
        )
        .where('user_group_permissions.user_id = :userId', { userId: user.id })
        .andWhere('app_group_permissions.read = :value', { value: true })
        .orWhere('apps.is_public = :value', { value: true })
        .andWhere('app_group_permissions.app_id IN(:...folderAppIds)', { folderAppIds })
        .getCount();
    }
  }

  async getAppsFor(user: User, folder: Folder, page: number): Promise<App[]> {
    const folderApps = await this.folderAppsRepository.find({
      where: {
        folderId: folder.id,
      },
    });
    const folderAppIds = folderApps.map((folderApp) => folderApp.appId);

    if (await this.usersService.hasGroup(user, 'admin')) {
      const apps = await this.appsRepository.findByIds(folderAppIds, {
        where: {
          user,
        },
        relations: ['user'],
        take: 10,
        skip: 10 * (page - 1),
        order: {
          createdAt: 'DESC',
        },
      });

      return apps;
    } else {
      // TypeORM gives error when using query builder with order by
      // https://github.com/typeorm/typeorm/issues/8213
      // hence sorting results in memory
      const viewableApps = await createQueryBuilder(App, 'apps')
        .innerJoin('apps.groupPermissions', 'group_permissions')
        .innerJoin('apps.appGroupPermissions', 'app_group_permissions')
        .innerJoin(
          UserGroupPermission,
          'user_group_permissions',
          'app_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
        )
        .where('user_group_permissions.user_id = :userId', { userId: user.id })
        .andWhere('app_group_permissions.read = :value', { value: true })
        .orWhere('apps.is_public = :value', { value: true })
        .andWhere('app_group_permissions.app_id IN(:...folderAppIds)', { folderAppIds })
        .take(10)
        .skip(10 * (page - 1))
        // .orderBy('apps.created_at', 'DESC')
        .getMany();

      return viewableApps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }
}
