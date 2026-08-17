export interface SourceOptions {
  apiKey: string;
  proxy_location?: string;
}

export interface QueryOptions {
  operation: string;
  ws_query?: string;
  ws_num?: string;
  ns_query?: string;
  ns_num?: string;
  rp_id?: string;
  rc_id?: string;
  rc_limit?: string;
  rc_sort?: string;
}
