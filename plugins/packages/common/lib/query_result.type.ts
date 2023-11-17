import { OptionsOfTextResponseBody } from 'got';

export type QueryResult = {
  status: 'ok' | 'failed' | 'needs_oauth';
  errorMessage?: string;
  data: Array<object> | object | OptionsOfTextResponseBody;
};
