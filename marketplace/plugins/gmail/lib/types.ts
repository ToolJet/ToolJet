export type SourceOptions = {
  client_id?: {
    value?: string;
  };
  client_secret?: {
    value?: string;
  };
};
export type QueryOptions = {
  operation: string;
};

export type ConvertedFormat = {
  method: string;
  headers: Record<string, string>;
  searchParams?: URLSearchParams;
  json?: Record<string, any>;
};
