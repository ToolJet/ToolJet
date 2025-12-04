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
