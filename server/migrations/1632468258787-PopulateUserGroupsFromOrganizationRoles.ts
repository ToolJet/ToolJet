import { EntityManager, In, MigrationInterface, QueryRunner } from "typeorm";
import { Organization } from "../src/entities/organization.entity";
import { GroupPermission } from "../src/entities/group_permission.entity";
import { AppGroupPermission } from "../src/entities/app_group_permission.entity";
import { UserGroupPermission } from "../src/entities/user_group_permission.entity";
import { App } from "../src/entities/app.entity";

export class PopulateUserGroupsFromOrganizationRoles1632468258787
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const OrganizationRepository = entityManager.getRepository(Organization);

    const organizations = await OrganizationRepository.find({
      relations: ["users"],
    });

    for (let organization of organizations) {
      const groupPermissions = await setupInitialGroupPermissions(
        entityManager,
        organization
      );
      await setupUserAndAppGroupPermissions(
        entityManager,
        organization,
        groupPermissions
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    entityManager.createQueryBuilder().delete().from(GroupPermission).execute();

    entityManager
      .createQueryBuilder()
      .delete()
      .from(AppGroupPermission)
      .execute();

    entityManager
      .createQueryBuilder()
      .delete()
      .from(UserGroupPermission)
      .execute();
  }
}

async function setupInitialGroupPermissions(
  entityManager: EntityManager,
  organization: Organization
): Promise<Array<GroupPermission>> {
  const existingRoles = ["admin", "developer", "viewer"];
  const groupsToCreate = ["all_users", ...existingRoles];
  const createdGroupPermissions = [];

  const groupPermissionRepository =
    entityManager.getRepository(GroupPermission);

  for (const group of groupsToCreate) {
    const groupPermission = groupPermissionRepository.create({
      organizationId: organization.id,
      group: group,
    });
    await groupPermissionRepository.save(groupPermission);
    createdGroupPermissions.push(groupPermission);
  }

  return createdGroupPermissions;
}

async function setupUserAndAppGroupPermissions(
  entityManager: EntityManager,
  organization: Organization,
  createdGroupPermissions: Array<GroupPermission>
): Promise<void> {
  const userGroupPermissionRepository =
    entityManager.getRepository(UserGroupPermission);

  const appGroupPermissionRepository =
    entityManager.getRepository(AppGroupPermission);

  const appRepository = entityManager.getRepository(App);

  const organizationApps = await appRepository.find({
    organizationId: organization.id,
  });

  for (const groupPermission of createdGroupPermissions) {
    const usersForGroup = organization.users.filter(
      (u) =>
        u.role == groupPermission.group || groupPermission.group == "all_users"
    );

    for (const user of usersForGroup) {
      const userGroupPermission = userGroupPermissionRepository.create({
        groupPermissionId: groupPermission.id,
        userId: user.id,
      });
      await userGroupPermissionRepository.save(userGroupPermission);
    }

    const permissions = determinePermissionsForGroup(groupPermission.group);

    for (const app of organizationApps) {
      const appGroupPermission = appGroupPermissionRepository.create({
        groupPermissionId: groupPermission.id,
        appId: app.id,
        ...permissions,
      });
      await appGroupPermissionRepository.save(appGroupPermission);
    }
  }
}

function determinePermissionsForGroup(group: string): {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
} {
  switch (group) {
    case "all_users":
      return { create: false, read: true, update: false, delete: false };
    case "admin":
      return { create: true, read: true, update: true, delete: true };
    case "developer":
      return { create: true, read: true, update: true, delete: true };
    case "viewer":
      return { create: false, read: true, update: false, delete: false };
  }
}
