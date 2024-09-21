import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationUser } from '../entities/organization_user.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { USER_STATUS, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { UserRoleService } from './user-role.service';
import { USER_ROLE } from '@modules/user_resource_permissions/constants/group-permissions.constant';

@Injectable()
export class SeedsService {
  constructor(private readonly entityManager: EntityManager, private userRoleService: UserRoleService) {}

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

      // Create test user
      const testUser = manager.create(User, {
        firstName: 'ToolJet',
        lastName: 'User',
        email: 'test@tooljet.com',
        password: 'password',
        defaultOrganizationId: organization.id,
        status: USER_STATUS.ACTIVE,
      });
      testUser.organizationId = organization.id;

      await manager.save(testUser);
      // Save test user

      // TODO: Remove role usage
      const organizationUser = manager.create(OrganizationUser, {
        organizationId: organization.id,
        userId: user.id,
        role: 'all_users',
        status: WORKSPACE_USER_STATUS.ACTIVE,
      });

      await this.createDefaultEnvironments(organization.id, manager);

      await manager.save(organizationUser);

      // Test user organization mapping
      const testUserOrganization = manager.create(OrganizationUser, {
        organizationId: organization.id,
        userId: testUser.id,
        role: 'all_users',
        status: WORKSPACE_USER_STATUS.ACTIVE,
      });

      await manager.save(testUserOrganization);
      // Save Test user organization mapping

      await this.createDefaultUserGroups(manager, user, USER_ROLE.ADMIN);
      await this.createDefaultUserGroups(manager, testUser, USER_ROLE.BUILDER);

      // Adding test user to group

      console.log(
        'Seeding complete. Use default credentials to login.\n' + 'email: dev@tooljet.io\n' + 'password: password'
      );
    });
  }

  async createDefaultUserGroups(manager: EntityManager, user: User, role: USER_ROLE): Promise<void> {
    if (role === USER_ROLE.ADMIN) await this.userRoleService.createDefaultGroups(user.organizationId, manager);
    await this.userRoleService.addUserRole({ role, userId: user.id }, user.organizationId, manager);
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
