import { AddGroupUserDto, CreateGroupPermissionDto, UpdateGroupPermissionDto, DuplicateGroupDto } from '../dto';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '../dto/granular-permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { User as UserEntity } from '@entities/user.entity';
import { GetUsersResponse } from '../types';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';

export interface IGroupPermissionsControllerV2 {
  create(user: UserEntity, createGroupPermissionDto: CreateGroupPermissionDto): Promise<GroupPermissions>;
  get(user: UserEntity, id: string): Promise<{ group: GroupPermissions; isBuilderLevel: boolean }>;
  getAll(user: UserEntity): Promise<GetUsersResponse>;
  update(user: UserEntity, id: string, updateGroupDto: UpdateGroupPermissionDto): Promise<GroupPermissions>;
  delete(user: UserEntity, id: string): Promise<void>;
  duplicateGroup(user: UserEntity, groupId: string, duplicateGroupDto: DuplicateGroupDto): Promise<GroupPermissions>;
  createGroupUsers(user: UserEntity, groupId: string, addGroupUserDto: AddGroupUserDto): Promise<void>;
  getAllGroupUser(user: UserEntity, searchInput: string, group: GroupPermissions): Promise<GroupUsers[]>;
  deleteGroupUser(user: UserEntity, id: string): Promise<void>;
  getAddableGroupUser(user: UserEntity, groupId: string, searchInput: string): Promise<UserEntity[]>;
}

export interface IGranularPermissionsController {
  getAddableApps(user: UserEntity): Promise<{ AddableResourceItem }[]>;
  getAddableDs(user: UserEntity): Promise<{ AddableResourceItem }[]>;
  createGranularAppPermissions(
    user: UserEntity,
    groupId: string,
    createGranularPermissionsDto: CreateGranularPermissionDto
  ): Promise<GranularPermissions>;
  createGranularDataPermissions(
    user: UserEntity,
    groupId: string,
    createGranularPermissionsDto: CreateGranularPermissionDto
  ): Promise<GranularPermissions>;
  getAllGranularPermissions(user: UserEntity, groupId: string): Promise<GranularPermissions[]>;
  updateGranularAppPermissions(
    user: UserEntity,
    granularPermissionsId: string,
    updateGranularPermissionDto: UpdateGranularPermissionDto<any>
  ): Promise<void>;
  updateGranularDataPermissions(
    user: UserEntity,
    granularPermissionsId: string,
    updateGranularPermissionDto: UpdateGranularPermissionDto<any>
  ): Promise<void>;
  deleteGranularAppPermissions(user: UserEntity, granularPermissionsId: string): Promise<void>;
  deleteGranularDataPermissions(user: UserEntity, granularPermissionsId: string): Promise<void>;
}
