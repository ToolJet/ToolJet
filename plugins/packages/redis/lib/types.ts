export type SourceOptions = {
  host: string;
  port: string;
  username: string;
  password: string;
  tls: boolean;
  connection_options: string[][];
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
};
