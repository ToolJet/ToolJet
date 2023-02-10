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
  connection_options: string[][];
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
};
