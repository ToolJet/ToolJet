export type SourceOptions = {
  account_id: string;
  api_token: string;
};

export type QueryOptions = {
  operation: 'query' | 'raw_query' | 'list_databases' | 'get_database' | 'create_database' | 'delete_database';
  database_id?: string;
  sql?: string;
  params?: any;
  name?: string;
  page?: number | string;
  per_page?: number | string;
  primary_location_hint?: string;
};
