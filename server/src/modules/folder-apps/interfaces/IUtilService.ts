import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { EntityManager } from 'typeorm';
import { AppBase } from '@entities/app_base.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { UserAppsPermissions, UserWorkflowPermissions } from '@modules/ability/types';
import { APP_TYPES } from '@modules/apps/constants';

export interface IFolderAppsUtilService {
  findFolderAppsForFolders(
    folderIds: string[],
    userAppPermissions: UserAppsPermissions | UserWorkflowPermissions,
    manager: EntityManager,
    type?: APP_TYPES,
    searchKey?: string,
    branchId?: string
  ): Promise<FolderApp[]>;
  getAppsFor(
    user: User,
    folder: Folder,
    page: number,
    searchKey: string,
    type?: APP_TYPES,
    branchId?: string
  ): Promise<{ viewableApps: AppBase[]; totalCount: number }>;
  bulkCreate(folderId: string, appIds: string[], branchId?: string): Promise<FolderApp[]>;
}
