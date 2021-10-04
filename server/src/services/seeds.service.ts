import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationUser } from '../entities/organization_user.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';

@Injectable()
export class SeedsService {
  constructor(private readonly entityManager: EntityManager) {}

  async perform(): Promise<void> {
    await this.entityManager.transaction(async (manager) => {
      const defaultUser = manager.findOne(User, {
        email: 'dev@tooljet.io',
      });

      if (defaultUser) {
        console.log('Default user already present. Skipping seed.');
        return;
      }

      const organization = manager.create(Organization, {
        name: 'My organization',
      });

      await manager.save(organization);

      const user = manager.create(User, {
        firstName: 'The',
        lastName: 'Developer',
        email: 'dev@tooljet.io',
        password: 'password',
        organizationId: organization.id,
      });

      await manager.save(user);

      // TODO: Remove role usage
      const organizationUser = manager.create(OrganizationUser, {
        organizationId: organization.id,
        userId: user.id,
        role: 'all_users',
        status: 'active',
      });

      await manager.save(organizationUser);

      await this.createDefaultUserGroups(manager, user);
    });
  }

  async createDefaultUserGroups(manager: EntityManager, user: User): Promise<void> {
    const defaultGroups = ['all_users', 'admin'];
    for (const group of defaultGroups) {
      await this.createGroupAndAssociateUser(group, manager, user);
    }
  }

  async createGroupAndAssociateUser(group: string, manager: EntityManager, user: User): Promise<void> {
    const groupPermission = manager.create(GroupPermission, {
      organizationId: user.organizationId,
      group: group,
    });

    await manager.save(groupPermission);

    const userGroupPermission = manager.create(UserGroupPermission, {
      groupPermissionId: groupPermission.id,
      userId: user.id,
    });

    await manager.save(userGroupPermission);
  }
}
