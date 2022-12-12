export type SourceOptions = {
  access_key: string;
  secret_key: string;
  region: string;
  output_location: string;
  database: string;
};
export type QueryOptions = {
  operation: string;
  query: string;
  pagination: string;
  queryExecutionId: string;
  nextToken: string;
};
