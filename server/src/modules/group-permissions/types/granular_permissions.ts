import { GranularPermissions } from '@entities/granular_permissions.entity';
import { ResourceType } from '../constants';
import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '../dto/granular-permissions';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { APP_TYPES } from '@modules/apps/constants';

export interface AddableResourceItem {
  name: string;
  id: string;
}
type CreateResourcePermissionMap = {
  [ResourceType.APP]: CreateBaseAppsPermissionsObject;
  [ResourceType.DATA_SOURCE]: CreateDataSourcePermissionsObject;
  [ResourceType.WORKFLOWS]: CreateBaseAppsPermissionsObject;
};

export type CreateResourcePermissionObject<T extends ResourceType> = CreateResourcePermissionMap[T];

export interface CreateBaseAppsPermissionsObject {
  canEdit?: boolean;
  canView?: boolean;
  appType?: APP_TYPES;
  hideFromDashboard?: boolean;
  resourcesToAdd?: GranularPermissionAddResourceItems<ResourceType.APP | ResourceType.WORKFLOWS>;
}
export interface CreateAppsPermissionsObject extends CreateBaseAppsPermissionsObject {
  resourcesToAdd?: GranularPermissionAddResourceItems<ResourceType.APP>;
}

export interface CreateWorkflowPermissionsObject extends CreateBaseAppsPermissionsObject {
  resourcesToAdd?: GranularPermissionAddResourceItems<ResourceType.WORKFLOWS>;
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

type ResourceToPermissionItemMap = {
  [ResourceType.APP]: AppsPermissionAddResourceItem[];
  [ResourceType.DATA_SOURCE]: DataSourcesPermissionResourceItem[];
  [ResourceType.WORKFLOWS]: WorkflowsPermissionAddResourceItem[];
};

export type GranularPermissionAddResourceItems<T extends ResourceType> = ResourceToPermissionItemMap[T];

interface BaseAppsPermissionAddResourceItem {
  appId: string;
}

export interface AppsPermissionAddResourceItem extends BaseAppsPermissionAddResourceItem {}

export interface WorkflowsPermissionAddResourceItem extends BaseAppsPermissionAddResourceItem {}

interface BaseAppsGroupPermissionsActions {
  canEdit: boolean;
  canView: boolean;
}

interface BaseAppsPermissionAddResourceItem {
  appId: string;
}

export interface DataSourcesPermissionResourceItem {
  dataSourceId: string;
}

export interface AppsGroupPermissionsActions extends BaseAppsGroupPermissionsActions {
  hideFromDashboard: boolean;
}

export interface WorkflowsGroupPermissionsActions extends BaseAppsGroupPermissionsActions {}

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

export interface UpdateResourceGroupPermissionsObject<
  T extends ResourceType.APP | ResourceType.DATA_SOURCE | ResourceType.WORKFLOWS
> {
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

type ResourceActionMap = {
  [ResourceType.APP]: AppsGroupPermissionsActions;
  [ResourceType.DATA_SOURCE]: DataSourcesGroupPermissionsActions;
  [ResourceType.WORKFLOWS]: WorkflowsGroupPermissionsActions;
};

export type ResourceGroupActions<T extends ResourceType> = ResourceActionMap[T];

export interface ValidateResourceAction {
  isBuilderPermissions: boolean;
  organizationId: string;
  groupId: string;
}
