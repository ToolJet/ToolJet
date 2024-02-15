export type SourceOptions = {
  api_key?: string;
  personal_access_token?: string;
};

export type QueryOptions = {
  operation: string;
  base_id: string;
  table_name: string;
  page_size: string;
  record_id: string;
  body: string;
  offset: string;
};
