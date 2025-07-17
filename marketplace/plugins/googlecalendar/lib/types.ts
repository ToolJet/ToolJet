import { OptionsOfTextResponseBody } from 'got';

export type SourceOptions = {
  client_id: OptionData;
  client_secret: OptionData;
  scopes: OptionData;
  oauth_type: OptionData;
};
export type QueryOptions = {
  operation: string;
};

type OptionData = {
  value: string;
  encypted: boolean;
};

export type ConvertedFormat = {
  method: string;
  headers: Record<string, string>;
  searchParams?: URLSearchParams;
  json?: Record<string, any>;
};

export type QueryResult = {
  status: 'ok' | 'failed' | 'needs_oauth';
  errorMessage?: string;
  data: Array<object> | object | OptionsOfTextResponseBody;
  metadata?: Array<object> | object;
};
