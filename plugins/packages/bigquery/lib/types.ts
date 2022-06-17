export type SourceOptions = {
  private_key: string;
};
export type QueryOptions = {
  operation: string;
  options: string;
  query: string;
  datasetId: string;
  queryOptions: string;
  queryResultsOptions: string;
  tableId: string;
  rows: string;
  condition: string;
  columns: Array<object>;
  values: string;
  view_name: string;
};
