export type SourceOptions = { api_token: string; baserow_host: string; base_url?: string };
export type QueryOptions = {
  operation: string;
  table_id: string;
  row_id: number;
  before_id: number;
  body: string;
};
