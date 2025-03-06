import { CreateDefaultGroupObject } from '../types';
import { CreateResourcePermissionObject } from '../types/granular_permissions';

export enum GROUP_PERMISSIONS_TYPE {
  DEFAULT = 'default',
  CUSTOM_GROUP = 'custom',
}

export enum USER_ROLE {
  END_USER = 'end-user',
  ADMIN = 'admin',
  BUILDER = 'builder',
}

export const HUMANIZED_USER_LIST = ['End-user', 'Builder', 'Admin'];

export enum ResourceType {
  APP = 'app',
  DATA_SOURCE = 'data_source',
}

export const DEFAULT_GROUP_PERMISSIONS = {
  ADMIN: {
    name: USER_ROLE.ADMIN,
    type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    appCreate: true,
    appDelete: true,
    folderCRUD: true,
    orgConstantCRUD: true,
    dataSourceCreate: true,
    dataSourceDelete: true,
    isBuilderLevel: true,
  },
  BUILDER: {
    name: USER_ROLE.BUILDER,
    type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    appCreate: true,
    appDelete: true,
    folderCRUD: true,
    orgConstantCRUD: true,
    dataSourceCreate: false,
    dataSourceDelete: false,
    isBuilderLevel: true,
  },
  END_USER: {
    name: USER_ROLE.END_USER,
    type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    appCreate: false,
    appDelete: false,
    folderCRUD: false,
    orgConstantCRUD: false,
    dataSourceCreate: false,
    dataSourceDelete: false,
    isBuilderLevel: false,
  },
} as Record<string, CreateDefaultGroupObject>;

export const DEFAULT_RESOURCE_PERMISSIONS = {
  [USER_ROLE.ADMIN]: {
    [ResourceType.APP]: {
      canEdit: true,
      canView: false,
      hideFromDashboard: false,
    },
    [ResourceType.DATA_SOURCE]: {
      action: {
        canConfigure: true,
        canUse: false,
      },
    },
  },
  [USER_ROLE.END_USER]: {
    [ResourceType.APP]: {
      canEdit: false,
      canView: true,
      hideFromDashboard: false,
    },
  },
  [USER_ROLE.BUILDER]: {
    [ResourceType.APP]: {
      canEdit: true,
      canView: false,
      hideFromDashboard: false,
    },
    [ResourceType.DATA_SOURCE]: {
      action: {
        canConfigure: true,
        canUse: false,
      },
    },
  },
} as Record<USER_ROLE, Record<ResourceType, CreateResourcePermissionObject<any>>>;

export enum FEATURE_KEY {
  CREATE = 'create',
  GET_ONE = 'get_a_group',
  GET_ALL = 'get_all_groups',
  UPDATE = 'update',
  DELETE = 'delete',
  DUPLICATE = 'duplicate',
  ADD_GROUP_USER = 'add_group_user',
  GET_ALL_GROUP_USER = 'get_all_group_user',
  DELETE_GROUP_USER = 'delete_group_user',
  GET_ADDABLE_USERS = 'get_addable_group_user',
  GET_ADDABLE_APPS = 'get_addable_apps',
  GET_ADDABLE_DS = 'get_addable_ds',
  CREATE_GRANULAR_PERMISSIONS = 'create_granular_permissions',
  GET_ALL_GRANULAR_PERMISSIONS = 'get_all_granular_permissions',
  UPDATE_GRANULAR_PERMISSIONS = 'update_granular_permissions',
  DELETE_GRANULAR_PERMISSIONS = 'delete_granular_permissions',
  USER_ROLE_CHANGE = 'change_user_role',
}
