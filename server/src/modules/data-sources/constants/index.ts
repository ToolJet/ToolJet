import { DefaultDataSourceKind } from '../types';

export enum FEATURE_KEY {
  GET = 'GET',
  GET_FOR_APP = 'GET_FOR_APP',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SCOPE_CHANGE = 'SCOPE_CHANGE',
  GET_BY_ENVIRONMENT = 'GET_BY_ENVIRONMENT',
  TEST_CONNECTION = 'TEST_CONNECTION',
  GET_OAUTH2_BASE_URL = 'GET_OAUTH2_BASE_URL',
  AUTHORIZE = 'AUTHORIZE',
}

export enum DataSourceTypes {
  STATIC = 'static',
  DEFAULT = 'default',
  SAMPLE = 'sample',
}

export enum DataSourceScopes {
  LOCAL = 'local',
  GLOBAL = 'global',
}

export const DefaultDataSourceKinds: DefaultDataSourceKind[] = ['restapi', 'runjs', 'runpy', 'tooljetdb', 'workflows'];
