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
  TEST_CONNECTION_SAMPLE_DB = 'TEST_CONNECTION_SAMPLE_DB',
  GET_OAUTH2_BASE_URL = 'GET_OAUTH2_BASE_URL',
  AUTHORIZE = 'AUTHORIZE',
  QUERIES_LINKED_TO_DATASOURCE = 'QUERIES_LINKED_TO_DATASOURCE',
  QUERIES_DATASOURCE_LINKED_TO_MARKETPLACE_PLUGIN = 'QUERIES_DATASOURCE_LINKED_TO_MARKETPLACE_PLUGIN',
  VALIDATE_OPTIONS = 'VALIDATE_OPTIONS',
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

// Set on sample data source options when no restricted role could be provisioned.
export const SAMPLE_SQL_DISABLED_KEY = 'sample_sql_disabled';
