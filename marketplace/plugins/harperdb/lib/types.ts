export type SourceOptions = {
  host: string;
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
  hash_values: string;
  attributes: string;
  search_attribute: string;
  search_value: string;
};