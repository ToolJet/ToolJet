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
  connection_options: string[][];
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
  query: string;
  query_params: [string, string][];
  mode: string;
  // GUI mode fields
  table?: string;
  limit?: string | number;
  offset?: string | number;
  primary_key_columns?: string | string[];
  allow_multiple_updates?: boolean | string;
  zero_records_as_success?: boolean | string;
  records?: Record<string, unknown>[];
  list_rows?: {
    where_filters?: Record<string, any>;
    order_filters?: Record<string, any>;
    aggregates?: Record<string, any>;
    group_by?: Record<string, any>;
  };
  create_row?: {
    columns?: Record<string, any>;
  };
  update_rows?: {
    columns?: Record<string, any>;
    where_filters?: Record<string, any>;
  };
  delete_rows?: {
    where_filters?: Record<string, any>;
  };
  upsert_rows?: {
    columns?: Record<string, any>;
  };
};
