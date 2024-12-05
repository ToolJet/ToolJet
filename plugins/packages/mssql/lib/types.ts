export type SourceOptions = {
  database: string;
  host: string;
  instanceName: string;
  port: string;
  username: string;
  password: string;
  azure: boolean;
  connection_options: string[][];
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  table: string;
  primary_key_column: string;
  records: Record<string, unknown>[];
  query_params: string[][];
};
