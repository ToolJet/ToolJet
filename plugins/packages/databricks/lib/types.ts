export type SourceOptions = {
  authentication_type: 'personal_access_token' | 'oauth2' | 'oauth_u2m';
  // PAT fields (datasource level)
  host: string;
  port: string;
  http_path: string;
  default_catalog: string;
  default_schema: string;
  personal_access_token: string;
  // OAuth shared fields
  client_id: string;
  client_secret: string;
  access_token: string;
  refresh_token: string;
  multiple_auth_enabled: boolean;
  tokenData: any[];
};

export type QueryOptions = {
  operation: string;
  sql_query: string;
  mode: string;
  // http_path is at query level for oauth_u2m (warehouse path e.g. /sql/1.0/warehouses/abc123)
  http_path?: string;
};
