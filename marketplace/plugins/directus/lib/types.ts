export type SourceOptions = {
  instanceUrl: string;
  accessToken: string;
};

export type QueryOptions = {
  operation: string;
  path: string;
  params?: {
    query?: Record<string, any>;
    path?: Record<string, any>;
    request?: Record<string, any>;
  };
  specType: string;
};
