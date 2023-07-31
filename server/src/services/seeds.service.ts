import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationUser } from '../entities/organization_user.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { USER_STATUS, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';

@Injectable()
export class SeedsService {
  constructor(private readonly entityManager: EntityManager) {}

  async perform(): Promise<void> {
    await this.entityManager.transaction(async (manager) => {
      const defaultUser = await manager.findOne(User, {
        where: {
          email: 'dev@tooljet.io',
        },
      });

      if (defaultUser) return;

      const organization = manager.create(Organization, {
        ssoConfigs: [
          {
            enabled: true,
            sso: 'form',
          },
        ],
        name: 'My workspace',
        slug: 'my-workspace',
      });

      await manager.save(organization);

      const user = manager.create(User, {
        firstName: 'The',
        lastName: 'Developer',
        email: 'dev@tooljet.io',
        password: 'password',
        defaultOrganizationId: organization.id,
        status: USER_STATUS.ACTIVE,
      });
      user.organizationId = organization.id;

      await manager.save(user);

      // TODO: Remove role usage
      const organizationUser = manager.create(OrganizationUser, {
        organizationId: organization.id,
        userId: user.id,
        role: 'all_users',
        status: WORKSPACE_USER_STATUS.ACTIVE,
      });

      await this.createDefaultEnvironments(organization.id, manager);

      await manager.save(organizationUser);

      await this.createDefaultUserGroups(manager, user);

      console.log(
        'Seeding complete. Use default credentials to login.\n' + 'email: dev@tooljet.io\n' + 'password: password'
      );
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
      appCreate: group == 'admin',
      appDelete: group == 'admin',
      folderCreate: group == 'admin',
      orgEnvironmentVariableCreate: group == 'admin',
      orgEnvironmentVariableUpdate: group == 'admin',
      orgEnvironmentVariableDelete: group == 'admin',
      folderUpdate: group == 'admin',
      folderDelete: group == 'admin',
    });

    await manager.save(groupPermission);

    const userGroupPermission = manager.create(UserGroupPermission, {
      groupPermissionId: groupPermission.id,
      userId: user.id,
    });

    await manager.save(userGroupPermission);
  }

  async createDefaultEnvironments(organizationId: string, manager: EntityManager) {
    await Promise.all(
      defaultAppEnvironments.map(async (en) => {
        const env = manager.create(AppEnvironment, {
          organizationId: organizationId,
          name: en.name,
          isDefault: en.isDefault,
          priority: en.priority,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await manager.save(env);
      })
    );
  }
}
