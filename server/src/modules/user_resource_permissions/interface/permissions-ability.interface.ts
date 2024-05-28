import {
  APP_RESOURCE_ACTIONS,
  DATA_QUERIES_RESOURCE_ACTIONS,
  ORGANIZATION_CONSTANT_RESOURCE_ACTIONS,
  ORGANIZATION_RESOURCE_ACTIONS,
  TOOLJET_RESOURCE,
} from 'src/constants/global.constant';

export interface ResourcePermissionObject {
  resource: TOOLJET_RESOURCE;
  resourceId?: string;
  action: ResourceAction;
  organizationId: string;
}

export interface ResourcePermissionQueryObject {
  resource: TOOLJET_RESOURCE;
  resourceId?: string;
  action?: ResourceAction;
  organizationId: string;
}

export type ResourceAction =
  | APP_RESOURCE_ACTIONS
  | DATA_QUERIES_RESOURCE_ACTIONS
  | DATA_QUERIES_RESOURCE_ACTIONS
  | ORGANIZATION_RESOURCE_ACTIONS
  | ORGANIZATION_CONSTANT_RESOURCE_ACTIONS;
