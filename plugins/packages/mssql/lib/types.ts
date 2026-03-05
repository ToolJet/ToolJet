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
  // GUI mode – list_rows
  where_filters?: Record<string, { column: string; operator: string; value?: unknown }>;
  order_filters?: Record<string, { column: string; order?: string }>;
  aggregates?: Record<string, { aggFx: string; column: string; table_id?: string }>;
  group_by?: Record<string, string[]>;
  limit?: string | number;
  offset?: string | number;
  // GUI mode – create_row / update_rows
  columns?: Record<string, { column: string; value?: unknown }>;
};
