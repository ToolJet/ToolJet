import { QueryUser } from '@entities/query_users.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class QueryUsersRepository extends Repository<QueryUser> {
  constructor(private dataSource: DataSource) {
    super(QueryUser, dataSource.createEntityManager());
  }

  async createQueryUsersWithSingle(
    queryPermissionsId: string,
    users: string[],
    manager?: EntityManager
  ): Promise<QueryUser[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const queryUsers = users.map((userId) => {
        return manager.create(QueryUser, {
          queryPermissionsId,
          userId,
          permissionGroupsId: null,
        });
      });
      return manager.save(queryUsers);
    }, manager || this.manager);
  }

  async createQueryUsersWithGroup(
    queryPermissionsId: string,
    groups: string[],
    manager?: EntityManager
  ): Promise<QueryUser[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const queryUsers = groups.map((permissionGroupsId) => {
        return manager.create(QueryUser, {
          queryPermissionsId,
          permissionGroupsId,
          userId: null,
        });
      });
      return manager.save(queryUsers);
    }, manager || this.manager);
  }
}
