

export type SourceOptions = {
  'as-api-key'?: string; 
};
export type QueryOptions = {
  operation: string;
  path: string;
  params: {
    path: Record<string, any>;
    query: Record<string, any>;
    request: Record<string, any>;
  };
  specType: string;
};
