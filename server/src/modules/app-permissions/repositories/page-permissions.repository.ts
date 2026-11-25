import { PagePermission } from '@entities/page_permissions.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { PageUsersRepository } from './page-users.repository';
import { dbTransactionWrap } from '@helpers/database.helper';
import { PAGE_PERMISSION_TYPE } from '../constants';
import { toSafeAccessRuleUser } from '../helpers/safe-user.helper';

@Injectable()
export class PagePermissionsRepository extends Repository<PagePermission> {
  constructor(
    private dataSource: DataSource,
    private readonly pageUsersRepository: PageUsersRepository
  ) {
    super(PagePermission, dataSource.createEntityManager());
  }

  async getPagePermissions(pageId: string, manager?: EntityManager): Promise<PagePermission[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const pagePermissions = await manager.find(PagePermission, {
        where: { pageId },
        relations: ['users', 'users.user', 'users.permissionGroup'],
      });

      return pagePermissions.map((permission) => {
        const users = permission.users?.map((pageUser) => ({
          ...pageUser,
          user: toSafeAccessRuleUser(pageUser.user),
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

  async getPagePermissionsForPages(pageIds: string[], manager?: EntityManager): Promise<PagePermission[]> {
    if (!pageIds.length) return [];
    const m = manager || this.manager;
    return m.find(PagePermission, {
      where: { pageId: In(pageIds) },
      relations: ['users', 'users.user'],
    });
  }

  async createPagePermissions(
    pageId: string,
    type: PAGE_PERMISSION_TYPE,
    manager?: EntityManager
  ): Promise<PagePermission> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existingPermission = await manager.findOne(PagePermission, { where: { pageId } });
      if (existingPermission) {
        throw new Error(`Page permission already exists for Page id: ${pageId}`);
      }

      const pagePermission = manager.create(PagePermission, {
        pageId,
        type,
      });
      return manager.save(pagePermission);
    }, manager || this.manager);
  }

  async deletePagePermissions(pageId: string, manager?: EntityManager): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(PagePermission, { pageId });
    }, manager || this.manager);
  }
}
