import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { ResourcePermissionObject } from '@module/user_resource_permissions/interface/permissions-ability.interface';
import { EntityManager } from 'typeorm';
import { getUserPermissionsQuery } from '@module/user_resource_permissions/utility/permission-ability.utility';
import { dbTransactionWrap } from '@helpers/utils.helper';
import { USER_ROLE } from '@module/user_resource_permissions/constants/group-permissions.constant';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { ADMIN_LEVEL_RESOURCES } from '@module/user_resource_permissions/constants/permissions-ability.constant';

@Injectable()
export class AbilityService {
  constructor() {}

  async getResourcePermission(
    user: User,
    resourcePermissionsObject: ResourcePermissionObject,
    manager?: EntityManager
  ): Promise<GroupPermissions[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getUserPermissionsQuery(user.id, resourcePermissionsObject, manager).getMany();
    }, manager);
  }

  async resourceActionsPermission(user: User, resourcePermissionsObject: ResourcePermissionObject) {
    const { resource } = resourcePermissionsObject;
    const permissions = await this.getResourcePermission(user, resourcePermissionsObject);
    const adminGroup = permissions.find((group) => group.name === USER_ROLE.ADMIN);

    if (adminGroup) return true;
    if (ADMIN_LEVEL_RESOURCES.includes(resource)) return false;
    if (permissions.length) true;

    return false;
  }
}
