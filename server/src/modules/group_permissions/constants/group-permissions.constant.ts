import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { CreateDefaultGroupObject } from '../interface/group-permissions.interface';

// enum table -  group_permission_type
export enum GROUP_PERMISSIONS_TYPE {
  DEFAULT = 'default',
  CUSTOM_GROUP = 'custom_group',
}

export enum USER_ROLE {
  END_USER = 'end-user',
  ADMIN = 'admin',
  BUILDER = 'builder',
}

export const DATA_BASE_CONSTRAINTS = {
  GROUP_NAME_UNIQUE: {
    dbConstraint: DataBaseConstraints.GROUP_NAME_UNIQUE,
    message: 'Group name should be unique in workspace',
  },
};

export const DEFAULT_GROUP_PERMISSIONS = {
  ADMIN: {
    name: USER_ROLE.ADMIN,
    type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    editable: false,
    onlyBuilders: true,
    appCreate: true,
    appDelete: true,
    folderCRUD: true,
    orgConstantCRUD: true,
    dataSourceCreate: true,
    dataSourceDelete: true,
  },
  BUILDER: {
    name: USER_ROLE.BUILDER,
    type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    editable: false,
    onlyBuilders: true,
    appCreate: true,
    appDelete: true,
    folderCRUD: true,
    orgConstantCRUD: true,
    dataSourceCreate: true,
    dataSourceDelete: true,
  },
  END_USER: {
    name: USER_ROLE.END_USER,
    type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    editable: false,
    onlyBuilders: false,
    appCreate: false,
    appDelete: false,
    folderCRUD: false,
    orgConstantCRUD: false,
    dataSourceCreate: false,
    dataSourceDelete: false,
  },
} as Record<string, CreateDefaultGroupObject>;

export const ERROR_HANDLER = {
  DEFAULT_GROUP_NAME: 'Name cannot be same as user role group',
  NON_EDITABLE_GROUP_UPDATE: 'Group cannot be update because its not allowed',
  NON_BUILDER_PERMISSION_UPDATE: 'End user cannot have this builder level permissions',
  DEFAULT_GROUP_UPDATE_NOT_ALLOWED: 'Defaults group cant be deleted',
};
