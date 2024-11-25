import { CreateGranularPermissionDto } from '@dto/granular-permissions.dto';
import { MigrationProgress } from 'src/helpers/utils.helper';
import {
  DEFAULT_GRANULAR_PERMISSIONS_NAME,
  DEFAULT_RESOURCE_PERMISSIONS,
  ResourceType,
} from '@modules/user_resource_permissions/constants/granular-permissions.constant';
import {
  USER_ROLE,
  DEFAULT_GROUP_PERMISSIONS_MIGRATIONS,
  DEFAULT_GROUP_PERMISSIONS,
} from '@modules/user_resource_permissions/constants/group-permissions.constant';
import {
  CreateResourcePermissionObject,
  ResourcePermissionMetaData,
} from '@modules/user_resource_permissions/interface/granular-permissions.interface';
import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { Organization } from 'src/entities/organization.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDefaultGroupInExistingWorkspace1720352990850 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const licenseValid = true;

    const organizationIds = (
      await manager.find(Organization, {
        select: ['id'],
      })
    ).map((organization) => organization.id);

    const migrationProgress = new MigrationProgress(
      'CreateDefaultGroupInExistingWorkspace1720352990850',
      organizationIds.length
    );

    for (const organizationId of organizationIds) {
      for (const defaultGroup of Object.keys(USER_ROLE)) {
        const groupPermissions = licenseValid
          ? DEFAULT_GROUP_PERMISSIONS_MIGRATIONS[defaultGroup]
          : DEFAULT_GROUP_PERMISSIONS[defaultGroup];
        const query = `
          INSERT INTO permission_groups (
            organization_id,
            name,
            type,
            app_create,
            app_delete,
            folder_crud,
            org_constant_crud,
            data_source_create,
            data_source_delete
          ) VALUES (
            '${organizationId}',
            '${groupPermissions.name}',
            '${groupPermissions.type}',
            ${groupPermissions.appCreate},
            ${groupPermissions.appDelete},
            ${groupPermissions.folderCRUD},
            ${groupPermissions.orgConstantCRUD},
            false,
            false
          ) RETURNING *;
        `;
        const group: GroupPermissions = (await manager.query(query))[0];
        const groupGranularPermissions: Record<ResourceType, CreateResourcePermissionObject> =
          DEFAULT_RESOURCE_PERMISSIONS[group.name];

        for (const resource of Object.keys(groupGranularPermissions)) {
          const dtoObject: CreateGranularPermissionDto = {
            name: DEFAULT_GRANULAR_PERMISSIONS_NAME[resource],
            groupId: group.id,
            type: resource as ResourceType,
            isAll: true,
            createAppsPermissionsObject: {},
          };
          if (group.name === USER_ROLE.ADMIN) {
            const createResourcePermissionObj: CreateResourcePermissionObject = groupGranularPermissions[resource];

            const granularPermissions = await this.createGranularPermission(manager, dtoObject);
            if (resource === ResourceType.APP) {
              await this.createAppsResourcePermission(
                manager,
                { granularPermissions, organizationId },
                createResourcePermissionObj as CreateResourcePermissionObject
              );
            }
          }
        }
        //Migrating Admins to new Admins
        if (group.name === USER_ROLE.ADMIN) {
          const adminsUsers = await manager
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
            .getMany();
          const uniqueUserIds = new Set(adminsUsers.map((userGroup) => userGroup.userId));
          if (uniqueUserIds.size === 0) continue;
          const userIds = [...uniqueUserIds];
          await this.migrateUserGroup(manager, userIds, group.id);
        }
      }
      migrationProgress.show();
    }
  }

  async createGranularPermission(
    manager: EntityManager,
    createObject: CreateGranularPermissionDto
  ): Promise<GranularPermissions> {
    const query = `
      INSERT INTO granular_permissions (
        group_id,
        name,
        type,
        is_all
      ) VALUES (
        '${createObject.groupId}', '${createObject.name}', '${createObject.type}', ${createObject.isAll}
      ) RETURNING *;
    `;
    return (await manager.query(query))[0];
  }

  async createAppsResourcePermission(
    manager: EntityManager,
    createMeta: ResourcePermissionMetaData,
    createObject: CreateResourcePermissionObject
  ): Promise<AppsGroupPermissions> {
    const { granularPermissions } = createMeta;
    const query = `
      INSERT INTO apps_group_permissions (
        granular_permission_id,
        can_edit,
        can_view,
        hide_from_dashboard
      ) VALUES (
        '${granularPermissions.id}', ${createObject.canEdit}, ${createObject.canView}, ${createObject.hideFromDashboard}
      ) RETURNING *;
    `;
    return (await manager.query(query))[0];
  }

  async migrateUserGroup(manager: EntityManager, userIds: string[], groupId: string) {
    if (userIds.length == 0) return;
    const valuesString = userIds.map((id) => `('${id}', '${groupId}')`).join(',');
    const query = `
      INSERT INTO group_users (user_id, group_id)
      VALUES ${valuesString};
    `;
    return await manager.query(query);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
