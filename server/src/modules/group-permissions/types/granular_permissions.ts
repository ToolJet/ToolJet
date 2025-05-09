import { GranularPermissions } from '@entities/granular_permissions.entity';
import { ResourceType } from '../constants';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '../dto/granular-permissions';
import { GroupPermissions } from '@entities/group_permissions.entity';

export interface AddableResourceItem {
  name: string;
  id: string;
}
export type CreateResourcePermissionObject<T extends ResourceType.APP | ResourceType.DATA_SOURCE> =
  T extends ResourceType.APP ? CreateAppsPermissionsObject : CreateDataSourcePermissionsObject;

export interface CreateAppsPermissionsObject {
  canEdit?: boolean;
  canView?: boolean;
  hideFromDashboard?: boolean;
  resourcesToAdd?: GranularPermissionAddResourceItems<ResourceType.APP>;
}

export interface CreateDataSourcePermissionsObject {
  action?: DataSourcesGroupPermissionsActions;
  resourcesToAdd?: GranularPermissionAddResourceItems<ResourceType.DATA_SOURCE>;
}

export interface DataSourcesGroupPermissionsActions {
  canConfigure: boolean;
  canUse: boolean;
}

export interface CreateGranularPermissionObject {
  createGranularPermissionDto: CreateGranularPermissionDto;
  organizationId: string;
}

export type GranularPermissionAddResourceItems<T extends ResourceType.APP | ResourceType.DATA_SOURCE> =
  T extends ResourceType.APP ? AppsPermissionAddResourceItem[] : DataSourcesPermissionResourceItem[];

export interface AppsPermissionAddResourceItem {
  appId: string;
}

export interface DataSourcesPermissionResourceItem {
  dataSourceId: string;
}

export interface AppsGroupPermissionsActions {
  canEdit: boolean;
  canView: boolean;
  hideFromDashboard: boolean;
}

export interface ResourcePermissionMetaData {
  granularPermissions: GranularPermissions;
  organizationId: string;
}

export interface ResourceCreateValidation {
  organizationId: string;
  groupId: string;
  isBuilderPermissions: boolean;
}

export interface UpdateGranularPermissionObject {
  group?: GroupPermissions;
  organizationId: string;
  updateGranularPermissionDto: UpdateGranularPermissionDto<any>;
}

export interface UpdateResourceGroupPermissionsObject<T extends ResourceType.APP | ResourceType.DATA_SOURCE> {
  group: GroupPermissions;
  granularPermissions: GranularPermissions;
  actions: ResourceGroupActions<T>;
  resourcesToAdd: GranularPermissionAddResourceItems<T>;
  resourcesToDelete: GranularPermissionDeleteResourceItems;
  allowRoleChange?: boolean;
}

export type GranularPermissionDeleteResourceItems = GranularPermissionDeleteResourceItem[];

export interface GranularPermissionDeleteResourceItem {
  id: string;
}

export type ResourceGroupActions<T extends ResourceType.APP | ResourceType.DATA_SOURCE> = T extends ResourceType.APP
  ? AppsGroupPermissionsActions
  : DataSourcesGroupPermissionsActions;

export interface ValidateResourceAction {
  isBuilderPermissions: boolean;
  organizationId: string;
  groupId: string;
}
