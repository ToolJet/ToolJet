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
  primary_key_column: string;
  records: Record<string, unknown>[];
  query_params: string[][];
};
