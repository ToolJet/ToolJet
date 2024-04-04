import { QueryError, SupabaseClient } from '@supabase/supabase-js';

export type SourceOptions = {
  project_url: string;
  service_role_secret: string;
};
export type QueryOptions = {
  operation: string;
  body: string;
  get_table_name: string;
  create_table_name: string;
  update_table_name: string;
  delete_table_name: string;
  count_table_name: string;
  create_column_name: string;
  delete_column_name: string;
  count_column_name: string;
  get_filters: object;
  update_filters: object;
  delete_filters: object;
  count_filters: object;
  get_sort: object;
  create_sort: object;
  update_sort: object;
  delete_sort: object;
  delete_limit: number;
  get_limit: number;
  create_body: string;
  update_column_fields: object;
};

export type Column = {
  column: string;
  value: string;
};

export type Filter = {
  operator: string;
  column: string;
  value: string;
};

export type Sort = {
  column: string;
  order: string;
};

export type ResultType = {
  created: boolean;
  deleted: boolean;
};

export type SupabaseQueryError = QueryError;

export type SupabaseQueryResult = object[] | object | { created: boolean } | { deleted: boolean };

export type SupabaseClientType = SupabaseClient;

export type Response = {
  error: SupabaseQueryError;
  data: SupabaseQueryResult;
};
