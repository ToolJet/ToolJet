import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { Folder } from '../entities/folder.entity';

@Injectable()
export class FoldersService {

  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
    @InjectRepository(FolderApp)
    private folderAppsRepository: Repository<FolderApp>,
    @InjectRepository(App)
    private appsRepository: Repository<App>,
  ) { }

  async create(user: User, folderName): Promise<Folder> {
    return this.foldersRepository.save(this.foldersRepository.create({
        name: folderName,
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: user.organizationId,
    }));
  }

  async all(user: User): Promise<Folder[]> {

    return await this.foldersRepository.find({
        where: {
            organizationId: user.organizationId,
        },
        relations: ['folderApps'],
        order: {
            name: 'ASC'
        }
    });
  }

  async findOne(folderId: string ): Promise<Folder> {
    return await this.foldersRepository.findOneOrFail(folderId);
  }

  async userAppCount(user: User, folder: Folder) {
    const result = await this.foldersRepository
      .createQueryBuilder('folder')
      .where("id = :id", { id: folder.id })
      .loadRelationCountAndMap(
        'folder.appCount', 'folder.apps', 'apps',
        qb => qb.andWhere("apps.user_id = :user_id", { user_id: user.id })
      )
      .getMany();

    return result[0].appCount;
  }

  async getAppsFor(user: User, folder: Folder, page: number): Promise<App[]> {
    const folderApps = await this.folderAppsRepository.find({
      where: {
        folderId: folder.id
      }
    });

    const apps = await this.appsRepository.findByIds(folderApps.map(folderApp => folderApp.appId), {
      where: {
        user
      },
      relations: ['user'],
      take: 10,
      skip: 10 * (page - 1),
      order: {
        createdAt: 'DESC'
      }
    });

    return apps;
  }
}
