import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { DEFAULT_USER_DATA_SOURCE_PERMISSIONS, DEFAULT_USER_PERMISSIONS } from './constants';
import { ResourcePermissionQueryObject, UserDataSourcePermissions, UserPermissions } from './types';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import { AbilityUtilService } from './util.service';
import { AbilityService as IAbilityService } from './interfaces/IService';

@Injectable()
export class AbilityService extends IAbilityService {
  constructor(protected readonly abilityUtilService: AbilityUtilService) {
    super();
  }

  async getResourcePermission(
    user: User,
    resourcePermissionsObject: ResourcePermissionQueryObject,
    manager?: EntityManager
  ): Promise<GroupPermissions[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await this.abilityUtilService
        .getUserPermissionsQuery(user.id, resourcePermissionsObject, manager)
        .getMany();
    }, manager);
  }

  async resourceActionsPermission(
    user: User,
    resourcePermissionsObject: ResourcePermissionQueryObject,
    manager?: EntityManager
  ): Promise<UserPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const permissions = await this.getResourcePermission(user, resourcePermissionsObject, manager);

      const adminGroup = permissions.some((group) => group.name === USER_ROLE.ADMIN);
      const allGranularPermissions = permissions.flatMap((item) => item.groupGranularPermissions);

      const userPermissions: UserPermissions = permissions.reduce((acc, group) => {
        return {
          isSuperAdmin: false,
          isAdmin: false,
          isBuilder: false,
          isEndUser: false,
          appCreate: acc.appCreate || group.appCreate,
          appDelete: acc.appDelete || group.appDelete,
          dataSourceCreate: acc.dataSourceCreate || group.dataSourceCreate,
          dataSourceDelete: acc.dataSourceDelete || group.dataSourceDelete,
          folderCRUD: acc.folderCRUD || group.folderCRUD,
          orgConstantCRUD: acc.orgConstantCRUD || group.orgConstantCRUD,
          orgVariableCRUD: acc.orgVariableCRUD,
        };
      }, DEFAULT_USER_PERMISSIONS);

      userPermissions.isAdmin = adminGroup;
      userPermissions.isSuperAdmin = false;

      if (!adminGroup) {
        const isBuilder = await this.abilityUtilService.isBuilder(user);

        if (isBuilder) {
          userPermissions.isBuilder = true;
        } else {
          userPermissions.isEndUser = true;
        }
      }

      const { resources } = resourcePermissionsObject;
      if (resources) {
        if (resources.some((item) => item.resource === MODULES.APP)) {
          const appsGranularPermissions = allGranularPermissions.filter((perm) => perm.type === ResourceType.APP);
          userPermissions[MODULES.APP] = await this.abilityUtilService.createUserAppsPermissions(
            appsGranularPermissions,
            user,
            manager
          );
        }
        if (resources.some((item) => item.resource === MODULES.GLOBAL_DATA_SOURCE)) {
          const dsGranularPermissions = allGranularPermissions.filter((perm) => perm.type === ResourceType.DATA_SOURCE);
          userPermissions[MODULES.GLOBAL_DATA_SOURCE] = await this.createUserDataSourcesPermissions(
            dsGranularPermissions
          );

          /* in community edition. builder can use the datasources */
          userPermissions[MODULES.GLOBAL_DATA_SOURCE].isAllUsable = true;
        }
      }

      return userPermissions;
    }, manager);
  }

  async createUserDataSourcesPermissions(
    dataSourcesGranularPermissions: GranularPermissions[]
  ): Promise<UserDataSourcePermissions> {
    const userDataSourcesPermissions: UserDataSourcePermissions = { ...DEFAULT_USER_DATA_SOURCE_PERMISSIONS };
    return userDataSourcesPermissions;
  }
}
