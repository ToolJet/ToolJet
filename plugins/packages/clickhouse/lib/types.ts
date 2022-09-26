export type SourceOptions = {
  port: string;
  username: string;
  password: string;
  host: string;
  database: string;
  protocol: string;
  usePost?: string;
  trimQuery?: string;
  isUseGzip?: string;
  debug?: string;
  raw?: string;
};
export type QueryOptions = {
  operation: string;
  query: string;
  fields: Array<string>;
  tablename: string;
};
