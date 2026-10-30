import { MigrationProgress } from '@helpers/migration.helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { User } from '@entities/user.entity';
import { UserGroupPermission } from '@entities/user_group_permission.entity';
import { Brackets, EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '@modules/group-permissions/constants';

export class AddingUsersToRespectiveRolesBuilderAndEndUsers1720365772516 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const organizationIds = (
      await manager.find(Organization, {
        select: ['id'],
      })
    ).map((organization) => organization.id);
    await this.getAndConvertEditorBuilderUsers(manager, organizationIds);
  }

  async getAndConvertEditorBuilderUsers(manager: EntityManager, organizationIds: string[]) {
    const migrationProgress = new MigrationProgress(
      'AddingUsersToRespectiveRolesBuilderAndEndUsers1720365772516',
      organizationIds.length
    );
    for (const organizationId of organizationIds) {
      const userIdsWithEditPermissions = (
        await manager
          .createQueryBuilder(User, 'users')
          .innerJoin(
            'users.organizationUsers',
            'organization_users',
            'organization_users.organizationId = :organizationId ',
            {
              organizationId,
            }
          )
          .innerJoin(
            'users.groupPermissions',
            'group_permissions',
            'organization_users.organizationId = group_permissions.organizationId'
          )
          .leftJoin('group_permissions.appGroupPermission', 'app_group_permissions')
          .leftJoin('group_permissions.dataSourceGroupPermission', 'dataSourceGroupPermission')
          .andWhere(
            new Brackets((qb) => {
              qb.orWhere('app_group_permissions.read = true AND app_group_permissions.update = true')
                .orWhere('dataSourceGroupPermission.update = true')
                .orWhere('group_permissions.appCreate = true')
                .orWhere('group_permissions.appDelete = true')
                .orWhere('group_permissions.dataSourceCreate = true')
                .orWhere('group_permissions.dataSourceDelete = true')
                .orWhere('group_permissions.folderCreate = true')
                .orWhere('group_permissions.orgEnvironmentConstantCreate = true');
            })
          )
          .select('users.id')
          .distinct()
          .getMany()
      ).map((record) => record.id);

      const userIdsOfAppOwners = (
        await manager
          .createQueryBuilder(User, 'users')
          .innerJoin(
            'users.organizationUsers',
            'organization_users',
            'organization_users.organizationId = :organizationId',
            {
              organizationId,
            }
          )
          .innerJoin('users.apps', 'apps', 'apps.organizationId = :organizationId', {
            organizationId,
          })
          .select('users.id')
          .distinct()
          .getMany()
      ).map((record) => record.id);

      const adminsUsers = (
        await manager
          .createQueryBuilder(UserGroupPermission, 'usersGroup')
          .innerJoin(
            'usersGroup.groupPermission',
            'groupPermission',
            'groupPermission.organizationId = :organizationId',
            {
              organizationId,
            }
          )
          .where('groupPermission.group = :admin', {
            admin: 'admin',
          })
          .getMany()
      ).map((record) => record.userId);

      const builderUsersWithAdmin = [...new Set([...userIdsWithEditPermissions, ...userIdsOfAppOwners])];
      const builderUsersWoAdmin = builderUsersWithAdmin.filter((id) => !adminsUsers.includes(id));
      const builderGroup = await manager.findOne(GroupPermissions, {
        where: { name: USER_ROLE.BUILDER, type: GROUP_PERMISSIONS_TYPE.DEFAULT, organizationId: organizationId },
      });
      const endUserGroup = await manager.findOne(GroupPermissions, {
        where: { name: USER_ROLE.END_USER, type: GROUP_PERMISSIONS_TYPE.DEFAULT, organizationId: organizationId },
      });

      await this.migrateUserGroup(manager, builderUsersWoAdmin, builderGroup.id);
      const organizationUser = (
        await manager.find(OrganizationUser, {
          where: {
            organizationId,
          },
        })
      ).map((record) => record.userId);
      const builderAdminUsers = [...new Set([...builderUsersWoAdmin, ...adminsUsers])];
      const endUsers = organizationUser.filter((userId) => !builderAdminUsers.includes(userId));
      await this.migrateUserGroup(manager, endUsers, endUserGroup.id);
      migrationProgress.show();
    }
  }

  async migrateUserGroup(manager: EntityManager, userIds: string[], groupId: string) {
    if (userIds.length === 0) return;
    const valuesString = userIds.map((id) => `('${id}', '${groupId}')`).join(',');
    const query = `
      INSERT INTO group_users (user_id, group_id)
      VALUES ${valuesString};
    `;
    return await manager.query(query);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
