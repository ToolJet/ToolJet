import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { USER_ROLE } from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import {
  DEFAULT_USER_APPS_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
} from '@modules/permissions/constants/permissions-ability.constant';
import {
  ResourcePermissionQueryObject,
  UserAppsPermissions,
  UserPermissions,
} from '@modules/permissions/interface/permissions-ability.interface';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { TOOLJET_RESOURCE } from 'src/constants/global.constant';
import { getUserPermissionsQuery } from '@modules/permissions/utility/permission-ability.utility';
import { AppBase } from 'src/entities/app_base.entity';
import { getUserRoleQuery } from '@modules/user_resource_permissions/utility/group-permissions.utility';

@Injectable()
export class AbilityService {
  constructor() {}

  async getResourcePermission(
    user: User,
    resourcePermissionsObject: ResourcePermissionQueryObject,
    manager?: EntityManager
  ): Promise<GroupPermissions[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getUserPermissionsQuery(user.id, resourcePermissionsObject, manager).getMany();
    }, manager);
  }

  async resourceActionsPermission(
    user: User,
    resourcePermissionsObject: ResourcePermissionQueryObject
  ): Promise<UserPermissions> {
    const permissions = await this.getResourcePermission(user, resourcePermissionsObject);

    const adminGroup = permissions.find((group) => group.name === USER_ROLE.ADMIN);
    const appsGranularPermissions = permissions.flatMap((item) => item.groupGranularPermissions);
    const userPermissions: UserPermissions = permissions.reduce((acc, group) => {
      return {
        isAdmin: !!adminGroup,
        appCreate: acc.appCreate || group.appCreate,
        appDelete: acc.appDelete || group.appDelete,
        folderCRUD: acc.folderCRUD || group.folderCRUD,
        orgConstantCRUD: acc.orgConstantCRUD || group.orgConstantCRUD,
        orgVariableCRUD: acc.orgVariableCRUD,
      };
    }, DEFAULT_USER_PERMISSIONS);
    const { resources } = resourcePermissionsObject;
    if (resources && resources.some((item) => item.resource === TOOLJET_RESOURCE.APP)) {
      userPermissions[TOOLJET_RESOURCE.APP] = await this.createUserAppsPermissions(appsGranularPermissions, user);
    }
    return userPermissions;
  }

  private async createUserAppsPermissions(
    appsGranularPermissions: GranularPermissions[],
    user: User
  ): Promise<UserAppsPermissions> {
    const userAppsPermissions: UserAppsPermissions = { ...DEFAULT_USER_APPS_PERMISSIONS };

    appsGranularPermissions.forEach((permission) => {
      const appsPermission = permission?.appsGroupPermissions;

      const groupApps = appsPermission?.groupApps ? appsPermission.groupApps.map((item) => item.appId) : [];

      userAppsPermissions.isAllEditable =
        userAppsPermissions.isAllEditable || (permission.isAll && appsPermission?.canEdit);
      userAppsPermissions.editableAppsId = Array.from(
        new Set([...userAppsPermissions.editableAppsId, ...(appsPermission?.canEdit ? groupApps : [])])
      );
      userAppsPermissions.isAllViewable =
        userAppsPermissions.isAllViewable || (permission.isAll && appsPermission?.canView);
      userAppsPermissions.viewableAppsId = Array.from(
        new Set([...userAppsPermissions.viewableAppsId, ...(appsPermission?.canView ? groupApps : [])])
      );
      userAppsPermissions.hiddenAppsId = Array.from(
        new Set([...userAppsPermissions.hiddenAppsId, ...(appsPermission?.hideFromDashboard ? groupApps : [])])
      );
      userAppsPermissions.hideAll =
        userAppsPermissions.hideAll || (appsPermission?.hideFromDashboard && permission.isAll);
    });

    await dbTransactionWrap(async (manager: EntityManager) => {
      const appsOwnedByUser = await manager.find(AppBase, {
        where: { userId: user.id, organizationId: user.organizationId },
      });

      const appsIdOwnedByUser = appsOwnedByUser.map((app) => app.id);
      userAppsPermissions.editableAppsId = Array.from(
        new Set([...userAppsPermissions.editableAppsId, ...appsIdOwnedByUser])
      );
    });

    return userAppsPermissions;
  }

  async isBuilder(user: User): Promise<boolean> {
    return USER_ROLE.BUILDER === (await this.getUserRole(user.id, user.organizationId));
  }

  async getUserRole(userId: string, organizationId: string): Promise<string> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return (await getUserRoleQuery(userId, organizationId, manager).getOne()).name;
    });
  }
}
