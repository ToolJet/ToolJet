export type SourceOptions = {
  host: string;
  port: string;
  username: string;
  password: string;
  tls_enabled: boolean;
  tls_certificate: string;
  ca_cert: string;
  client_cert: string;
  client_key: string;
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
};
