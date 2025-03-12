import { Injectable } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '@entities/user.entity';
import { Folder } from '@entities/folder.entity';
import { IFoldersUtilService } from './interfaces/IUtilService';
@Injectable()
export class FoldersUtilService implements IFoldersUtilService {
  async allFolders(user: User, manager: EntityManager, type = 'front-end'): Promise<Folder[]> {
    return this.getAllFoldersQuery(user.organizationId, manager, type).getMany();
  }
  async findOne(folderId: string, manager: EntityManager): Promise<Folder> {
    return await manager.findOneOrFail(Folder, { where: { id: folderId } });
  }

  private getAllFoldersQuery(
    organizationId: string,
    manager: EntityManager,
    type = 'front-end'
  ): SelectQueryBuilder<Folder> {
    const query = manager.createQueryBuilder(Folder, 'folders');
    query
      .andWhere('folders.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere('folders.type = :type', {
        type,
      })
      .orderBy('folders.name', 'ASC');

    return query;
  }
}
