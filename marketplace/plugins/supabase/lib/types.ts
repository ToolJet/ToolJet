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
  update_column_name: string;
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
  update_column_value: string;
  create_body: string;
};