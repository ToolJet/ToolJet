export interface SourceOptions {
  connection_type?: 'manual' | 'string';
  connection_string?: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  instanceName?: string;
  azure?: boolean;
  connection_options?: string[][];
  ssh_enabled?: 'enabled' | 'disabled';
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_auth_type?: 'password' | 'private_key';
  ssh_password?: string;   
  ssh_private_key?: string; 
  ssh_passphrase?: string;
}
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  table: string;
  primary_key_column: string;
  records: Record<string, unknown>[];
  query_params: string[][];
};
