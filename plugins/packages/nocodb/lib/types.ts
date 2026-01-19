export type SourceOptions = { api_token: string; api_version: string; nocodb_host: string; base_url?: string };
export type QueryOptions = {
  operation: string;
  base_id: string;
  table_id: string;
  record_id: number;
  body: string;
  query_string: string;
};
