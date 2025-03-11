import { EntityManager } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { ResourcePermissionQueryObject, UserPermissions, UserDataSourcePermissions } from '../types';
import { GranularPermissions } from '@entities/granular_permissions.entity';

export abstract class AbilityService {
  abstract getResourcePermission(
    user: User,
    resourcePermissionsObject: ResourcePermissionQueryObject,
    manager?: EntityManager
  ): Promise<GroupPermissions[]>;

  abstract resourceActionsPermission(
    user: User,
    resourcePermissionsObject: ResourcePermissionQueryObject,
    manager?: EntityManager
  ): Promise<UserPermissions>;

  abstract createUserDataSourcesPermissions(
    dataSourcesGranularPermissions: GranularPermissions[]
  ): Promise<UserDataSourcePermissions>;
}
