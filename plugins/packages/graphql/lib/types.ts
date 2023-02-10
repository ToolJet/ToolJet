export type SourceOptions = { url: string; headers: any; url_params: any };
export type QueryOptions = {
  operation: string;
  query: string;
  headers?: [string, string][];
  variables?: string;
};
