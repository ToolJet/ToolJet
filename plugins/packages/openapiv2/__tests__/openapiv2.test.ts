import OpenApiV2 from '../lib';

// Mock 'got' completely. We keep our own minimal HTTPError so the plugin's
// `error instanceof HTTPError` check in the catch block still works, without
// depending on got's real HTTPError construction (which needs a full request/
// response object graph we don't want to build here).
jest.mock('got', () => {
  class MockHTTPError extends Error {
    response: any;
    request: any;
    constructor({ response, request }: { response: any; request: any }) {
      super(`Response code ${response.statusCode}`);
      this.name = 'HTTPError';
      this.response = response;
      this.request = request;
    }
  }
  return {
    __esModule: true,
    default: jest.fn(),
    HTTPError: MockHTTPError,
  };
});

// Mock the common package. run() delegates auth-header building and SSRF
// protection to it; we stub those to pass-through so this spec only exercises
// openapiv2's own request-building logic (host/path/params/body), not the
// shared auth/SSRF library (which has its own tests).
jest.mock('@tooljet-plugins/common', () => {
  const actual = jest.requireActual('@tooljet-plugins/common');
  return {
    ...actual,
    validateAndSetRequestOptionsBasedOnAuthType: jest.fn((_sourceOptions, _context, requestOptions) => ({
      status: 'ok',
      data: requestOptions,
    })),
    validateUrlForSSRF: jest.fn().mockResolvedValue(undefined),
    getSSRFProtectionOptions: jest.fn((_options, existingOptions) => existingOptions || {}),
    getAuthUrl: jest.fn(() => 'https://mock-auth-url.example.com'),
    getRefreshedToken: jest.fn().mockResolvedValue({ access_token: 'new-token', refresh_token: 'refresh-token' }),
  };
});

import got, { HTTPError } from 'got';
import {
  validateAndSetRequestOptionsBasedOnAuthType,
  getAuthUrl,
  getRefreshedToken,
  QueryError,
  OAuthUnauthorizedClientError,
} from '@tooljet-plugins/common';

const mockGot = got as unknown as jest.Mock;

function mockGotSuccess(overrides: Partial<any> = {}) {
  mockGot.mockResolvedValueOnce({
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true }),
    statusCode: 200,
    request: {
      requestUrl: 'https://api.example.com/resolved',
      options: { method: 'get', headers: {} },
    },
    ...overrides,
  });
}

describe('openapiv2 - run()', () => {
  let plugin: OpenApiV2;

  beforeEach(() => {
    jest.clearAllMocks();
    plugin = new OpenApiV2();
  });

  const baseQueryOptions = (overrides: Partial<any> = {}) => ({
    host: 'https://fallback.example.com',
    path: '/ping',
    operation: 'get',
    params: { request: {}, query: {}, header: {}, path: {} },
    ...overrides,
  });

  it('should substitute {param}-style path params and prefix sourceOptions.host', async () => {
    mockGotSuccess();

    await plugin.run(
      { host: 'https://api.example.com' } as any,
      baseQueryOptions({ path: '/users/{id}/posts/{postId}', params: { request: {}, query: {}, header: {}, path: { id: '42', postId: '7' } } }),
      'ds-1',
      '2024-01-01T00:00:00Z'
    );

    const calledUrl = mockGot.mock.calls[0][0];
    expect(calledUrl.toString()).toBe('https://api.example.com/users/42/posts/7');
  });

  it('should fall back to queryOptions.host when sourceOptions.host is not set', async () => {
    mockGotSuccess();

    await plugin.run({} as any, baseQueryOptions({ path: '/ping' }), 'ds-1', '2024-01-01T00:00:00Z');

    const calledUrl = mockGot.mock.calls[0][0];
    expect(calledUrl.toString()).toBe('https://fallback.example.com/ping');
  });

  it('should send query params as searchParams and header params as headers', async () => {
    mockGotSuccess();

    await plugin.run(
      { host: 'https://api.example.com' } as any,
      baseQueryOptions({
        params: { request: {}, query: { filter: 'active', page: '2' }, header: { Authorization: 'Bearer t' }, path: {} },
      }),
      'ds-1',
      '2024-01-01T00:00:00Z'
    );

    const requestOptions = mockGot.mock.calls[0][1];
    expect(requestOptions).toMatchObject({
      searchParams: { filter: 'active', page: '2' },
      headers: { Authorization: 'Bearer t' },
    });
  });

  it('should drop request body params whose value is an empty string (sanitizeObject)', async () => {
    mockGotSuccess();

    await plugin.run(
      { host: 'https://api.example.com' } as any,
      baseQueryOptions({
        operation: 'post',
        params: { request: { comment: 'hi', note: '' }, query: {}, header: {}, path: {} },
      }),
      'ds-1',
      '2024-01-01T00:00:00Z'
    );

    const requestOptions = mockGot.mock.calls[0][1];
    expect(requestOptions.json).toEqual({ comment: 'hi' });
    expect(requestOptions.json).not.toHaveProperty('note');
  });

  it('should send the request body as JSON only for non-GET operations, and no body for GET', async () => {
    // GET: body params present but must not be sent.
    mockGotSuccess();
    await plugin.run(
      { host: 'https://api.example.com' } as any,
      baseQueryOptions({
        operation: 'get',
        params: { request: { foo: 'bar' }, query: {}, header: {}, path: {} },
      }),
      'ds-1',
      '2024-01-01T00:00:00Z'
    );
    expect(mockGot.mock.calls[0][1]).not.toHaveProperty('json');

    // POST: body params present and must be sent as json.
    mockGotSuccess();
    await plugin.run(
      { host: 'https://api.example.com' } as any,
      baseQueryOptions({
        operation: 'post',
        params: { request: { foo: 'bar' }, query: {}, header: {}, path: {} },
      }),
      'ds-1',
      '2024-01-01T00:00:00Z'
    );
    expect(mockGot.mock.calls[1][1]).toMatchObject({ json: { foo: 'bar' } });
  });

  it('should return the ok result shape on success', async () => {
    mockGotSuccess({
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hello: 'world' }),
      statusCode: 200,
      request: {
        requestUrl: 'https://api.example.com/ping?a=1',
        options: { method: 'get', headers: { Authorization: 'Bearer t' } },
      },
    });

    const result = await plugin.run(
      { host: 'https://api.example.com' } as any,
      baseQueryOptions(),
      'ds-1',
      '2024-01-01T00:00:00Z'
    );

    expect(result).toMatchObject({
      status: 'ok',
      data: { hello: 'world' },
      request: {
        requestUrl: 'https://api.example.com/ping?a=1',
        method: 'get',
        headers: { Authorization: 'Bearer t' },
      },
      response: {
        body: JSON.stringify({ hello: 'world' }),
        statusCode: 200,
      },
      responseHeaders: { 'content-type': 'application/json' },
    });
  });

  it('should surface a thrown got error as a QueryError', async () => {
    mockGot.mockRejectedValueOnce(new Error('network fail'));

    await expect(
      plugin.run({ host: 'https://api.example.com' } as any, baseQueryOptions(), 'ds-1', '2024-01-01T00:00:00Z')
    ).rejects.toBeInstanceOf(QueryError);
  });

  it('should surface a 401 with auth_type oauth2 as an OAuthUnauthorizedClientError', async () => {
    const httpError = new (HTTPError as any)({
      response: { statusCode: 401, body: '{"error":"unauthorized"}', headers: {} },
      request: { requestUrl: 'https://api.example.com/ping', options: { method: 'get', headers: {} } },
    });
    mockGot.mockRejectedValueOnce(httpError);

    await expect(
      plugin.run(
        { host: 'https://api.example.com', auth_type: 'oauth2' } as any,
        baseQueryOptions(),
        'ds-1',
        '2024-01-01T00:00:00Z'
      )
    ).rejects.toBeInstanceOf(OAuthUnauthorizedClientError);

    // Note: run() only throws OAuthUnauthorizedClientError here - the actual token
    // refresh (getRefreshedToken) is invoked by the caller via plugin.refreshToken(),
    // not from inside run() itself. Follow-up: cover that orchestration where it lives.
  });

  it('should forward authUrl() and refreshToken() to the common package helpers', async () => {
    const sourceOptions = { host: 'https://api.example.com' } as any;
    plugin.authUrl(sourceOptions);
    expect(getAuthUrl).toHaveBeenCalledWith(sourceOptions);

    const error = { message: 'boom' };
    await plugin.refreshToken(sourceOptions, error, 'user-1', false);
    expect(getRefreshedToken).toHaveBeenCalledWith(sourceOptions, error, 'user-1', false);
  });

  it('should not read the spec from sourceOptions - only host/path/operation/params drive the request', async () => {
    mockGotSuccess();

    // No spec/raw_spec/spec_metadata keys at all - run() must still build the
    // request purely from queryOptions (host/path/operation/params).
    const sourceOptions = { host: 'https://api.example.com', bearer_token: '' } as any;

    await plugin.run(sourceOptions, baseQueryOptions({ path: '/health' }), 'ds-1', '2024-01-01T00:00:00Z');

    expect(mockGot).toHaveBeenCalledTimes(1);
    expect(mockGot.mock.calls[0][0].toString()).toBe('https://api.example.com/health');
    expect(validateAndSetRequestOptionsBasedOnAuthType).toHaveBeenCalledWith(
      sourceOptions,
      undefined,
      expect.any(Object),
      expect.any(Object)
    );
  });
});
