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
  ssh_enabled?: boolean;
  ssh_host?: string;
  ssh_port?: string;
  ssh_username?: string;
  ssh_auth_type?: 'password' | 'privateKey';
  ssh_password?: string;
  ssh_private_key?: string;
  ssh_private_key_path?: string;
  ssh_passphrase?: string;

};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  table: string;
  primary_key_column: string;
  records: Record<string, unknown>[];
  query_params: string[][];
  host?: string;     // Overrides for dynamic connection
  database?: string;
};
