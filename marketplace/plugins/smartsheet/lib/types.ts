export type AuthType = 'oauth2' | 'personal_access_token';

export type Region = 'us' | 'eu' | 'au';

export type SourceOptions = {
  auth_type?: AuthType;
  client_id?: string;
  client_secret?: string;
  redirect_url?: string;
  access_token_url?: string;
  auth_url?: string;
  access_token?: string;
  refresh_token?: string;
  region?: Region;
  scopes?: string;
  tokenData?: any;
  multiple_auth_enabled?: boolean;
  [key: string]: any;
};

export type QueryOptions = {
  operation?: string;
  path?: string;
  params?: {
    path?: Record<string, any>;
    query?: Record<string, any>;
    request?: Record<string, any> | any[];
  };
  selectedOperation?: any;
  [key: string]: any;
};
