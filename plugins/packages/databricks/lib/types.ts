export type SourceOptions = {
  host: string;
  port: string;
  http_path: string;
  default_catalog: string;
  default_schema: string;
  personal_access_token: string;
};
export type QueryOptions = {
  operation: string;
  sql_query: string;
  mode: string;
};
