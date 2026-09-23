export type SourceOptions = {
  host: string;
  user: string;
  password: string;
  connectionLimit: string;
  port: string;
  database: string;
  connection_options: string[][];
  ssl_certificate: string;
  ssl_enabled: boolean;
  ca: string;
  cert: string;
  key: string;
  allow_dynamic_connection_parameters: boolean;
  ssh_enabled?: 'enabled' | 'disabled';
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_auth_type?: 'password' | 'private_key';
  ssh_password?: string;
  ssh_private_key?: string;
  ssh_passphrase?: string;
};

export type QueryOptions = {
  mode: string;
  operation: string;
  query: string;
  table: string;
  primary_key_columns?: string | string[];
  records: Record<string, unknown>[];
  query_params?: string[][];

  // dynamic connection parameter overrides
  host?: string;
  database?: string;

  // GUI mode – list_rows
  list_rows?: {
    where_filters?: Record<string, { column: string; operator: string; value?: unknown }>;
    order_filters?: Record<string, { column: string; order?: string }>;
    aggregates?: Record<string, { aggFx: string; column: string; table_id?: string }>;
    group_by?: Record<string, string[]>;
  };
  limit?: string | number;
  offset?: string | number;

  // GUI mode – create_row
  create_row?: {
    columns?: Record<string, { column: string; value?: unknown }>;
  };

  // GUI mode – update_rows
  update_rows?: {
    columns?: Record<string, { column: string; value?: unknown }>;
    where_filters?: Record<string, { column: string; operator: string; value?: unknown }>;
  };

  // GUI mode – upsert_rows
  upsert_rows?: {
    columns?: Record<string, { column: string; value?: unknown }>;
  };

  // GUI mode – delete_rows
  delete_rows?: {
    where_filters?: Record<string, { column: string; operator: string; value?: unknown }>;
  };

  // GUI mode safety toggles
  allow_multiple_updates?: boolean | string;
  zero_records_as_success?: boolean | string;
};