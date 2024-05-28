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
  GROUP_USER_UNIQUE: {
    dbConstraint: DataBaseConstraints.GROUP_USER_UNIQUE,
    message: 'User already present in the group',
  },
  GRANULAR_PERMISSIONS_NAME_UNIQUE: {
    dbConstraint: DataBaseConstraints.GRANULAR_PERMISSIONS_NAME_UNIQUE,
    message: 'Granular permission name should be unique',
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
    editable: true,
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
  GROUP_NOT_EXIST: "Group doesn't exist",
  DEFAULT_GROUP_NAME: 'Name cannot be same as user default group',
  DEFAULT_GROUP_NAME_UPDATE: 'Not allowed to change default group name',
  DEFAULT_GROUP_NAME_DELETE: 'Not allowed to delete default group',
  NON_EDITABLE_GROUP_UPDATE: 'Group cannot be update because its not allowed',
  NON_BUILDER_PERMISSION_UPDATE: 'End user cannot have this builder level permissions',
  DEFAULT_GROUP_UPDATE_NOT_ALLOWED: 'Defaults group cant be deleted',
  UPDATE_EDITABLE_PERMISSION_END_USER_GROUP:
    'End-users can only be granted permission to view apps. If you wish to add this permission, kindly change the following users role from end-user to builder- ',
  GROUP_USERS_EDITABLE_GROUP_ADDITION: (userEmail) => {
    return `The user ${userEmail} is an end-user and can only be granted permission to view apps. Kindly change their user role to be able to add them.`;
  },
  ADD_GROUP_USER_NON_EXISTING_USER: 'User is not present in this organization',
  DEFAULT_GROUP_ADD_USER_ROLE_EXIST: (role: USER_ROLE) => {
    return `User is already ${role}`;
  },
  ADD_GROUP_USER_DEFAULT_GROUP: 'Adding user to default group is not allowed',
  DELETING_DEFAULT_GROUP_USER: 'Deleting default user from default group is not allowed',
  EDITING_LAST_ADMIN_ROLE_NOT_ALLOWED:
    'Cannot change role of last present admin, please add another admin and change the role',
};
