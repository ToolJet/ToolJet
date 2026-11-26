import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueryError } from '@tooljet/plugins';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { VersionRepository } from '@modules/versions/repository';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { PluginsServiceSelector } from '@modules/data-sources/services/plugin-selector.service';
import { DataQueryStatus } from '@modules/data-queries/services/status.service';

const HEADER_KEY = 'synthetic-header-key-1234';
const PARAM_KEY = 'synthetic-param-key-1234';

// What the REST plugin reports about the call it made, after adding the data source credentials.
const requestMetadata = () => ({
  request: {
    requestUrl: 'http://api.example.com/v1/items',
    url: `http://api.example.com/v1/items?api_key=${PARAM_KEY}`,
    method: 'GET',
    headers: { 'x-custom-cred': HEADER_KEY, 'user-agent': 'got' },
    params: { api_key: PARAM_KEY },
  },
});

describe('DataQueriesUtilService.runQuery: request details in the response', () => {
  let service: DataQueriesUtilService;
  let runMock: jest.Mock;
  let parseSourceOptions: jest.Mock;

  const dataQuery = {
    dataSource: { id: 'ds-1', kind: 'restapi', pluginId: 'plugin-1', options: {} },
    appVersion: { isPublic: true, appName: 'App', branchId: null },
  } as any;
  const response = { cookie: jest.fn(), setHeader: jest.fn() } as any;
  const app = { id: 'app-1', type: 'front-end', isPublic: true, organizationId: 'org-1' } as any;

  const run = (mode?: string) => service.runQuery(undefined as any, dataQuery, {}, response, undefined, mode, app);

  beforeEach(async () => {
    parseSourceOptions = jest.fn().mockResolvedValue({
      headers: [['X-Custom-Cred', HEADER_KEY]],
      url_params: [['api_key', PARAM_KEY]],
    });
    runMock = jest.fn().mockResolvedValue({ status: 'ok', data: {}, metadata: requestMetadata() });

    const module = await Test.createTestingModule({
      providers: [
        DataQueriesUtilService,
        { provide: VersionRepository, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('false') } },
        {
          provide: AppEnvironmentUtilService,
          useValue: { getOptions: jest.fn().mockResolvedValue({ environmentId: 'env-1', options: {} }) },
        },
        {
          provide: DataSourcesUtilService,
          useValue: {
            // The data source options after resolution: credentials sit in a header and a URL parameter.
            parseSourceOptions,
            resolveOAuthRedirectHost: jest.fn().mockResolvedValue('http://localhost'),
          },
        },
        { provide: PluginsServiceSelector, useValue: { getService: jest.fn().mockResolvedValue({ run: runMock }) } },
      ],
    }).compile();

    service = module.get(DataQueriesUtilService);
    jest.spyOn(service as any, 'parseQueryOptions').mockResolvedValue({});
  });

  describe('for an end user (view mode)', () => {
    it('shows no header value or URL parameter value, anywhere in the metadata', async () => {
      const result: any = await run('view');

      expect(JSON.stringify(result.metadata)).not.toContain(HEADER_KEY);
      expect(JSON.stringify(result.metadata)).not.toContain(PARAM_KEY);
    });

    it('keeps the shape: method, URL without query, and the header and parameter names', async () => {
      const { metadata }: any = await run('view');

      expect(metadata.request).toMatchObject({
        method: 'GET',
        requestUrl: 'http://api.example.com/v1/items',
        url: 'http://api.example.com/v1/items',
        headers: { 'x-custom-cred': '[REDACTED]' },
        params: { api_key: '[REDACTED]' },
      });
      expect(metadata.queryDefinition).toBe('http://api.example.com/v1/items');
    });

    it('treats a missing mode as view', async () => {
      const result: any = await run(undefined);

      expect(JSON.stringify(result.metadata)).not.toContain(HEADER_KEY);
    });

    it('shows no credential in the details of a failed call', async () => {
      runMock.mockRejectedValue(
        new QueryError(
          'Query could not be completed',
          'Request failed with status code 500',
          {
            requestObject: {
              requestUrl: 'http://api.example.com/v1/items',
              requestHeaders: { 'x-custom-cred': HEADER_KEY },
              requestParams: { api_key: PARAM_KEY },
            },
          },
          {
            request: {
              requestUrl: 'http://api.example.com/v1/items',
              requestHeaders: { 'x-custom-cred': HEADER_KEY },
              requestParams: { api_key: PARAM_KEY },
            },
            response: { statusCode: 500 },
          }
        )
      );

      const error: any = await run('view').catch((e) => e);

      expect(JSON.stringify({ data: error.data, metadata: error.metadata })).not.toContain(HEADER_KEY);
      expect(JSON.stringify({ data: error.data, metadata: error.metadata })).not.toContain(PARAM_KEY);
      expect(error.metadata.response).toEqual({ statusCode: 500 });
    });
  });

  describe('for a builder in the editor (edit mode)', () => {
    it('hides the data source credential values', async () => {
      const result: any = await run('edit');

      expect(JSON.stringify(result.metadata)).not.toContain(HEADER_KEY);
      expect(JSON.stringify(result.metadata)).not.toContain(PARAM_KEY);
    });

    it('still shows the method, the path and the headers that are not credentials', async () => {
      const { metadata }: any = await run('edit');

      expect(metadata.request).toMatchObject({
        method: 'GET',
        requestUrl: 'http://api.example.com/v1/items',
        headers: { 'user-agent': 'got' },
      });
    });
  });

  describe('when a data source header or parameter value is an ordinary word', () => {
    const failedCall = () =>
      new QueryError(
        'Query could not be completed',
        'Request failed with status code 400',
        {
          requestObject: { requestHeaders: { 'content-type': 'application/json' }, requestParams: { format: 'json' } },
          responseObject: { body: '{"error":"bad json payload"}' },
          responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
        },
        { request: { requestHeaders: { 'content-type': 'application/json' } }, response: { statusCode: 400 } }
      );

    beforeEach(() => {
      parseSourceOptions.mockResolvedValue({
        headers: [['Content-Type', 'application/json']],
        url_params: [['format', 'json']],
      });
    });

    it.each(['view', 'edit'])('keeps the response body and response headers of a failed call (%s mode)', async (mode) => {
      runMock.mockRejectedValue(failedCall());

      const error: any = await run(mode).catch((e) => e);

      expect(error.data).toMatchObject({
        responseObject: { body: '{"error":"bad json payload"}' },
        responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
      });
    });

    it('still scrubs the value from the request parts', async () => {
      runMock.mockRejectedValue(failedCall());

      const error: any = await run('edit').catch((e) => e);

      expect(error.data.requestObject).toEqual({
        requestHeaders: { 'content-type': '[REDACTED]' },
        requestParams: { format: '[REDACTED]' },
      });
    });
  });

  describe('the failure kept for the audit log and metrics', () => {
    it('holds no data source credential value', async () => {
      const setFailure = jest.spyOn(DataQueryStatus.prototype, 'setFailure');
      runMock.mockRejectedValue(
        new QueryError('Query could not be completed', 'Request failed', {
          requestObject: { requestHeaders: { 'x-custom-cred': HEADER_KEY }, requestParams: { api_key: PARAM_KEY } },
        })
      );

      await run('view').catch(() => undefined);

      expect(JSON.stringify(setFailure.mock.calls)).not.toContain(HEADER_KEY);
      expect(JSON.stringify(setFailure.mock.calls)).not.toContain(PARAM_KEY);
    });
  });
});
