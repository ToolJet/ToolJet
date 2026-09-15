import { QueryResult } from '@tooljet-plugins/common';

// eslint-disable-next-line @typescript-eslint/ban-types
export type SourceOptions = {
  bearer_token: string;
  username: string;
  password: string;
  api_keys: any;
  auth_key: string;
  host?: string;
  // Note: no `spec`/`raw_spec`/`spec_metadata` here by design - run() never needs the spec,
  // only host/auth/the pre-resolved path+params already stored on the query itself. Those
  // keys are excluded from sourceOptions upstream (see RUNTIME_EXCLUDED_OPTION_KEYS in
  // @modules/data-sources/constants on the server).
};
export type QueryOptions = {
  host: string;
  path: string;
  operation: any;
  params: any;
};
export interface OpenApiV2Result extends QueryResult {
  request?: Array<object> | object;
  response?: Array<object> | object;
  responseHeaders?: Array<object> | object;
}
