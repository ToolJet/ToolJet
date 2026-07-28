export type SourceOptions = {
  database: string;
  database_type: string;
  host: string;
  port: string;
  username: string;
  password: string;
  ssl_enabled: boolean;
  client_path_type: string;
  path: string;
  instant_client_version: string;
  use_tns_alias: string;
  tns_alias: string;
  config_dir: string;
  wallet_file?: string;
  wallet_file_path:string;
  wallet_password?: string; 
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  query_params: string[][];
  table: string;
  primary_key_column: string;
  primary_key_columns?: string[];
  records: Record<string, unknown>[];

  list_rows?: {
    where_filters?: any;
    order_filters?: any;
    aggregates?: any;
    group_by?: any;
  };

  limit?: string | number;
  offset?: string | number;

  create_row?: {
    columns?: any;
  };

  update_rows?: {
    columns?: any;
    where_filters?: any;
  };

  upsert_rows?: {
    columns?: any;
  };

  delete_rows?: {
    where_filters?: any;
  };

  allow_multiple_updates?: boolean;
  zero_records_as_success?: boolean;

};
