import { ComponentUser } from '@entities/component_users.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { ComponentPermission } from '@entities/component_permissions.entity';

@Injectable()
export class ComponentUsersRepository extends Repository<ComponentUser> {
  constructor(private dataSource: DataSource) {
    super(ComponentUser, dataSource.createEntityManager());
  }

  async createComponentUsersWithSingle(
    componentPermissionsId: string,
    users: string[],
    manager?: EntityManager
  ): Promise<ComponentUser[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const componentUsers = users.map((userId) => {
        return manager.create(ComponentUser, {
          componentPermissionsId,
          userId,
          permissionGroupsId: null,
        });
      });
      return manager.save(componentUsers);
    }, manager || this.manager);
  }

  async createComponentUsersWithGroup(
    componentPermissionsId: string,
    groups: string[],
    manager?: EntityManager
  ): Promise<ComponentUser[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const componentUsers = groups.map((permissionGroupsId) => {
        return manager.create(ComponentUser, {
          componentPermissionsId,
          permissionGroupsId,
          userId: null,
        });
      });
      return manager.save(componentUsers);
    }, manager || this.manager);
  }

  async checkComponentUserWithGroup(
    componentPermission: ComponentPermission,
    userId: string,
    manager?: EntityManager
  ): Promise<boolean> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const result = await manager
        .createQueryBuilder(ComponentUser, 'component_users')
        .innerJoin('component_users.permissionGroup', 'group')
        .innerJoin('group.groupUsers', 'groupUser')
        .where('component_users.componentPermission = :permissionId', {
          permissionId: componentPermission.id,
        })
        .andWhere('groupUser.userId = :userId', { userId })
        .getOne();

      return !!result;
    }, manager || this.manager);
  }

  async checkComponentUserWithSingle(
    componentPermission: ComponentPermission,
    userId: string,
    manager?: EntityManager
  ): Promise<boolean> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const componentUser = await manager.findOne(ComponentUser, {
        where: {
          componentPermission: { id: componentPermission.id },
          userId,
        },
      });

      return !!componentUser;
    }, manager || this.manager);
  }

  async checkManyComponentUsersWithGroups(
    permissionIds: string[],
    userId: string,
    manager: EntityManager
  ): Promise<Set<string>> {
    if (permissionIds.length === 0) return new Set();
    const results = await manager
      .createQueryBuilder(ComponentUser, 'component_user')
      .innerJoin('component_user.permissionGroup', 'group')
      .innerJoin('group.groupUsers', 'groupUser')
      .where('component_user.componentPermissionId IN (:...permissionIds)', { permissionIds })
      .andWhere('groupUser.userId = :userId', { userId })
      .select('component_user.componentPermissionId', 'permissionId')
      .distinct(true)
      .getRawMany();

    return new Set(results.map((r) => r.permissionId));
  }

  async checkManyComponentUsersWithSingle(
    permissionIds: string[],
    userId: string,
    manager: EntityManager
  ): Promise<Set<string>> {
    if (permissionIds.length === 0) return new Set();
    const results = await manager
      .createQueryBuilder(ComponentUser, 'component_user')
      .where('component_user.componentPermissionId IN (:...permissionIds)', { permissionIds })
      .andWhere('component_user.userId = :userId', { userId })
      .select('component_user.componentPermissionId', 'permissionId')
      .distinct(true)
      .getRawMany();

    return new Set(results.map((r) => r.permissionId));
  }
}
