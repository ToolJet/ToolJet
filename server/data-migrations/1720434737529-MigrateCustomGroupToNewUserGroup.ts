import { CreateGranularPermissionDto } from '@dto/granular-permissions.dto';
import { MigrationProgress } from 'src/helpers/utils.helper';
import {
  DEFAULT_GRANULAR_PERMISSIONS_NAME,
  ResourceType,
} from '@modules/user_resource_permissions/constants/granular-permissions.constant';
import {
  GROUP_PERMISSIONS_TYPE,
  USER_ROLE,
} from '@modules/user_resource_permissions/constants/group-permissions.constant';
import {
  CreateResourcePermissionObject,
  ResourcePermissionMetaData,
} from '@modules/user_resource_permissions/interface/granular-permissions.interface';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateCustomGroupToNewUserGroup1720434737529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const licenseValid = true;

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
        .andWhere('groupPermission.group != :admin', {
          admin: 'admin',
        })
        .getMany();

      for (const groupPermissions of groups) {
        // check if all user groups has any privileges, if yes -> create a custom group for it
        if (groupPermissions.group === 'all_users') {
          const { appGroupPermission, appCreate, appDelete, folderCreate, orgEnvironmentConstantCreate } =
            groupPermissions;
          if (!(appGroupPermission?.length || appCreate || appDelete || folderCreate || orgEnvironmentConstantCreate)) {
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
            false,
            false
          ) RETURNING *;
        `;
        const group: GroupPermissions = (await manager.query(query))[0];
        const existingGroupUsers = groupPermissions.userGroupPermission;
        await this.migrateUserGroup(manager, [...new Set(existingGroupUsers.map((record) => record.userId))], group.id);
        const resources = [ResourceType.APP];
        for (const resource of resources) {
          if (resource === ResourceType.APP) {
            const updateLevelAndHideAppsPermissions = groupPermissions.appGroupPermission.filter(
              (appPermissions) => appPermissions.read && appPermissions.hideFromDashboard
            );
            const createResourcePermissionObjViewAndHide: CreateResourcePermissionObject = {
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
            const createResourcePermissionObjEdit: CreateResourcePermissionObject = {
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
            const createResourcePermissionObjView: CreateResourcePermissionObject = {
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
        }
      }
      migrationProgress.show();
    }
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

  async createAppLevelPermissions(
    manager: EntityManager,
    appsPermissions: AppGroupPermission[],
    organizationId: string,
    group: GroupPermissions,
    createResourcePermissionObj: CreateResourcePermissionObject
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
      createAppsPermissionsObject: {},
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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
