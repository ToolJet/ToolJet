export type SourceOptions = {
  connection_type: string;
  host: string;
  port: string;
  username: string;
  password: string;
  ssl_certificate: string;
  ca_cert: string;
  location: string;
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
