export type SourceOptions = {
  endpoint: string;
  key: string;
};
export type QueryOptions = {
  operation: string;
  database?: string;
  container?: string;
  items?: [];
  itemId?: string;
  query?: string;
};
