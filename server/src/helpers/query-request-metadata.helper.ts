import { redactSecretValues } from '@helpers/utils.helper';

const MASK = '[REDACTED]';
// A shorter value would blank unrelated text (a page number, a one letter header) when scrubbed from a response.
const MIN_CREDENTIAL_LENGTH = 4;
// Data source options that hold [name, value] pairs sent with every request.
const PAIR_LIST_OPTIONS = ['headers', 'url_params', 'custom_query_params', 'cookies'];
const REQUEST_FIELDS = ['request', 'queryDefinition', 'requestObject'];
const CREDENTIAL_OPTIONS = ['bearer_token', 'password', 'client_secret', 'api_key', 'access_token', 'refresh_token'];

type Json = Record<string, any>;

const isObject = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);
const maskValues = (value: unknown) =>
  isObject(value) ? Object.fromEntries(Object.keys(value).map((name) => [name, MASK])) : value;
// Only a URL has a query string to drop; other query definitions (a gRPC message) are kept as they are.
const withoutQuery = (value: unknown) =>
  typeof value === 'string' && /^https?:\/\//i.test(value) ? value.split(/[?#]/)[0] : value;

function maskRequest(request: unknown) {
  if (!isObject(request)) return request;
  const masked: Json = { ...request };
  for (const field of ['headers', 'requestHeaders', 'params', 'requestParams']) {
    if (field in masked) masked[field] = maskValues(masked[field]);
  }
  if ('url' in masked) masked.url = withoutQuery(masked.url);
  return masked;
}

/** Request details for an end user: header and parameter names stay, their values do not, and the URL loses its query. */
export function maskMetadataForViewer<T>(metadata: T): T {
  if (!isObject(metadata)) return metadata;
  const masked: Json = { ...metadata };
  if ('request' in masked) masked.request = maskRequest(masked.request);
  if ('queryDefinition' in masked) masked.queryDefinition = withoutQuery(masked.queryDefinition);
  return masked as T;
}

/** Same for the request object a failed call carries in its data. */
export function maskErrorDataForViewer<T>(data: T): T {
  const source: unknown = data;
  if (!isObject(source) || !('requestObject' in source)) return data;
  return { ...source, requestObject: maskRequest(source.requestObject) } as T;
}

/**
 * Scrubs data source credential values from the request parts only (`request`, `queryDefinition`, `requestObject`).
 * The response body and response headers keep their text: a header value such as `application/json` is not a secret there.
 */
export function redactRequestCredentials<T>(value: T, credentials: string[]): T {
  if (!isObject(value) || credentials.length === 0) return value;
  const redacted: Json = { ...value };
  for (const field of REQUEST_FIELDS) {
    if (field in redacted) redacted[field] = redactSecretValues(redacted[field], credentials);
  }
  return redacted as T;
}

/** Adds the credential values of a data source (headers, URL parameters, cookies, auth fields) to `into`, to be scrubbed from responses. */
export function collectCredentialValues(sourceOptions: unknown, into: string[]): void {
  if (!isObject(sourceOptions)) return;
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.length >= MIN_CREDENTIAL_LENGTH) into.push(value);
  };
  for (const option of PAIR_LIST_OPTIONS) {
    const pairs = sourceOptions[option];
    if (Array.isArray(pairs)) pairs.forEach((pair) => Array.isArray(pair) && add(pair[1]));
  }
  CREDENTIAL_OPTIONS.forEach((option) => add(sourceOptions[option]));
}
