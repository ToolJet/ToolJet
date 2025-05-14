import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { EntityManager } from 'typeorm';
import { AppBase } from '@entities/app_base.entity';
import { UserAppsPermissions } from '@modules/ability/types';
import { APP_TYPES } from '@modules/apps/constants';

export interface IFolderAppsUtilService {
  allFoldersWithAppCount(
    user: User,
    userAppPermissions: UserAppsPermissions,
    manager: EntityManager,
    type?: string,
    searchKey?: string
  ): Promise<Folder[]>;
  getAppsFor(
    user: User,
    folder: Folder,
    page: number,
    searchKey: string,
    type?: APP_TYPES
  ): Promise<{ viewableApps: AppBase[]; totalCount: number }>;
}
