import { PageUser } from '@entities/page_users.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { PagePermission } from '@entities/page_permissions.entity';

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

  async checkIfUserExistsInPermissionGroup(
    pagePermission: PagePermission,
    userId: string,
    manager?: EntityManager
  ): Promise<PageUser> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const result = await manager
        .createQueryBuilder(PageUser, 'page_users')
        .innerJoin('page_users.permissionGroup', 'group')
        .innerJoin('group.groupUsers', 'groupUser')
        .where('page_users.pagePermission = :permissionId', {
          permissionId: pagePermission.id,
        })
        .andWhere('groupUser.userId = :userId', { userId })
        .getOne();

      if (!result) {
        return false;
      }

      return pagePermission;
    }, manager || this.manager);
  }

  async checkIfUserExistsInSingleConfig(
    pagePermission: PagePermission,
    userId: string,
    manager?: EntityManager
  ): Promise<PageUser> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const pageUser = await manager.findOne(PageUser, {
        where: {
          pagePermission: { id: pagePermission.id },
          userId,
        },
      });

      if (!pageUser) {
        return false;
      }

      return pagePermission;
    }, manager || this.manager);
  }
}
