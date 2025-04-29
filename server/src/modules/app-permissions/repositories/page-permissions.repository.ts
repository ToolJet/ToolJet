import { PagePermission } from '@entities/page_permissions.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PageUsersRepository } from './page-users.repository';
import { dbTransactionWrap } from '@helpers/database.helper';
import { PAGE_PERMISSION_TYPE } from '../constants';

@Injectable()
export class PagePermissionsRepository extends Repository<PagePermission> {
  constructor(private dataSource: DataSource, private readonly pageUsersRepository: PageUsersRepository) {
    super(PagePermission, dataSource.createEntityManager());
  }

  async getPagePermissions(pageId: string, manager?: EntityManager): Promise<PagePermission[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const pagePermissions = await manager.find(PagePermission, {
        where: { pageId },
        relations: ['users', 'users.user', 'users.permissionGroup'],
      });

      return pagePermissions.map((permission) => {
        return {
          ...permission,
          users: permission.users,
        };
      });
    }, manager || this.manager);
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
