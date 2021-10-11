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
    if (await this.usersService.hasGroup(user, 'admin')) {
      return await this.foldersRepository.find({
        where: {
          organizationId: user.organizationId,
        },
        relations: ['folderApps'],
        order: {
          name: 'ASC',
        },
      });
    }

    const allViewableApps = await createQueryBuilder(App, 'apps')
      .select('apps.id')
      .innerJoin('apps.groupPermissions', 'group_permissions')
      .innerJoin('apps.appGroupPermissions', 'app_group_permissions')
      .innerJoin(
        UserGroupPermission,
        'user_group_permissions',
        'app_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
      )
      .where('user_group_permissions.user_id = :userId', { userId: user.id })
      .andWhere('app_group_permissions.read = :value', { value: true })
      .orWhere('apps.is_public = :value and apps.organization_id = :organizationId', {
        value: true,
        organizationId: user.organizationId,
      })
      .getMany();
    const allViewableAppIds = allViewableApps.map((app) => app.id);

    return await createQueryBuilder(Folder, 'folders')
      .innerJoinAndSelect('folders.folderApps', 'folder_apps')
      .where('folder_apps.app_id IN(:...allViewableAppIds)', {
        allViewableAppIds,
      })
      .andWhere('folders.organization_id = :organizationId', {
        organizationId: user.organizationId,
      })
      .orWhere('folder_apps.app_id IS NULL')
      .orderBy('folders.name', 'ASC')
      .getMany();
  }

  async findOne(folderId: string): Promise<Folder> {
    return await this.foldersRepository.findOneOrFail(folderId);
  }

  async userAppCount(user: User, folder: Folder) {
    const folderApps = await this.folderAppsRepository.find({
      where: {
        folderId: folder.id,
      },
    });
    const folderAppIds = folderApps.map((folderApp) => folderApp.appId);

    if (folderAppIds.length == 0) {
      return 0;
    }

    return await createQueryBuilder(App, 'apps')
      .innerJoin('apps.groupPermissions', 'group_permissions')
      .innerJoinAndSelect('apps.appGroupPermissions', 'app_group_permissions')
      .innerJoin(
        UserGroupPermission,
        'user_group_permissions',
        'app_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
      )
      .where('user_group_permissions.user_id = :userId', { userId: user.id })
      .andWhere('app_group_permissions.read = :value', { value: true })
      .andWhere('app_group_permissions.app_id IN(:...folderAppIds)', {
        folderAppIds,
      })
      .orWhere('apps.is_public = :value', { value: true })
      .getCount();
  }

  async getAppsFor(user: User, folder: Folder, page: number): Promise<App[]> {
    const folderApps = await this.folderAppsRepository.find({
      where: {
        folderId: folder.id,
      },
    });
    const folderAppIds = folderApps.map((folderApp) => folderApp.appId);

    let viewableApps: App[];

    if (folderAppIds.length == 0) {
      viewableApps = [];
    } else {
      viewableApps = await createQueryBuilder(App, 'apps')
        .innerJoin('apps.groupPermissions', 'group_permissions')
        .innerJoinAndSelect('apps.appGroupPermissions', 'app_group_permissions')
        .innerJoin(
          UserGroupPermission,
          'user_group_permissions',
          'app_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
        )
        .where('user_group_permissions.user_id = :userId', { userId: user.id })
        .andWhere('app_group_permissions.read = :value', { value: true })
        .andWhere('app_group_permissions.app_id IN(:...folderAppIds)', {
          folderAppIds,
        })
        .orWhere('apps.is_public = :value', { value: true })
        .take(10)
        .skip(10 * (page - 1))
        // .orderBy('apps.created_at', 'DESC')
        .getMany();
    }

    console.log(viewableApps);

    // FIXME:
    // TypeORM gives error when using query builder with order by
    // https://github.com/typeorm/typeorm/issues/8213
    // hence sorting results in memory
    return viewableApps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
