export type SourceOptions = {
  database: string;
  host: string;
  instanceName: string;
  port: string;
  username: string;
  password: string;
  connection_options: string[][];
  azure: boolean;
  ssh_enabled?: boolean;
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_auth_type?: 'password' | 'private_key';
  ssh_password?: string;   
  ssh_private_key?: string; 
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
};
