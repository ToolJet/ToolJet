export interface SourceOptions {
  api_key: string;
}

export interface QueryOptions {
  operation?: string;
  endpoint?: string;
  method?: string;
  headers?: Array<[string, string]>;
  params?: Array<[string, string]>;
  body?: object | string;
  raw_body?: string;
  body_toggle?: boolean;
}