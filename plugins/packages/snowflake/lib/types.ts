export type SourceOptions = {
  username: string;
  account: string;
  database: string;
  warehouse: string;
  schema: string;
  role: string;
  password: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  access_token: string;
  auth_type: string;
  auth_url?: string;
  access_token_url?: string;
  client_auth?: string;
  scopes?: string;
  custom_auth_params?: Record<string, string>;
  custom_query_params?: Record<string, string>;
  oauth_type: string;
  multiple_auth_enabled?: boolean;
  grant_type?: string;
  tokenData?: any;
};
export type QueryOptions = {
  query: string;
};
