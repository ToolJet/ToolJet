export type SourceOptions = {
  database: string;
  host: string;
  port: string;
  username: string;
  password: string;
  azure: boolean;
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  table: string;
  primary_key_column: string;
  records: any;
};
