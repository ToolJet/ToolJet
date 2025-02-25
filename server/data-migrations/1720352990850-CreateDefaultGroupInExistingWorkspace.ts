import { MigrationProgress } from '@helpers/migration.helper';
import { NestFactory } from '@nestjs/core';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { Organization } from '@entities/organization.entity';
import { UserGroupPermission } from '@entities/user_group_permission.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import {
  CreateResourcePermissionObjectGeneric,
  DEFAULT_GROUP_PERMISSIONS_MIGRATIONS,
} from 'src/migration-helpers/constants';
import {
  USER_ROLE,
  DEFAULT_GROUP_PERMISSIONS,
  ResourceType,
  DEFAULT_RESOURCE_PERMISSIONS,
} from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { CreateGranularPermissionDto } from '@modules/group-permissions/dto/granular-permissions';
import {
  CreateResourcePermissionObject,
  ResourcePermissionMetaData,
} from '@modules/group-permissions/types/granular_permissions';
import { AppModule } from '@modules/app/module';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';

export class CreateDefaultGroupInExistingWorkspace1720352990850 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();

    const manager = queryRunner.manager;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    const licenseService = nestApp.get<LicenseInitService>(LicenseInitService);
    const licenseValid =
      getTooljetEdition() === TOOLJET_EDITIONS.CE ? true : await licenseService.initForMigration(manager);

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
            ${groupPermissions.dataSourceCreate},
            ${groupPermissions.dataSourceDelete}
          ) RETURNING *;
        `;
        const group: GroupPermissions = (await manager.query(query))[0];
        const groupGranularPermissions: Record<
          ResourceType,
          CreateResourcePermissionObject<any>
        > = DEFAULT_RESOURCE_PERMISSIONS[group.name];

        for (const resource of Object.keys(groupGranularPermissions)) {
          const dtoObject: CreateGranularPermissionDto = {
            name: DEFAULT_GRANULAR_PERMISSIONS_NAME[resource],
            groupId: group.id,
            type: resource as ResourceType,
            isAll: true,
            createResourcePermissionObject: {},
          };
          if (group.name === USER_ROLE.ADMIN) {
            const createResourcePermissionObj: CreateResourcePermissionObjectGeneric =
              groupGranularPermissions[resource];

            const granularPermissions = await this.createGranularPermission(manager, dtoObject);
            if (resource === ResourceType.APP) {
              await this.createAppsResourcePermission(
                manager,
                { granularPermissions, organizationId },
                createResourcePermissionObj as CreateResourcePermissionObject<ResourceType.APP>
              );
            } else if (resource === ResourceType.DATA_SOURCE) {
              await this.createDataSourceResourcePermission(
                manager,
                { granularPermissions, organizationId },
                createResourcePermissionObj as CreateResourcePermissionObject<ResourceType.DATA_SOURCE>
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
    await nestApp.close();
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
    createObject: CreateResourcePermissionObject<ResourceType.APP>
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

  async createDataSourceResourcePermission(
    manager: EntityManager,
    createMeta: ResourcePermissionMetaData,
    createObject: CreateResourcePermissionObject<ResourceType.DATA_SOURCE>
  ): Promise<AppsGroupPermissions> {
    const { granularPermissions } = createMeta;
    const query = `
      INSERT INTO data_sources_group_permissions (
        granular_permission_id,
        can_configure,
        can_use
      ) VALUES (
        '${granularPermissions.id}', ${createObject?.action?.canConfigure || false}, ${
      createObject?.action?.canUse || false
    }
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
