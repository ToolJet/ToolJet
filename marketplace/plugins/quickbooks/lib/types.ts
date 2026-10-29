export type SourceOptions = {
  client_id: { value: string; encrypted?: boolean };
  client_secret: { value: string; encrypted?: boolean };
  scopes: { value: string };
  company_id: { value: string };
  access_token?: string;
  refresh_token?: string;
  [key: string]: any;
};

export type QueryOptions = {
  operation: string;
  path: string;
  params: {
    path: Record<string, any>;
    query: Record<string, any>;
    request: Record<string, any>;
  };
};

export type QueryResult = {
  status: 'ok' | 'failed' | 'needs_oauth';
  errorMessage?: string;
  data: Array<object> | object;
  metadata?: Array<object> | object;
};
