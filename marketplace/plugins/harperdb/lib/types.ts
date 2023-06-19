export type SourceOptions = {
  host: string;
  port: string;
  protocol: string;
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