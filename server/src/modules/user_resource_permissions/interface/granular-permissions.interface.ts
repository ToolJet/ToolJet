import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import { SearchParamItem } from '@helpers/db-utility/db-utility.interface';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '@dto/granular-permissions.dto';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';

export interface AppsPermissionDeleteResourceItem {
  id: string;
}

export interface AppsPermissionAddResourceItem {
  appId: string;
}

export interface AppsGroupPermissionsActions {
  canEdit: boolean;
  canView: boolean;
  hideFromDashboard: boolean;
}

export type ResourceGroupActions = AppsGroupPermissionsActions;

export interface UpdateGranularPermissionObject {
  group?: GroupPermissions;
  organizationId: string;
  updateGranularPermissionDto: UpdateGranularPermissionDto;
}

export type GranularPermissionAddResourceItems = AppsPermissionAddResourceItem[];
export type GranularPermissionDeleteResourceItems = AppsPermissionDeleteResourceItem[];

export interface UpdateResourceGroupPermissionsObject {
  group: GroupPermissions;
  granularPermissions: GranularPermissions;
  actions: ResourceGroupActions;
  resourcesToAdd: GranularPermissionAddResourceItems;
  resourcesToDelete: GranularPermissionDeleteResourceItems;
  allowRoleChange?: boolean;
}

export interface GranularPermissionQuerySearchParam {
  [key: string]: SearchParamItem | boolean | string | number;
  name?: SearchParamItem;
  type?: string;
  groupId?: string;
}

export interface CreateAppsPermissionsObject {
  canEdit?: boolean;
  canView?: boolean;
  hideFromDashboard?: boolean;
  resourcesToAdd?: GranularPermissionAddResourceItems;
}

export interface CreateGranularPermissionObject {
  createGranularPermissionDto: CreateGranularPermissionDto;
  organizationId: string;
}

export interface ResourcePermissionMetaData {
  granularPermissions: GranularPermissions;
  organizationId: string;
}

export type CreateResourcePermissionObject = CreateAppsPermissionsObject;

export type GranularResourcePermissions = AppsGroupPermissions;
