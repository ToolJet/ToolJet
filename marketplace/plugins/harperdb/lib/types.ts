export type SourceOptions = {
  host: string;
  port: string;
  ssl_enabled: boolean;
  username: string;
  password: string;
};
export type QueryOptions = {
  mode: string;
  operation: string;
  sql_query: string;
  schema: string;
  table: string;
  records: string;
};