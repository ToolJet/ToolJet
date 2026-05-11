export type SourceOptions = {
  authentication_type: 'personal_access_token' | 'oauth2';
  // PAT fields
  host: string;
  port: string;
  http_path: string;
  default_catalog: string;
  default_schema: string;
  personal_access_token: string;
  // OAuth fields
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
};
