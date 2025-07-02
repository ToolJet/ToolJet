import { ComponentPermission } from '@entities/component_permissions.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ComponentUsersRepository } from './component-users.repository';
import { dbTransactionWrap } from '@helpers/database.helper';
import { PAGE_PERMISSION_TYPE } from '../constants';

@Injectable()
export class ComponentPermissionsRepository extends Repository<ComponentPermission> {
  constructor(private dataSource: DataSource, private readonly componentUsersRepository: ComponentUsersRepository) {
    super(ComponentPermission, dataSource.createEntityManager());
  }

  async getComponentPermissions(componentId: string, manager?: EntityManager): Promise<ComponentPermission[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const componentPermissions = await manager.find(ComponentPermission, {
        where: { componentId },
        relations: ['users', 'users.user', 'users.permissionGroup'],
      });

      return componentPermissions.map((permission) => {
        if (permission.type === PAGE_PERMISSION_TYPE.GROUP) {
          return {
            ...permission,
            groups: permission.users,
            users: undefined,
          };
        }
        return permission;
      });
    }, manager || this.manager);
  }

  async createComponentPermissions(
    componentId: string,
    type: PAGE_PERMISSION_TYPE,
    manager?: EntityManager
  ): Promise<ComponentPermission> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existingPermission = await manager.findOne(ComponentPermission, { where: { componentId } });
      if (existingPermission) {
        throw new Error(`Component permission already exists for Component id: ${componentId}`);
      }

      const componentPermission = manager.create(ComponentPermission, {
        componentId,
        type,
      });
      return manager.save(componentPermission);
    }, manager || this.manager);
  }

  async deleteComponentPermissions(componentId: string, manager?: EntityManager): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(ComponentPermission, { componentId });
    }, manager || this.manager);
  }
}
