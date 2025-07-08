import { QueryUser } from '@entities/query_users.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { QueryPermission } from '@entities/query_permissions.entity';

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

  async checkQueryUserWithGroup(
    queryPermission: QueryPermission,
    userId: string,
    manager?: EntityManager
  ): Promise<boolean> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const result = await manager
        .createQueryBuilder(QueryUser, 'query_users')
        .innerJoin('query_users.permissionGroup', 'group')
        .innerJoin('group.groupUsers', 'groupUser')
        .where('query_users.queryPermission = :permissionId', {
          permissionId: queryPermission.id,
        })
        .andWhere('groupUser.userId = :userId', { userId })
        .getOne();

      return !!result;
    }, manager || this.manager);
  }

  async checkQueryUserWithSingle(
    queryPermission: QueryPermission,
    userId: string,
    manager?: EntityManager
  ): Promise<boolean> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const queryUser = await manager.findOne(QueryUser, {
        where: {
          queryPermission: { id: queryPermission.id },
          userId,
        },
      });

      return !!queryUser;
    }, manager || this.manager);
  }
}
