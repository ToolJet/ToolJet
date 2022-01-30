export type SourceOptions = {
  scheme: string;
  host: string;
  port: string;
  username: string;
  password: string;
  ssl_enabled: boolean;
};

export type QueryOptions = {
  index: string;
  query: string;
  body: string;
  id: string;
  operation: string;
};
