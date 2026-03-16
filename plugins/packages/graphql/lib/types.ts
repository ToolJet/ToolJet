export type SourceOptions = {
  url: string;
  headers: any;
  url_params: any;
  body?: any;
  cookies?: any;
  ssl_certificate?: string;
  ca_cert?: string;
  client_key?: string;
  client_cert?: string;
};
export type QueryOptions = {
  operation: string;
  query: string;
  headers?: [string, string][];
  url_params?: [string, string][]; 
  cookies?: [string, string][];
  variables?: string;
};
