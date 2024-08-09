import {
  GROUP_PERMISSIONS_TYPE,
  USER_ROLE,
} from '@module/user_resource_permissions/constants/group-permissions.constant';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { Brackets, EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

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
          .andWhere(
            new Brackets((qb) => {
              qb.where('app_group_permissions.read = true AND app_group_permissions.update = true').orWhere(
                'group_permissions.appCreate = true'
              );
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
          .innerJoin('users.apps', 'apps')
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

      console.log('Builders users');
      console.log(builderUsersWoAdmin);

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
