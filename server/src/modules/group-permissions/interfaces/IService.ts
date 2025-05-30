import { EntityManager } from 'typeorm';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '../dto/granular-permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { AddGroupUserDto, DuplicateGroupDto, UpdateGroupPermissionDto } from '../dto';
import { GranularPermissionQuerySearchParam } from '../types';
import { GetUsersResponse } from '../types';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourcesGroupPermissions } from '@entities/data_sources_group_permissions.entity';
import { User } from '@entities/user.entity';

export interface IGranularPermissionsService {
  create(user: User, createGranularPermissionsDto: CreateGranularPermissionDto): Promise<void>;
  getAddableApps(organizationId: string): Promise<{ AddableResourceItem }[]>;
  getAddableDataSources(organizationId: string): Promise<{ AddableResourceItem }[]>;
  getAll(
    groupId: string,
    organizationId: string,
    searchParam?: GranularPermissionQuerySearchParam
  ): Promise<GranularPermissions[]>;
  update(id: string, user: User, updateGranularPermissionDto: UpdateGranularPermissionDto<any>): Promise<void>;
  delete(id: string, user: User): Promise<void>;
}

export interface IGroupPermissionsDuplicateService {
  duplicateGroup(group: GroupPermissions, addPermission: boolean, manager?: EntityManager): Promise<GroupPermissions>;
  duplicateGranularPermissions(
    granularPermissions: GranularPermissions,
    groupId: string,
    manager?: EntityManager
  ): Promise<GranularPermissions>;
  duplicateResourcePermissions(
    granularPermissionsToDuplicate: GranularPermissions,
    newGranularPermissionsId: string,
    manager?: EntityManager
  ): Promise<void>;
  duplicationAppsPermissions(
    appsPermissions: AppsGroupPermissions,
    granularPermissionId: string,
    manager: EntityManager
  ): Promise<void>;
  duplicationDataSourcePermissions(
    dataSourcePermissions: DataSourcesGroupPermissions,
    granularPermissionId: string,
    manager: EntityManager
  ): Promise<void>;
  getDuplicateGroupName(groupToDuplicate: GroupPermissions, manager: EntityManager): Promise<string>;
}

export interface IGroupPermissionsService {
  create(user: User, name: string): Promise<GroupPermissions>;
  getGroup(organizationId: string, id: string): Promise<{ group: GroupPermissions; isBuilderLevel: boolean }>;
  getAllGroup(organizationId: string): Promise<GetUsersResponse>;
  updateGroup(id: string, user: User, updateGroupPermissionDto: UpdateGroupPermissionDto): Promise<void>;
  deleteGroup(id: string, user: User): Promise<void>;
  duplicateGroup(groupId: string, user: User, duplicateGroupDto: DuplicateGroupDto): Promise<GroupPermissions>;
  addGroupUsers(addGroupUserDto: AddGroupUserDto, user: User, manager?: EntityManager): Promise<void>;
  getAllGroupUsers(group: GroupPermissions, organizationId: string, searchInput?: string): Promise<GroupUsers[]>;
  deleteGroupUser(id: string, user: User): Promise<void>;
  getAddableUser(groupId: string, organizationId: string, searchInput?: string): Promise<User[]>;
}
