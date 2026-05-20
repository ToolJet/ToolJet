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
  use_tns_alias: string;
  tns_alias: string;
  config_dir: string;
  wallet_file?: string;
  wallet_file_path:string;
  wallet_password?: string; 

};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  query_params?: string[][];
};
