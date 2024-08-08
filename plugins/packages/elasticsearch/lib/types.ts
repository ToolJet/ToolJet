export type SourceOptions = {
  scheme: string;
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
};

export type QueryOptions = {
  operation: string;
  index?: string;
  query?: string;
  body?: string;
  id?: string;
  operations?: string;
  scroll_id?: string;
  scroll?: string;
};
