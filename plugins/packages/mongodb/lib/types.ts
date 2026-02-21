export type SourceOptions = {
  connection_type: string;
  database: string;
  host: string;
  port: string;
  username: string;
  password: string;
  ca_cert: string;
  client_cert: string;
  client_key: string;
  tls_certificate: string;
  connection_format: string;
  use_ssl: boolean,
  query_params: string
  connection_string: string;

  ssh_enabled: boolean;
  ssh_host: string;
  ssh_port: number;
  ssh_username: string;
  ssh_auth_type: 'password' | 'privateKey';
  ssh_password: string;
  ssh_private_key: string;
  ssh_passphrase: string;
  ssh_dst_host: string;
  ssh_dst_port: number;
  ssh_local_port: number;

};
export type QueryOptions = {
  operation: string;
  collection: string;
  document: string;
  options: string;
  filter: string;
  documents: string;
  update: string;
  field: string;
  replacement: string;
  operations: string;
  pipeline: string;
};
