import { DataSource, EntityManager, Repository } from 'typeorm';
import { GroupPermissions } from '@entities/group_permissions.entity';

interface IGroupPermissionRepository extends Repository<GroupPermissions> {
  getAllUserGroups(userId: string, organizationId: string, manager: EntityManager): Promise<GroupPermissions[]>;
}

export class GroupPermissionRepository extends Repository<GroupPermissions> implements IGroupPermissionRepository {
  constructor(private dataSource: DataSource) {
    super(GroupPermissions, dataSource.createEntityManager());
  }

  getAllUserGroups(userId: string, organizationId: string, manager: EntityManager): Promise<GroupPermissions[]> {
    return manager.find(GroupPermissions, {
      where: {
        organizationId: organizationId,
        groupUsers: {
          userId: userId,
        },
      },
      relations: ['groupUsers'],
    });
  }
}
