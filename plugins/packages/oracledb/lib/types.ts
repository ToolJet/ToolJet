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
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
};
