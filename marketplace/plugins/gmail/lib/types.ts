export type SourceOptions = {
  client_id: OptionData;
  client_secret: OptionData;
  oauth_type: OptionData;
};

type OptionData = {
  value: string;
  encrypted: boolean;
};

export type AccessDetailsFromParams = {
  authCode: string;
  sourceOptions: {
    key: string;
    value: string;
    encrypted: boolean;
  }[];
  resetSecureData?: boolean;
};

export type QueryOptions = {
  operation: string;
  path: string;
  params: {
    path: Record<string, string>;
    query: Record<string, string>;
    request: Record<string, any>;
  };
};

export type ConvertedFormat = {
  method: string;
  headers: Record<string, string>;
  searchParams?: URLSearchParams;
  json?: Record<string, any>;
};
