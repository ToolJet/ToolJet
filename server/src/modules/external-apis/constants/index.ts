export enum FEATURE_KEY {
  GET_ALL_USERS = 'GET_ALL_USERS',
  GET_USER = 'GET_USER',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  REPLACE_USER_WORKSPACES = 'REPLACE_USER_WORKSPACES',
  UPDATE_USER_WORKSPACE = 'UPDATE_USER_WORKSPACE',
  GET_ALL_WORKSPACES = 'GET_ALL_WORKSPACES',
  UPDATE_USER_ROLE = 'UPDATE_USER_ROLE',
  PULL_NEW_APP = 'PULL_NEW_APP',
  PULL_EXISTING_APP = 'PULL_EXISTING_APP',
  PUSH_APP_VERSION = 'PUSH_APP_VERSION',
  CREATE_ORG_GIT = 'CREATE_ORG_GIT',
  AUTO_PROMOTE_APP = 'AUTO_PROMOTE_APP',
  GET_ALL_WORKSPACE_APPS = 'GET_ALL_WORKSPACE_APPS',
  IMPORT_APP = 'IMPORT_APP',
  EXPORT_APP = 'EXPORT_APP',
}

export type DefaultDataSourceKind = 'restapi' | 'runjs' | 'runpy' | 'tooljetdb' | 'workflows';
export type NewRevampedComponent =
  | 'Text'
  | 'TextInput'
  | 'PasswordInput'
  | 'NumberInput'
  | 'Table'
  | 'Button'
  | 'Checkbox';
export type DefaultDataSourceName =
  | 'restapidefault'
  | 'runjsdefault'
  | 'runpydefault'
  | 'tooljetdbdefault'
  | 'workflowsdefault';

export const DefaultDataSourceKinds: DefaultDataSourceKind[] = ['restapi', 'runjs', 'runpy', 'tooljetdb', 'workflows'];
export const DefaultDataSourceNames: DefaultDataSourceName[] = [
  'restapidefault',
  'runjsdefault',
  'runpydefault',
  'tooljetdbdefault',
  'workflowsdefault',
];
export const NewRevampedComponents: NewRevampedComponent[] = [
  'Text',
  'TextInput',
  'PasswordInput',
  'NumberInput',
  'Table',
  'Checkbox',
  'Button',
];
