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

// OpenAPI v2: worker-managed spec bookkeeping keys stored on data_source_options.options.
// These are never read by a query run - parseSourceOptions must skip them so run() never
// dereferences, decrypts, or constant-resolves the (potentially large) spec payload.
export const RUNTIME_EXCLUDED_OPTION_KEYS = [
  'raw_spec',
  'spec_metadata',
  'spec_checksum',
  'spec_status',
  'spec_error',
  'spec_job_id',
];
