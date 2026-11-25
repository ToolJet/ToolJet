import {
  collectCredentialValues,
  maskErrorDataForViewer,
  maskMetadataForViewer,
} from '@helpers/query-request-metadata.helper';

const HEADER_KEY = 'synthetic-header-key-1234';
const PARAM_KEY = 'synthetic-param-key-1234';

const successMetadata = () => ({
  request: {
    requestUrl: 'http://api.example.com/v1/items',
    url: `http://api.example.com/v1/items?api_key=${PARAM_KEY}`,
    method: 'GET',
    headers: { 'x-custom-cred': HEADER_KEY, 'user-agent': 'got' },
    params: { api_key: PARAM_KEY },
  },
  response: { statusCode: 200 },
  queryDefinition: `http://api.example.com/v1/items?api_key=${PARAM_KEY}`,
});

describe('maskMetadataForViewer', () => {
  it('hides every header value and URL parameter value, keeping the names', () => {
    const { request } = maskMetadataForViewer(successMetadata());

    expect(request.headers).toEqual({ 'x-custom-cred': '[REDACTED]', 'user-agent': '[REDACTED]' });
    expect(request.params).toEqual({ api_key: '[REDACTED]' });
  });

  it('removes the query string from the URL and the query definition', () => {
    const metadata = maskMetadataForViewer(successMetadata());

    expect(metadata.request.url).toBe('http://api.example.com/v1/items');
    expect(metadata.queryDefinition).toBe('http://api.example.com/v1/items');
  });

  it('keeps the method, the URL without query, and the response', () => {
    const metadata = maskMetadataForViewer(successMetadata());

    expect(metadata.request).toMatchObject({ method: 'GET', requestUrl: 'http://api.example.com/v1/items' });
    expect(metadata.response).toEqual({ statusCode: 200 });
  });

  it('does not change its input', () => {
    const input = successMetadata();
    maskMetadataForViewer(input);
    expect(input).toEqual(successMetadata());
  });

  it('passes through metadata without a request', () => {
    expect(maskMetadataForViewer({ response: { statusCode: 200 } })).toEqual({ response: { statusCode: 200 } });
    expect(maskMetadataForViewer(undefined)).toBeUndefined();
  });

  it('handles the request shape of a failed call', () => {
    const { request } = maskMetadataForViewer({
      request: {
        requestUrl: 'http://api.example.com/v1/items',
        requestHeaders: { 'x-custom-cred': HEADER_KEY },
        requestParams: { api_key: PARAM_KEY },
      },
    });

    expect(JSON.stringify(request)).not.toContain(HEADER_KEY);
    expect(JSON.stringify(request)).not.toContain(PARAM_KEY);
    expect(request.requestHeaders).toEqual({ 'x-custom-cred': '[REDACTED]' });
  });
});

describe('maskErrorDataForViewer', () => {
  it('hides credentials in the request object of a failed call', () => {
    const data = maskErrorDataForViewer({
      requestObject: {
        requestUrl: 'http://api.example.com/v1/items',
        requestHeaders: { 'x-custom-cred': HEADER_KEY },
        requestParams: { api_key: PARAM_KEY },
      },
      responseObject: { statusCode: 500 },
    });

    expect(JSON.stringify(data)).not.toContain(HEADER_KEY);
    expect(JSON.stringify(data)).not.toContain(PARAM_KEY);
    expect(data.responseObject).toEqual({ statusCode: 500 });
  });

  it('passes through data without a request object', () => {
    expect(maskErrorDataForViewer({ message: 'x' })).toEqual({ message: 'x' });
    expect(maskErrorDataForViewer(undefined)).toBeUndefined();
  });
});

describe('collectCredentialValues', () => {
  it('collects header, URL parameter and cookie values from the data source options', () => {
    const collected: string[] = [];
    collectCredentialValues(
      {
        headers: [['X-Custom-Cred', HEADER_KEY]],
        url_params: [['api_key', PARAM_KEY]],
        custom_query_params: [['token', 'synthetic-custom-1234']],
        cookies: [['session', 'synthetic-cookie-1234']],
      },
      collected
    );

    expect(collected).toEqual(
      expect.arrayContaining([HEADER_KEY, PARAM_KEY, 'synthetic-custom-1234', 'synthetic-cookie-1234'])
    );
  });

  it('collects the credential fields of the auth settings', () => {
    const collected: string[] = [];
    collectCredentialValues({ bearer_token: 'synthetic-bearer-1234', password: 'synthetic-password-1234' }, collected);

    expect(collected).toEqual(expect.arrayContaining(['synthetic-bearer-1234', 'synthetic-password-1234']));
  });

  it('skips empty and very short values, which would blank unrelated text', () => {
    const collected: string[] = [];
    collectCredentialValues(
      {
        headers: [
          ['', ''],
          ['Accept', 'a'],
        ],
        url_params: [['page', '1']],
      },
      collected
    );

    expect(collected).toEqual([]);
  });

  it('ignores options that are not lists of pairs', () => {
    const collected: string[] = [];
    expect(() => collectCredentialValues({ headers: 'nope', url_params: null }, collected)).not.toThrow();
    expect(collected).toEqual([]);
  });
});
