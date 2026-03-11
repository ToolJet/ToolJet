export interface SourceOptions {
  connection_type?: 'manual' | 'string';
  connection_string?: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  instanceName?: string;
  azure?: boolean;
  connection_options?: string[][];
  ssh_enabled?: 'enabled' | 'disabled';
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_auth_type?: 'password' | 'private_key';
  ssh_password?: string;
  ssh_private_key?: string;
  ssh_passphrase?: string;
}
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  table: string;
  schema?: string;
  primary_key_column?: string;
  primary_key_columns?: string | string[];
  records: Record<string, unknown>[];
  query_params: string[][];
  limit?: string | number;
  offset?: string | number;
  // GUI mode – list_rows (nested under list_rows key)
  list_rows?: {
    where_filters?: Record<string, { column: string; operator: string; value?: unknown }>;
    order_filters?: Record<string, { column: string; order?: string }>;
    aggregates?: Record<string, { aggFx: string; column: string; table_id?: string }>;
    group_by?: Record<string, string[]>;
  };
  // GUI mode – create_row (nested under create_row key)
  create_row?: {
    columns?: Record<string, { column: string; value?: unknown }>;
  };
  // GUI mode – update_rows (nested under update_rows key)
  update_rows?: {
    columns?: Record<string, { column: string; value?: unknown }>;
    where_filters?: Record<string, { column: string; operator: string; value?: unknown }>;
  };
  // GUI mode – upsert_rows (nested under upsert_rows key)
  upsert_rows?: {
    columns?: Record<string, { column: string; value?: unknown }>;
  };
  // GUI mode – delete_rows (nested under delete_rows key)
  delete_rows?: {
    where_filters?: Record<string, { column: string; operator: string; value?: unknown }>;
  };
  // GUI mode – update_rows / upsert_rows safety options (top-level)
  allow_multiple_updates?: boolean;
  zero_records_as_success?: boolean;
};
