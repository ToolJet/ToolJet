export type SourceOptions = {
  database: string;
  host: string;
  instanceName: string;
  port: string;
  username: string;
  password: string;
  connection_options: string[][];
  azure: boolean;
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  table: string;
  primary_key_column: string;
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
