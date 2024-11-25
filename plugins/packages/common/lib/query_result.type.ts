import { OptionsOfTextResponseBody } from 'got';

export type QueryResult = {
  status: 'ok' | 'failed' | 'needs_oauth';
  errorMessage?: string;
  data: Array<object> | object | OptionsOfTextResponseBody;
  metadata?: Array<object> | object;
};

export interface RequestBody {
  grant_type: string;
  client_id: string;
  client_secret: string;
  audience?: string;
  scope?: string;
}
