import { BadRequestException, Injectable } from '@nestjs/common';
import { FolderApp } from '../../entities/folder_app.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { decamelizeKeys } from 'humps';
import { FoldersUtilService } from '@modules/folders/util.service';
import { FolderAppsUtilService } from './util.service';
import { IFolderAppsService } from './interfaces/IService';
import { MODULES } from '@modules/app/constants/modules';
import { AbilityService } from '@modules/ability/interfaces/IService';
@Injectable()
export class FolderAppsService implements IFolderAppsService {
  constructor(
    protected abilityService: AbilityService,
    protected foldersUtilService: FoldersUtilService,
    protected folderAppsUtilService: FolderAppsUtilService
  ) {}

  async create(folderId: string, appId: string): Promise<FolderApp> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existingFolderApp = await manager.findOne(FolderApp, {
        where: { appId, folderId },
      });

      if (existingFolderApp) {
        throw new BadRequestException('App has already been added to the folder');
      }

      // TODO: check if folder under user.organizationId and user has edit permission on app

      const newFolderApp = manager.create(FolderApp, {
        folderId,
        appId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const folderApp = await manager.save(FolderApp, newFolderApp);

      return folderApp;
    });
  }

  async remove(folderId: string, appId: string): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // TODO: folder under user.organizationId
      return await manager.delete(FolderApp, { folderId, appId });
    });
  }
  async getFolders(user, query) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const type = query.type;
      const searchKey = query.searchKey;
      const userAppPermissions = (
        await this.abilityService.resourceActionsPermission(user, {
          resources: [{ resource: MODULES.APP }],
          organizationId: user.organizationId,
        })
      )?.[MODULES.APP];
      const allFolderList = await this.foldersUtilService.allFolders(user, manager, type);
      if (allFolderList.length === 0) {
        return { folders: [] };
      }
      const folders = await this.folderAppsUtilService.allFoldersWithAppCount(
        user,
        userAppPermissions,
        manager,
        type,
        searchKey
      );
      allFolderList.forEach((folder, index) => {
        const currentFolder = folders.find((f) => f.id === folder.id);
        if (currentFolder) {
          allFolderList[index].folderApps = [...(currentFolder?.folderApps || [])];
          allFolderList[index].generateCount();
        } else {
          allFolderList[index].folderApps = [];
          allFolderList[index].generateCount();
        }
      });
      return decamelizeKeys({ folders: allFolderList });
    });
  }
}
