export type SourceOptions = {
  host: string;
  port: string;
  database: string;
  username: string;
  password?: string;
};

export type QueryOptions = {
  mode: string;
  query: string;
  query_params?: string[][];
};
