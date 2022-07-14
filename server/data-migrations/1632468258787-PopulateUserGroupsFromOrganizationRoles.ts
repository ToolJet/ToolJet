import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { Organization } from '../src/entities/organization.entity';
import { GroupPermission } from '../src/entities/group_permission.entity';
import { AppGroupPermission } from '../src/entities/app_group_permission.entity';
import { UserGroupPermission } from '../src/entities/user_group_permission.entity';
import { App } from '../src/entities/app.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';

export class PopulateUserGroupsFromOrganizationRoles1632468258787 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const OrganizationRepository = entityManager.getRepository(Organization);

    const organizations = await OrganizationRepository.find({ select: ['id'] });

    for (const organization of organizations) {
      const groupPermissions = await setupInitialGroupPermissions(entityManager, organization);
      await setupUserAndAppGroupPermissions(entityManager, organization, groupPermissions);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    await entityManager.createQueryBuilder().delete().from(GroupPermission).execute();

    await entityManager.createQueryBuilder().delete().from(AppGroupPermission).execute();

    await entityManager.createQueryBuilder().delete().from(UserGroupPermission).execute();
  }
}

async function setupInitialGroupPermissions(
  entityManager: EntityManager,
  organization: Organization
): Promise<Array<GroupPermission>> {
  const existingRoles = ['admin', 'developer', 'viewer'];
  const groupsToCreate = ['all_users', ...existingRoles];
  const createdGroupPermissionIds = [];

  for (const group of groupsToCreate) {
    // Note: Since we are running data population as a part of migrations
    // queries run should explicitly mention what columns are being used and
    // what data is returned. This is because the entity at hand can be updated
    // at code and the database schema would not represent it when migrations
    // are run.
    const insertResult = await entityManager
      .createQueryBuilder()
      .insert()
      .into(GroupPermission, ['organizationId', 'group'])
      .values({
        organizationId: organization.id,
        group: group,
      })
      .returning('id')
      .execute();

    createdGroupPermissionIds.push(insertResult.raw[0].id);
  }

  const groupPermissionRepository = entityManager.getRepository(GroupPermission);

  return await groupPermissionRepository.findByIds(createdGroupPermissionIds, {
    select: ['id', 'group', 'organizationId'],
  });
}

async function setupUserAndAppGroupPermissions(
  entityManager: EntityManager,
  organization: Organization,
  createdGroupPermissions: Array<GroupPermission>
): Promise<void> {
  const appRepository = entityManager.getRepository(App);

  const organizationApps = await appRepository.find({
    where: { organizationId: organization.id },
    select: ['id'],
  });

  for (const groupPermission of createdGroupPermissions) {
    const orgUsers = await entityManager.find(OrganizationUser, {
      where: { organizationId: organization.id },
      select: ['id', 'role'],
    });
    const usersForGroup = orgUsers.filter(
      (u) => u.role == groupPermission.group || groupPermission.group == 'all_users'
    );

    for (const user of usersForGroup) {
      await entityManager
        .createQueryBuilder()
        .insert()
        .into(UserGroupPermission, ['groupPermissionId', 'userId'])
        .values({
          groupPermissionId: groupPermission.id,
          userId: user.id,
        })
        .returning('id')
        .execute();
    }

    const permissions = determinePermissionsForGroup(groupPermission.group);

    for (const app of organizationApps) {
      await entityManager
        .createQueryBuilder()
        .insert()
        .into(AppGroupPermission, ['groupPermissionId', 'appId', 'read', 'update', 'delete'])
        .values({
          groupPermissionId: groupPermission.id,
          appId: app.id,
          ...permissions,
        })
        .returning('id')
        .execute();
    }
  }
}

function determinePermissionsForGroup(group: string): {
  read: boolean;
  update: boolean;
  delete: boolean;
} {
  switch (group) {
    case 'all_users':
      return { read: true, update: false, delete: false };
    case 'admin':
      return { read: true, update: true, delete: true };
    case 'developer':
      return { read: true, update: true, delete: true };
    case 'viewer':
      return { read: true, update: false, delete: false };
  }
}
