import { MigrationProgress } from '@helpers/migration.helper';
import { NestFactory } from '@nestjs/core';
import { AppGroupPermission } from '@entities/app_group_permission.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourceGroupPermission } from '@entities/data_source_group_permission.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GroupPermission } from '@entities/group_permission.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { Organization } from '@entities/organization.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { AppModule } from '@modules/app/module';
import { GROUP_PERMISSIONS_TYPE, ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import {
  CreateResourcePermissionObject,
  ResourcePermissionMetaData,
} from '@modules/group-permissions/types/granular_permissions';
import { CreateGranularPermissionDto } from '@modules/group-permissions/dto/granular-permissions';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { EDITIONS } from '@modules/app/constants';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';

export class MigrateCustomGroupToNewUserGroup1720434737529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const licenseService = nestApp.get(LicenseInitService);

    const licenseValid =
      !process.env.EDITION || process.env.EDITION === EDITIONS.CE
        ? true
        : await licenseService.initForMigration(manager);

    if (!licenseValid) {
      console.log('Not considering groups for basic plans');
      return;
    }

    const organizationIds = (
      await manager.find(Organization, {
        select: ['id'],
      })
    ).map((organization) => organization.id);

    const migrationProgress = new MigrationProgress(
      'MigrateCustomGroupToNewUserGroup1720434737529',
      organizationIds.length
    );

    for (const organizationId of organizationIds) {
      const groups = await manager
        .createQueryBuilder(GroupPermission, 'groupPermission')
        .where('groupPermission.organizationId = :organizationId', {
          organizationId,
        })
        .leftJoinAndSelect('groupPermission.appGroupPermission', 'appGroupPermission')
        .leftJoinAndSelect('groupPermission.userGroupPermission', 'userGroupPermission')
        .leftJoinAndSelect('groupPermission.dataSourceGroupPermission', 'dataSourceGroupPermission')
        .andWhere('groupPermission.group != :admin', {
          admin: 'admin',
        })
        .getMany();

      for (const groupPermissions of groups) {
        // check if all user groups has any privileges, if yes -> create a custom group for it
        if (groupPermissions.group === 'all_users') {
          const {
            appGroupPermission,
            dataSourceGroupPermission,
            appCreate,
            appDelete,
            dataSourceCreate,
            dataSourceDelete,
            folderCreate,
            orgEnvironmentConstantCreate,
          } = groupPermissions;
          if (
            !(
              appGroupPermission?.length ||
              dataSourceGroupPermission?.length ||
              appCreate ||
              appDelete ||
              dataSourceCreate ||
              dataSourceDelete ||
              folderCreate ||
              orgEnvironmentConstantCreate
            )
          ) {
            continue;
          }
        }
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
            '${this.getGroupName(groupPermissions.group)}',
            '${GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP}',
            ${groupPermissions.appCreate},
            ${groupPermissions.appDelete},
            ${groupPermissions.folderCreate},
            ${groupPermissions.orgEnvironmentConstantCreate},
            ${groupPermissions.dataSourceCreate},
            ${groupPermissions.dataSourceDelete}
          ) RETURNING *;
        `;
        const group: GroupPermissions = (await manager.query(query))[0];
        const existingGroupUsers = groupPermissions.userGroupPermission;
        await this.migrateUserGroup(manager, [...new Set(existingGroupUsers.map((record) => record.userId))], group.id);
        const resources = [ResourceType.APP, ResourceType.DATA_SOURCE];
        for (const resource of resources) {
          if (resource === ResourceType.APP) {
            const updateLevelAndHideAppsPermissions = groupPermissions.appGroupPermission.filter(
              (appPermissions) => appPermissions.read && appPermissions.hideFromDashboard
            );
            const createResourcePermissionObjViewAndHide: CreateResourcePermissionObject<ResourceType.APP> = {
              canView: true,
              canEdit: false,
              hideFromDashboard: true,
            };
            await this.createAppLevelPermissions(
              manager,
              updateLevelAndHideAppsPermissions,
              organizationId,
              group,
              createResourcePermissionObjViewAndHide
            );

            const updateLevelAppsPermissions = groupPermissions.appGroupPermission.filter(
              (appPermissions) => appPermissions.update && !appPermissions.hideFromDashboard
            );
            const createResourcePermissionObjEdit: CreateResourcePermissionObject<ResourceType.APP> = {
              canView: false,
              canEdit: true,
              hideFromDashboard: false,
            };
            await this.createAppLevelPermissions(
              manager,
              updateLevelAppsPermissions,
              organizationId,
              group,
              createResourcePermissionObjEdit
            );

            const viewLevelAppsPermissions = groupPermissions.appGroupPermission.filter(
              (appPermissions) => appPermissions.read && !appPermissions.update
            );
            const createResourcePermissionObjView: CreateResourcePermissionObject<ResourceType.APP> = {
              canView: true,
              canEdit: false,
              hideFromDashboard: false,
            };
            await this.createAppLevelPermissions(
              manager,
              viewLevelAppsPermissions,
              organizationId,
              group,
              createResourcePermissionObjView
            );
          }

          if (resource === ResourceType.DATA_SOURCE) {
            const updateLevelDataSourcePermissions = groupPermissions.dataSourceGroupPermission.filter(
              (dataSourcePermissions) => dataSourcePermissions.update
            );
            const createResourcePermissionObjEdit: CreateResourcePermissionObject<ResourceType.DATA_SOURCE> = {
              action: {
                canConfigure: true,
                canUse: false,
              },
            };
            await this.createDataSourceLevelPermissions(
              manager,
              updateLevelDataSourcePermissions,
              organizationId,
              group,
              createResourcePermissionObjEdit
            );

            const viewLevelDataSourcePermissions = groupPermissions.dataSourceGroupPermission.filter(
              (dataSourcePermissions) => dataSourcePermissions.read && !dataSourcePermissions.update
            );
            const createResourcePermissionObjView: CreateResourcePermissionObject<ResourceType.DATA_SOURCE> = {
              action: {
                canConfigure: false,
                canUse: true,
              },
            };
            await this.createDataSourceLevelPermissions(
              manager,
              viewLevelDataSourcePermissions,
              organizationId,
              group,
              createResourcePermissionObjView
            );
          }
        }
      }
      migrationProgress.show();
    }
    await nestApp.close();
  }

  getGroupName(name: string) {
    switch (name) {
      case USER_ROLE.BUILDER:
        return `custom-${USER_ROLE.BUILDER}`;
      case USER_ROLE.END_USER:
        return `custom-${USER_ROLE.END_USER}`;
      case 'all_users':
        return `Custom All users`;
      case 'Builder':
        return `Custom Builder`;
      case 'End-user':
        return `Custom End User`;
      case 'Admin':
        return `Custom Admin`;
      default:
        return name;
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
      $1, $2, $3, $4
    ) RETURNING *;
  `;

    const parameters = [createObject.groupId, createObject.name, createObject.type, createObject.isAll];

    return (await manager.query(query, parameters))[0];
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
      $1, $2, $3, $4
    ) RETURNING *;
  `;

    const parameters = [
      granularPermissions.id,
      createObject.canEdit,
      createObject.canView,
      createObject.hideFromDashboard,
    ];

    return (await manager.query(query, parameters))[0];
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
      $1, $2, $3
    ) RETURNING *;
  `;

    const parameters = [
      granularPermissions.id,
      createObject.action?.canConfigure || false,
      createObject.action?.canUse || false,
    ];

    return (await manager.query(query, parameters))[0];
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

  async addAppsGroupToPermissions(manager: EntityManager, appIds: string[], appPermissionsId: string) {
    const valuesString = appIds.map((id) => `('${id}', '${appPermissionsId}')`).join(',');
    const query = `
    INSERT INTO group_apps (app_id, apps_group_permissions_id)
    VALUES ${valuesString};
  `;
    return await manager.query(query);
  }

  async addDataSourceGroupToPermissions(
    manager: EntityManager,
    dataSourceIds: string[],
    dataSourcePermissionsId: string
  ) {
    const valuesString = dataSourceIds.map((id) => `('${id}', '${dataSourcePermissionsId}')`).join(',');
    const query = `
    INSERT INTO group_data_sources (data_source_id, data_sources_group_permissions_id)
    VALUES ${valuesString};
  `;
    return await manager.query(query);
  }

  async createAppLevelPermissions(
    manager: EntityManager,
    appsPermissions: AppGroupPermission[],
    organizationId: string,
    group: GroupPermissions,
    createResourcePermissionObj: CreateResourcePermissionObject<ResourceType.APP>
  ) {
    const nameInit = createResourcePermissionObj.canEdit
      ? 'Updatable'
      : `Viewable ${createResourcePermissionObj.hideFromDashboard ? 'hidden' : ''}`;
    if (appsPermissions.length === 0) return;
    const dtoObject: CreateGranularPermissionDto = {
      name: `${nameInit} ${DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.APP]}`,
      groupId: group.id,
      type: ResourceType.APP,
      isAll: false,
      createResourcePermissionObject: {},
    };
    const granularPermissions = await this.createGranularPermission(manager, dtoObject);
    const appsGroupPermissions = await this.createAppsResourcePermission(
      manager,
      { granularPermissions, organizationId },
      createResourcePermissionObj
    );
    await this.addAppsGroupToPermissions(
      manager,
      appsPermissions.map((record) => record.appId),
      appsGroupPermissions.id
    );
  }

  async createDataSourceLevelPermissions(
    manager: EntityManager,
    dataSourcePermissions: DataSourceGroupPermission[],
    organizationId: string,
    group: GroupPermissions,
    createResourcePermissionObj: CreateResourcePermissionObject<ResourceType.DATA_SOURCE>
  ) {
    const nameInit = createResourcePermissionObj.action?.canConfigure ? 'Configurable' : 'Usable';
    if (dataSourcePermissions.length === 0) return;
    const dtoObject = {
      name: `${nameInit} ${DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.DATA_SOURCE]}`,
      groupId: group.id,
      type: ResourceType.DATA_SOURCE,
      isAll: false,
      createResourcePermissionObject: {},
    };
    const granularPermissions = await this.createGranularPermission(manager, dtoObject);
    const dataSourceGroupPermissions = await this.createDataSourceResourcePermission(
      manager,
      { granularPermissions, organizationId },
      createResourcePermissionObj
    );
    await this.addDataSourceGroupToPermissions(
      manager,
      dataSourcePermissions.map((record) => record.dataSourceId),
      dataSourceGroupPermissions.id
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
