import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '@modules/group-permissions/constants';
import { CreateDefaultGroupObject } from '@modules/group-permissions/types';
import {
  CreateAppsPermissionsObject,
  CreateDataSourcePermissionsObject,
} from '@modules/group-permissions/types/granular_permissions';

export const DEFAULT_GROUP_PERMISSIONS_MIGRATIONS = {
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
    appCreate: false,
    appDelete: false,
    folderCRUD: false,
    orgConstantCRUD: false,
    dataSourceCreate: false,
    dataSourceDelete: false,
    isBuilderLevel: false,
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

export type CreateResourcePermissionObjectGeneric = CreateAppsPermissionsObject | CreateDataSourcePermissionsObject;
