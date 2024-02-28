export type SourceOptions = {
  secret_key: string;
  access_key: string;
  port: string;
  workgroup_name: string;
  database: string;
  region: string;
};
export type QueryOptions = {
  operation: string;
  sql_query: string;
  mode: string;
};
