export type SourceOptions = {
  database: string;
  host: string;
  port: string;
  socket_path: string;
  username: string;
  password: string;
  ssl_enabled: boolean;
  ssl_certificate: string;
  ca_cert: string;
  client_cert: string;
  client_key: string;
  root_cert: string;
  connection_options: string[][];
  allow_dynamic_connection_parameters: boolean;
  connection_type: string;
  connection_string: string; 
  protocol: string;
  ssh_enabled?: 'enabled' | 'disabled';
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
  allow_multiple_updates?: boolean;
  zero_records_as_success?: boolean;
  limit?: string | number;
  offset?: string | number;
  list_rows?: {
    where_filters?: Record<string, any>;
    order_filters?: Record<string, any>;
    aggregates?: Record<string, any>;
    group_by?: Record<string, any>;
  };
  create_row?: {
    columns?: Record<string, any>;
  };
  update_rows?: {
    columns?: Record<string, any>;
    where_filters?: Record<string, any>;
  };
  upsert_rows?: {
    columns?: Record<string, any>;
  };
  delete_rows?: {
    where_filters?: Record<string, any>;
  };
};
