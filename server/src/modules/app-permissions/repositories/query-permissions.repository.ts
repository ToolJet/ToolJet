import { QueryPermission } from '@entities/query_permissions.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { QueryUsersRepository } from './query-users.repository';
import { dbTransactionWrap } from '@helpers/database.helper';
import { PAGE_PERMISSION_TYPE } from '../constants';
import { toSafeAccessRuleUser } from '../helpers/safe-user.helper';

@Injectable()
export class QueryPermissionsRepository extends Repository<QueryPermission> {
  constructor(
    private dataSource: DataSource,
    private readonly queryUsersRepository: QueryUsersRepository
  ) {
    super(QueryPermission, dataSource.createEntityManager());
  }

  async getQueryPermissions(queryId: string, manager?: EntityManager): Promise<QueryPermission[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const queryPermissions = await manager.find(QueryPermission, {
        where: { queryId },
        relations: ['users', 'users.user', 'users.permissionGroup'],
      });

      return queryPermissions.map((permission) => {
        const users = permission.users?.map((queryUser) => ({
          ...queryUser,
          user: toSafeAccessRuleUser(queryUser.user),
        }));

        if (permission.type === PAGE_PERMISSION_TYPE.GROUP) {
          return {
            ...permission,
            groups: users,
            users: undefined,
          };
        }
        return { ...permission, users };
      });
    }, manager || this.manager);
  }

  async createQueryPermissions(
    queryId: string,
    type: PAGE_PERMISSION_TYPE,
    manager?: EntityManager
  ): Promise<QueryPermission> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existingPermission = await manager.findOne(QueryPermission, { where: { queryId } });
      if (existingPermission) {
        throw new Error(`Query permission already exists for Query id: ${queryId}`);
      }

      const queryPermission = manager.create(QueryPermission, {
        queryId,
        type,
      });
      return manager.save(queryPermission);
    }, manager || this.manager);
  }

  async deleteQueryPermissions(queryId: string, manager?: EntityManager): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(QueryPermission, { queryId });
    }, manager || this.manager);
  }
}
