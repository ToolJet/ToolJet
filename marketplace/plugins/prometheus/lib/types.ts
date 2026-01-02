export interface SourceOptions {
  server_url?: string;
  username?: string;
  password?: string;
  tls_certificate?: string;
  ca_cert?: string;
  client_key?: string;
  client_cert?: string;
}

export interface QueryOptions {
  operation: string;
  iq_query?: string;
  iq_time?: string;
  iq_timeout?: string;
  iq_limit?: string;
  iq_requestMethod?: string;
  rq_query?: string;
  rq_start?: string;
  rq_end?: string;
  rq_step?: string;
  rq_timeout?: string;
  rq_limit?: string;
  rq_requestMethod?: string;
}
