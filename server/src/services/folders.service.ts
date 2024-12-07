import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FolderApp } from 'src/entities/folder_app.entity';
import { getFolderQuery, getAllFoldersQuery } from 'src/helpers/queries';

import { User } from '../../src/entities/user.entity';
import { Folder } from '../entities/folder.entity';
import { catchDbException } from 'src/helpers/utils.helper';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { AppBase } from 'src/entities/app_base.entity';
import { TOOLJET_RESOURCE } from 'src/constants/global.constant';
import { AbilityService } from './permissions-ability.service';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager, Repository, UpdateResult } from 'typeorm';
import { UserAppsPermissions } from '@modules/permissions/interface/permissions-ability.interface';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,

    private abilityService: AbilityService
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

  async allFoldersWithAppCount(
    user: User,
    userAppPermissions: UserAppsPermissions,
    searchKey?: string
  ): Promise<Folder[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getFolderQuery(user.organizationId, manager, userAppPermissions, searchKey).distinct().getMany();
    });
  }

  async allFolders(user: User, type = 'front-end'): Promise<Folder[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getAllFoldersQuery(user.organizationId, manager, type).getMany();
    });
  }

  async all(user: User, searchKey: string): Promise<Folder[]> {
    const userAppPermissions = (
      await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: TOOLJET_RESOURCE.APP }],
        organizationId: user.organizationId,
      })
    ).App;

    const allFolderList = await this.allFolders(user);
    if (allFolderList.length === 0) {
      return allFolderList;
    }

    const folders = await this.allFoldersWithAppCount(user, userAppPermissions, searchKey);

    allFolderList.forEach((folder, index) => {
      const currentFolder = folders.find((f) => f.id === folder.id);
      if (currentFolder) {
        allFolderList[index].folderApps = [...(currentFolder?.folderApps || [])];
        allFolderList[index].generateCount();
        console.log('folder found');
      } else {
        allFolderList[index].folderApps = [];
        allFolderList[index].generateCount();
        console.log('folder  not found');
      }
    });
    return allFolderList;
  }

  async findOne(folderId: string): Promise<Folder> {
    return await this.foldersRepository.findOneOrFail({ where: { id: folderId } });
  }

  async getAppsFor(
    user: User,
    folder: Folder,
    page: number,
    searchKey: string
  ): Promise<{
    viewableApps: AppBase[];
    totalCount: number;
  }> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const folderApps = await manager
        .createQueryBuilder(FolderApp, 'folderApp')
        .innerJoin('folderApp.app', 'app', 'folderApp.folderId = :id', {
          id: folder.id,
        })
        .where('LOWER(app.name) LIKE :name', { name: `%${(searchKey ?? '').toLowerCase()}%` })
        .getMany();

      const userPermission = await this.abilityService.resourceActionsPermission(user, {
        resources: [{ resource: TOOLJET_RESOURCE.APP }],
        organizationId: user.organizationId,
      });
      const userAppPermissions = userPermission?.[TOOLJET_RESOURCE.APP];

      const folderAppIds = folderApps.map((folderApp) => folderApp.appId);
      if (folderAppIds.length == 0) {
        return {
          viewableApps: [],
          totalCount: 0,
        };
      }
      const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;
      const viewableAppsTotal = isAllEditable
        ? [null, ...folderAppIds]
        : hideAll
        ? [null, ...userAppPermissions.editableAppsId]
        : isAllViewable
        ? [null, ...folderAppIds].filter((id) => !userAppPermissions.hiddenAppsId.includes(id))
        : [
            null,
            ...Array.from(
              new Set([
                ...userAppPermissions.editableAppsId,
                ...userAppPermissions.viewableAppsId.filter((id) => !userAppPermissions.hiddenAppsId.includes(id)),
              ])
            ),
          ];

      const viewableAppIds = [null, ...viewableAppsTotal.filter((id) => folderAppIds.includes(id))];

      const viewableAppsInFolder = manager
        .createQueryBuilder(AppBase, 'apps')
        .innerJoin('apps.user', 'user')
        .addSelect(['user.firstName', 'user.lastName']);

      viewableAppsInFolder.where('apps.id IN (:...viewableAppIds)', {
        viewableAppIds: viewableAppIds,
      });

      const [viewableApps, totalCount] = await Promise.all([
        viewableAppsInFolder
          .take(9)
          .skip(9 * (page - 1))
          .orderBy('apps.createdAt', 'DESC')
          .getMany(),
        viewableAppsInFolder.getCount(),
      ]);

      return {
        viewableApps,
        totalCount,
      };
    });
  }

  async delete(user: User, id: string) {
    const folder = await this.foldersRepository.findOneOrFail({ where: { id, organizationId: user.organizationId } });
    return await this.foldersRepository.delete({ id: folder.id, organizationId: user.organizationId });
  }
}
