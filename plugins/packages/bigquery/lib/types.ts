export type SourceOptions = {
  private_key: string;
  scope?: string;
};
export type QueryOptions = {
  mode?: string;
  operation: string;
  options: string;
  query: string;
  query_params?: [string, any][];
  datasetId: string;
  queryOptions: string | object;
  queryResultsOptions: string | object;
  tableId: string;
  rows: string;
  records?: any;
  primary_key_columns?: any;
  condition: string;
  columns: object;
  viewcolumns: string;
  values: string;
  view_name: string;
};
