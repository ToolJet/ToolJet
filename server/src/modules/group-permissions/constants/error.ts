import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { USER_ROLE } from './index';

export const ERROR_HANDLER = {
  INVALID_LICENSE: 'Need license for this operation',
  GROUP_NOT_EXIST: "Group doesn't exist",
  EDITOR_LEVEL_PERMISSIONS_NOT_ALLOWED:
    'End-users can only be granted permission to view apps. If you wish to add this permission, kindly change the following users role from end-user to builder',
  RESERVED_KEYWORDS_FOR_GROUP_NAME: 'Group name cannot be same as reserved keywords',
  DEFAULT_GROUP_NAME: 'Group name already exists',
  DEFAULT_GROUP_NAME_UPDATE: 'Not allowed to change default group name',
  DEFAULT_GROUP_NAME_DELETE: 'Not allowed to delete default group',
  NON_EDITABLE_GROUP_UPDATE: 'Group cannot be update because its not allowed',
  NON_BUILDER_PERMISSION_UPDATE: 'End-user cannot have this builder level permissions',
  DEFAULT_GROUP_UPDATE_NOT_ALLOWED: 'Defaults group cant be deleted',
  UPDATE_EDITABLE_PERMISSION_END_USER_GROUP:
    'End-users can only be granted permission to view apps. If you wish to add this permission, kindly change the following users role from end-user to builder- ',
  GROUP_USERS_EDITABLE_GROUP_ADDITION: (userEmail) => {
    return `The user ${userEmail} is an end-user and can only be granted permission to view apps. Kindly change their user role to be able to add them.`;
  },
  ADD_GROUP_USER_NON_EXISTING_USER: 'User archived in this workspace',
  DEFAULT_GROUP_ADD_USER_ROLE_EXIST: (role: USER_ROLE) => {
    return `User is already ${role}`;
  },
  USER_IS_OWNER_OF_APPS: (userEmail) => {
    return `The user- ${userEmail} cannot be an end-user because they are the owner of the following application(s)- `;
  },
  ADD_GROUP_USER_DEFAULT_GROUP: 'Adding user to default group is not allowed',
  DELETING_DEFAULT_GROUP_USER: 'Deleting default user from default group is not allowed',
  EDITING_LAST_ADMIN_ROLE_NOT_ALLOWED:
    'Cannot change role of last present admin, please add another admin and change the role',
  ADMIN_DEFAULT_GROUP_GRANULAR_PERMISSIONS: 'Cannot create granular permissions of admin group',
  EDITOR_LEVEL_PERMISSION_NOT_ALLOWED_END_USER: 'Cannot assign builder level permission to end users',
};

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
