import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/utils.helper';
import { USER_ROLE } from '@module/user_resource_permissions/constants/group-permissions.constant';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import {
  DEFAULT_USER_APPS_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
} from '@module/permissions/constants/permissions-ability.constant';
import {
  ResourcePermissionQueryObject,
  UserAppsPermissions,
  UserPermissions,
} from '@module/permissions/interface/permissions-ability.interface';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { TOOLJET_RESOURCE } from 'src/constants/global.constant';
import { getUserPermissionsQuery } from '@module/permissions/utility/permission-ability.utility';

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
        orgConstantCRUD: acc.folderCRUD || group.folderCRUD,
        orgVariableCRUD: acc.orgVariableCRUD || group.orgVariableCRUD,
      };
    }, DEFAULT_USER_PERMISSIONS);
    const { resources } = resourcePermissionsObject;
    if (resources && resources.some((item) => item.resource === TOOLJET_RESOURCE.APP)) {
      userPermissions[TOOLJET_RESOURCE.APP] = this.createUserAppsPermissions(appsGranularPermissions);
    }
    return userPermissions;
  }

  private createUserAppsPermissions(appsGranularPermissions: GranularPermissions[]): UserAppsPermissions {
    const userAppsPermissions: UserAppsPermissions = appsGranularPermissions.reduce((acc, permission) => {
      const appsPermission = permission?.appsGroupPermissions;
      const groupApps = appsPermission?.groupApps ? appsPermission.groupApps.map((item) => item.appId) : [];
      return {
        isAllEditable: acc.isAllEditable || (permission.isAll && appsPermission?.canEdit),
        editableAppsId: Array.from(new Set([...acc.editableAppsId, ...(appsPermission?.canEdit ? groupApps : [])])),
        isAllViewable: acc.isAllViewable || (permission.isAll && appsPermission?.canView),
        viewableAppsId: Array.from(new Set([...acc.viewableAppsId, ...(appsPermission?.canView ? groupApps : [])])),
        hiddenAppsId: Array.from(
          new Set([...acc.hiddenAppsId, ...(appsPermission?.hideFromDashboard ? groupApps : [])])
        ),
        hideAll: acc.hideAll || (appsPermission.hideFromDashboard && permission.isAll),
      };
    }, DEFAULT_USER_APPS_PERMISSIONS);
    return userAppsPermissions;
  }
}
