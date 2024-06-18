import { CreateResourcePermissionObject } from '../interface/granular-permissions.interface';
import { USER_ROLE } from './group-permissions.constant';

export enum ResourceType {
  APP = 'app',
  DATA_SOURCE = 'data_source',
}

export const DEFAULT_GRANULAR_PERMISSIONS_NAME = {
  [ResourceType.APP]: 'Apps',
  [ResourceType.DATA_SOURCE]: 'Data sources',
};

export const DEFAULT_RESOURCE_PERMISSIONS = {
  [USER_ROLE.ADMIN]: {
    [ResourceType.APP]: {
      canEdit: true,
      canView: true,
      hideFromDashboard: false,
    },
  },
  [USER_ROLE.END_USER]: {
    [ResourceType.APP]: {
      canEdit: false,
      canView: false,
      hideFromDashboard: false,
    },
  },
  [USER_ROLE.BUILDER]: {
    [ResourceType.APP]: {
      canEdit: true,
      canView: true,
      hideFromDashboard: false,
    },
  },
} as Record<USER_ROLE, Record<ResourceType, CreateResourcePermissionObject>>;

export const ERROR_HANDLER = {
  ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS: 'Cannot create granular permissions of admin group',
  EDITOR_LEVEL_PERMISSIONS_NOT_ALLOWED:
    'End-users can only be granted permission to view apps. If you wish to add this permission, kindly change the following users role from end-user to builder',
  EDITOR_LEVEL_PERMISSION_NOT_ALLOWED_END_USER: 'Cannot assign builder level permission to end users',
  UPDATE_EDITABLE_PERMISSION_END_USER_GROUP:
    'End-users can only be granted permission to view apps. If you wish to add this permission, kindly change the following users role from end-user to builder- ',
};
