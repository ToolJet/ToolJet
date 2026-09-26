import { QueryResult } from '@tooljet-plugins/common';

// [key, value] tuples, same shape REST API uses for its own Headers/URL parameters/Body/Cookies
// credentials fields - see plugins/packages/restapi/lib/types.ts and manifest.json.
type KeyValuePairs = Array<[string, string]>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type SourceOptions = {
  bearer_token: string;
  username: string;
  password: string;
  api_keys: any;
  auth_key: string;
  host?: string;
  // Credentials section - datasource-level only, no per-query equivalent (see run()'s comment).
  headers?: KeyValuePairs;
  url_parameters?: KeyValuePairs;
  body?: KeyValuePairs;
  cookies?: KeyValuePairs;
  // No `spec`/`raw_spec`/`spec_metadata` here by design - excluded upstream via
  // RUNTIME_EXCLUDED_OPTION_KEYS (server @modules/data-sources/constants); run() never needs the spec.
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
