import { CreateGranularPermissionDto } from '@dto/granular-permissions.dto';
import {
  DEFAULT_GRANULAR_PERMISSIONS_NAME,
  ResourceType,
} from '@module/user_resource_permissions/constants/granular-permissions.constant';
import {
  GROUP_PERMISSIONS_TYPE,
  USER_ROLE,
} from '@module/user_resource_permissions/constants/group-permissions.constant';
import {
  CreateResourcePermissionObject,
  ResourcePermissionMetaData,
} from '@module/user_resource_permissions/interface/granular-permissions.interface';
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
    const organizationIds = (
      await manager.find(Organization, {
        select: ['id'],
      })
    ).map((organization) => organization.id);
    for (const organizationId of organizationIds) {
      const groups = await manager
        .createQueryBuilder(GroupPermission, 'groupPermission')
        .where('groupPermission.organizationId = :organizationId', {
          organizationId,
        })
        .innerJoinAndSelect('groupPermission.appGroupPermission', 'appGroupPermission')
        .innerJoinAndSelect('groupPermission.userGroupPermission', 'userGroupPermission')
        .andWhere('groupPermission.group != :admin', {
          admin: 'admin',
        })
        .getMany();
      for (const groupPermissions of groups) {
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
                data_source_delete,
                
            ) VALUES (
                ${organizationId} , ${groupPermissions.group} , ${GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP},${groupPermissions.appCreate}, ${groupPermissions.appDelete}
                , ${groupPermissions.folderCreate}, ${groupPermissions.orgEnvironmentConstantCreate}, false , false
            ) RETURNING *;`;
        const group: GroupPermissions = (await manager.query(query))[0];
        const existingGroupUsers = groupPermissions.userGroupPermission;
        await this.migrateUserGroup(
          manager,
          existingGroupUsers.map((record) => record.userId),
          groupPermissions.id
        );
        const resources = [ResourceType.APP];
        for (const resource of resources) {
          if (resource === ResourceType.APP) {
            const viewLevelAppsPermissions = groupPermissions.appGroupPermission.filter(
              (appPermissions) => appPermissions.read
            );
            const updateLevelAppsPermissions = groupPermissions.appGroupPermission.filter(
              (appPermissions) => appPermissions.update
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
              resource,
              group,
              createResourcePermissionObjView
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
              resource,
              group,
              createResourcePermissionObjEdit
            );
          }
        }
      }
    }
  }

  getGroupName(name: string) {
    switch (name) {
      case USER_ROLE.BUILDER:
        return `custom-${USER_ROLE.BUILDER}`;
      case USER_ROLE.END_USER:
        return `custom-${USER_ROLE.END_USER}`;
      case 'all-users':
        return `Custom All users`;
      default:
        name;
        break;
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
            is_all,
            
        ) VALUES (
            ${createObject.groupId} , ${createObject.name} , ${createObject.type},${createObject.isAll}
        ) RETURNING *;`;
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
      ${granularPermissions.id},
      ${createObject.canEdit},
      ${createObject.canView},
      ${createObject.hideFromDashboard}
    ) RETURNING *;
  `;
    return (await manager.query(query))[0];
  }

  async migrateUserGroup(manager: EntityManager, userIds: string[], groupId: string) {
    const valuesString = `( ${userIds.map((id) => `(${id}, ${groupId} )`).join(',')} )`;
    const query = `INSERT INTO group_users (
            user_id,
            group_id
        ) VALUES ${valuesString}`;
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
    resource: ResourceType,
    group: GroupPermissions,
    createResourcePermissionObj: CreateResourcePermissionObject
  ) {
    const nameInit = createResourcePermissionObj.canView ? 'Viewable' : 'Updatable';
    if (appsPermissions.length === 0) return;
    const dtoObject = {
      name: `${nameInit} ${DEFAULT_GRANULAR_PERMISSIONS_NAME[resource]}`,
      groupId: group.id,
      type: resource as ResourceType,
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
