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
  queryOptions: string;
  queryResultsOptions: string;
  tableId: string;
  rows: string;
  condition: string;
  columns: object;
  viewcolumns: string;
  values: string;
  view_name: string;
};
