import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FolderApp } from 'src/entities/folder_app.entity';
import { getFolderQuery } from 'src/helpers/queries';
import { createQueryBuilder, Repository, UpdateResult } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { Folder } from '../entities/folder.entity';
import { catchDbException } from 'src/helpers/utils.helper';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { AppBase } from 'src/entities/app_base.entity';
import { TOOLJET_RESOURCE } from 'src/constants/global.constant';
import { AbilityService } from './permissions-ability.service';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
    @InjectRepository(FolderApp)
    private folderAppsRepository: Repository<FolderApp>,

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

  async allFolders(user: User, searchKey?: string): Promise<Folder[]> {
    return await getFolderQuery(user.organizationId, searchKey).distinct().getMany();
  }

  async all(user: User, searchKey: string): Promise<Folder[]> {
    const allFolderList = await this.allFolders(user);
    return allFolderList;
  }

  async findOne(folderId: string): Promise<Folder> {
    return await this.foldersRepository.findOneOrFail(folderId);
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
    const folderApps = await this.folderAppsRepository.find({
      where: {
        folderId: folder.id,
      },
    });

    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: TOOLJET_RESOURCE.APP }],
      organizationId: user.organizationId,
    });
    const userAppPermissions = userPermission?.[TOOLJET_RESOURCE.APP];

    const folderAppIds = folderApps.map((folderApp) => folderApp.appId);

    if (folderAppIds.length == 0 || userAppPermissions?.hideAll) {
      return {
        viewableApps: [],
        totalCount: 0,
      };
    }
    const viewableAppsTotal = Array.from(
      new Set(
        [...userAppPermissions.editableAppsId, ...userAppPermissions.viewableAppsId].filter(
          (id) => !userAppPermissions.hiddenAppsId.includes(id)
        )
      )
    );

    const viewableAppIds = viewableAppsTotal.filter((id) => folderAppIds.includes(id));

    const viewableAppsInFolder = createQueryBuilder(AppBase, 'apps')
      .innerJoin('apps.user', 'user')
      .addSelect(['user.firstName', 'user.lastName']);

    if (!(userAppPermissions.isAllEditable || userAppPermissions.isAllViewable)) {
      viewableAppsInFolder.where('apps.id IN (...viewableAppIds)', {
        viewableAppIds,
      });
    } else {
      viewableAppsInFolder.where('apps.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });
    }

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
  }

  async delete(user: User, id: string) {
    const folder = await this.foldersRepository.findOneOrFail({ id, organizationId: user.organizationId });
    return await this.foldersRepository.delete({ id: folder.id, organizationId: user.organizationId });
  }
}
