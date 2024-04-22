import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { getFolderQuery, viewableAppsQuery } from 'src/helpers/queries';
import { createQueryBuilder, Repository, UpdateResult } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { Folder } from '../entities/folder.entity';
import { UsersService } from './users.service';
import { catchDbException } from 'src/helpers/utils.helper';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { AppBase } from 'src/entities/app_base.entity';

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
    return await catchDbException(async () => {
      return await this.foldersRepository.save(
        this.foldersRepository.create({
          name: folderName,
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: user.organizationId,
        })
      );
    }, [{ dbConstraint: DataBaseConstraints.FOLDER_NAME_UNIQUE, message: 'This folder name is already taken.' }]);
  }

  async update(folderId: string, folderName: string): Promise<UpdateResult> {
    return await catchDbException(async () => {
      return await this.foldersRepository.update({ id: folderId }, { name: folderName });
    }, [{ dbConstraint: DataBaseConstraints.FOLDER_NAME_UNIQUE, message: 'This folder name is already taken.' }]);
  }

  async allFolders(user: User, searchKey?: string): Promise<Folder[]> {
    const allViewableApps = await viewableAppsQuery(user, searchKey, ['id']).getMany();

    const allViewableAppIds = allViewableApps.map((app) => app.id);

    if (await this.usersService.userCan(user, 'create', 'Folder')) {
      return await getFolderQuery(true, allViewableAppIds, user.organizationId).distinct().getMany();
    }

    if (allViewableAppIds.length === 0) return [];

    return await getFolderQuery(false, allViewableAppIds, user.organizationId).distinct().getMany();
  }

  async all(user: User, searchKey: string): Promise<Folder[]> {
    const allFolderList = await this.allFolders(user);
    if (!searchKey || !allFolderList || allFolderList.length === 0) {
      return allFolderList;
    }
    const folders = await this.allFolders(user, searchKey);
    allFolderList.forEach((folder, index) => {
      const currentFolder = folders.find((f) => f.id === folder.id);
      if (currentFolder) {
        allFolderList[index] = currentFolder;
      } else {
        allFolderList[index].folderApps = [];
        allFolderList[index].generateCount();
      }
    });
    return allFolderList;
  }

  async findOne(folderId: string): Promise<Folder> {
    return await this.foldersRepository.findOneOrFail(folderId);
  }

  async userAppCount(user: User, folder: Folder, searchKey: string) {
    const folderApps = await this.folderAppsRepository.find({
      where: {
        folderId: folder.id,
      },
    });
    const folderAppIds = folderApps.map((folderApp) => folderApp.appId);

    if (folderAppIds.length == 0) {
      return 0;
    }

    const viewableAppsQb = viewableAppsQuery(user, searchKey);

    const folderAppsQb = createQueryBuilder(App, 'apps_in_folder').whereInIds(folderAppIds);

    return await createQueryBuilder(App, 'apps')
      .innerJoin(
        '(' + viewableAppsQb.getQuery() + ')',
        'viewable_apps_join',
        'apps.id = viewable_apps_join.viewable_apps_id'
      )
      .innerJoin(
        '(' + folderAppsQb.getQuery() + ')',
        'apps_in_folder_join',
        'apps.id = apps_in_folder_join.apps_in_folder_id'
      )
      .setParameters({
        ...folderAppsQb.getParameters(),
        ...viewableAppsQb.getParameters(),
      })
      .getCount();
  }

  async getAppsFor(user: User, folder: Folder, page: number, searchKey: string): Promise<AppBase[]> {
    const folderApps = await this.folderAppsRepository.find({
      where: {
        folderId: folder.id,
      },
    });

    const folderAppIds = folderApps.map((folderApp) => folderApp.appId);

    if (folderAppIds.length == 0) {
      return [];
    }

    const viewableAppsQb = viewableAppsQuery(user, searchKey);

    const folderAppsQb = createQueryBuilder(App, 'apps_in_folder').whereInIds(folderAppIds);

    const viewableAppsInFolder = await createQueryBuilder(AppBase, 'apps')
      .innerJoin(
        '(' + viewableAppsQb.getQuery() + ')',
        'viewable_apps_join',
        'apps.id = viewable_apps_join.viewable_apps_id'
      )
      .innerJoin(
        '(' + folderAppsQb.getQuery() + ')',
        'apps_in_folder_join',
        'apps.id = apps_in_folder_join.apps_in_folder_id'
      )
      .innerJoin('apps.user', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .setParameters({
        ...folderAppsQb.getParameters(),
        ...viewableAppsQb.getParameters(),
      })
      .take(9)
      .skip(9 * (page - 1))
      .orderBy('apps.createdAt', 'DESC')
      .getMany();

    return viewableAppsInFolder;
  }

  async delete(user: User, id: string) {
    const folder = await this.foldersRepository.findOneOrFail({ id, organizationId: user.organizationId });
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
      .orWhere('apps.user_id = :userId', {
        value: true,
        organizationId: user.organizationId,
        userId: user.id,
      })
      .getMany();

    const allViewableAppIds = allViewableApps.map((app) => app.id);

    folder.folderApps.map((folderApp: FolderApp) => {
      if (!allViewableAppIds.includes(folderApp.appId)) {
        throw new ForbiddenException(
          'Applications not authorised for you are included in the folder, please contact administrator to remove them and try again'
        );
      }
    });
    return await this.foldersRepository.delete({ id, organizationId: user.organizationId });
  }
}
