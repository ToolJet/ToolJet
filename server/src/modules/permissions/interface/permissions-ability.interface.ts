import {
  APP_RESOURCE_ACTIONS,
  DATA_QUERIES_RESOURCE_ACTIONS,
  ORGANIZATION_CONSTANT_RESOURCE_ACTIONS,
  ORGANIZATION_RESOURCE_ACTIONS,
  TOOLJET_RESOURCE,
} from 'src/constants/global.constant';

export interface ResourcePermissionQueryObject {
  resources?: ResourcesItem[];
  organizationId: string;
}

export interface ResourcesItem {
  resource: TOOLJET_RESOURCE;
  resourceId?: string;
}

export interface ActionItem {
  action: ResourceAction;
  resource: TOOLJET_RESOURCE;
}

export interface UserPermissions {
  isAdmin: boolean;
  appCreate: boolean;
  appDelete: boolean;
  folderCRUD: boolean;
  orgConstantCRUD: boolean;
  orgVariableCRUD: boolean;
  [TOOLJET_RESOURCE.APP]?: UserAppsPermissions;
}

export interface UserAppsPermissions {
  editableAppsId: string[];
  isAllEditable: boolean;
  viewableAppsId: string[];
  isAllViewable: boolean;
  hiddenAppsId: string[];
  hideAll: boolean;
}

export type ResourceAction =
  | APP_RESOURCE_ACTIONS
  | DATA_QUERIES_RESOURCE_ACTIONS
  | DATA_QUERIES_RESOURCE_ACTIONS
  | ORGANIZATION_RESOURCE_ACTIONS
  | ORGANIZATION_CONSTANT_RESOURCE_ACTIONS;
