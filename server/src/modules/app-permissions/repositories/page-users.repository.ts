import { PageUser } from '@entities/page_users.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class PageUsersRepository extends Repository<PageUser> {
  constructor(private dataSource: DataSource) {
    super(PageUser, dataSource.createEntityManager());
  }

  async createPageUsersWithSingle(
    pagePermissionsId: string,
    users: string[],
    manager?: EntityManager
  ): Promise<PageUser[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const pageUsers = users.map((userId) => {
        return manager.create(PageUser, {
          pagePermissionsId,
          userId,
          permissionGroupsId: null,
        });
      });
      return manager.save(pageUsers);
    }, manager || this.manager);
  }

  async createPageUsersWithGroup(
    pagePermissionsId: string,
    groups: string[],
    manager?: EntityManager
  ): Promise<PageUser[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const pageUsers = groups.map((permissionGroupsId) => {
        return manager.create(PageUser, {
          pagePermissionsId,
          permissionGroupsId,
          userId: null,
        });
      });
      return manager.save(pageUsers);
    }, manager || this.manager);
  }
}
