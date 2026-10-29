export type SourceOptions = {
  access_token?: string;
  [key: string]: unknown;
};

export type QueryOptions = {
  operation: string;
  path: string;
  params: {
    path: Record<string, unknown>;
    query: Record<string, unknown>;
    request: Record<string, unknown>;
  };
};

export type QueryResult = {
  status: 'ok' | 'failed';
  data: Array<object> | object;
};
