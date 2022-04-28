import { QueryResult } from '@tooljet-plugins/common';

// eslint-disable-next-line @typescript-eslint/ban-types
export type SourceOptions = {
  bearer_token: string;
  username: string;
  password: string;
  api_keys: any;
  auth_key: string;
  spec: any;
};
export type QueryOptions = {
  host: string;
  path: string;
  operation: any;
  params: any;
};
export interface RestAPIResult extends QueryResult {
  request?: Array<object> | object;
  response?: Array<object> | object;
  responseHeaders?: Array<object> | object;
}
