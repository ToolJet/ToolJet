import { GroupPermissions } from '@entities/group_permissions.entity';
import { CreateDefaultGroupObject, GetUsersResponse } from '../types';
import { EntityManager } from 'typeorm';
import { AddGroupUserDto, UpdateGroupPermissionDto } from '../dto';
import {
  CreateGranularPermissionObject,
  CreateResourcePermissionObject,
  UpdateGranularPermissionObject,
  UpdateResourceGroupPermissionsObject,
} from '../types/granular_permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { USER_ROLE } from '../constants';

export interface IGroupPermissionsUtilService {
  validateCreateGroupOperation(createGroupPermissionDto: CreateDefaultGroupObject): void;
  validateAddGroupUserOperation(group: GroupPermissions): void;
  validateDeleteGroupUserOperation(group: GroupPermissions, organizationId: string): void;
  validateUpdateGroupOperation(group: GroupPermissions, updateGroupPermissionDto: UpdateGroupPermissionDto): void;
  getGroupWithBuilderLevel(
    id: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<{ group: GroupPermissions; isBuilderLevel: boolean }>;
  createDefaultGroups(organizationId: string, manager?: EntityManager): Promise<void>;
  deleteFromAllCustomGroupUser(userId: string, organizationId: string, manager?: EntityManager): Promise<void>;
  addUsersToGroup(addGroupUserDto: AddGroupUserDto, organizationId: string, manager?: EntityManager): Promise<void>;
  getAllGroupByOrganization(organizationId: string): Promise<GetUsersResponse>;
}

export interface IGranularPermissionsUtilService {
  validateGranularPermissionCreateOperation(group: GroupPermissions): void;
  validateGranularPermissionUpdateOperation(group: GroupPermissions, organizationId: string): void;
  create(
    createGranularPermissionObject: CreateGranularPermissionObject,
    createResourcePermissionsObj: CreateResourcePermissionObject<any>,
    manager?: EntityManager
  ): Promise<GranularPermissions>;
  update(
    id: string,
    updateGranularPermissionsObj: UpdateGranularPermissionObject,
    manager?: EntityManager
  ): Promise<void>;
  createResourceGroupPermission(
    organizationId: string,
    granularPermissions: GranularPermissions,
    createResourcePermissionsObj: CreateResourcePermissionObject<any>,
    manager?: EntityManager
  ): Promise<void>;
  updateResourcePermissions(
    updateResourceGroupPermissionsObject: UpdateResourceGroupPermissionsObject<any>,
    organizationId: string,
    manager?: EntityManager
  ): Promise<void>;
  getBasicPlanGranularPermissions(role: USER_ROLE): GranularPermissions[];
}

export interface IGroupPermissionsLicenseUtilService {
  isValidLicense(): Promise<boolean>;
}
