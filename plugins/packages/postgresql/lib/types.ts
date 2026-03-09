export type SourceOptions = {
  database: string;
  host: string;
  port: string;
  username: string;
  password: string;
  ssl_enabled: boolean;
  ssl_certificate: string;
  ca_cert: string;
  client_cert: string;
  client_key: string;
  root_cert: string;
  connection_type: string;
  connection_string: string;
  connection_options: string[][];
  allow_dynamic_connection_parameters: boolean;
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  table: string;
  schema?: string;
  primary_key_column: string;
  primary_key_columns?: string[];
  records: Record<string, unknown>[];
  query_params: string[][];
  // GUI mode – list_rows (nested under list_rows key)
  list_rows?: {
    where_filters?: Record<string, { column: string; operator: string; value?: unknown }>;
    order_filters?: Record<string, { column: string; order?: string }>;
    aggregates?: Record<string, { aggFx: string; column: string; table_id?: string }>;
    group_by?: Record<string, string[]>;
  };
  limit?: string | number;
  offset?: string | number;
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
