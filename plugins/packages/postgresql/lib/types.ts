export type SourceOptions = {
  database: string;
  host: string;
  port: string;
  username: string;
  password: string;
  // SSL
  ssl_enabled?: 'enabled' | 'disabled';
  ssl_certificate: string;
  ca_cert: string;
  client_cert: string;
  client_key: string;
  root_cert: string;
  connection_type: string;
  connection_string: string;
  connection_options: string[][];
  allow_dynamic_connection_parameters: boolean;

  // SSH tunnel
  ssh_enabled?: 'enabled' | 'disabled';
  ssh_host?: string;
  ssh_port?: string;
  ssh_username?: string;
  ssh_auth_type?: 'private_key' | 'password'; // matches manifest enum values
  ssh_private_key?: string;
  ssh_passphrase?: string;
  ssh_password?: string;
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
