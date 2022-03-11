export type SourceOptions = { access_key: string; secret_key: string; region: string };
export type QueryOptions = {
  table: string;
  key: string;
  scan_condition: string;
  query_condition: string;
  operation: string;
};
