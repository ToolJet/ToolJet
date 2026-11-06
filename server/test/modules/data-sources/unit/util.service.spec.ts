import * as http from 'http';
import { AddressInfo } from 'net';
import got from 'got';
import { BadRequestException } from '@nestjs/common';
import { DataSourcesUtilService } from '../../../../src/modules/data-sources/util.service';
import { DataSource } from '../../../../src/entities/data_source.entity';

jest.mock('got', () => {
  const actual = jest.requireActual('got');
  const spy = jest.fn((...args: unknown[]) => actual(...args));
  return Object.assign(spy, { __esModule: true, default: spy });
});
const gotSpy = got as unknown as jest.Mock;

function serviceWith(pluginService: object): DataSourcesUtilService {
  return new DataSourcesUtilService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { getService: jest.fn().mockResolvedValue(pluginService) } as any,
    {} as any,
    {} as any
  );
}

describe('DataSourcesUtilService.testConnection', () => {
  const input = { kind: 'plugin', options: {}, environment_id: 'environment' } as any;

  it('marks a missing plugin connection test as structurally unsupported', async () => {
    await expect(serviceWith({}).testConnection(input, 'organization')).resolves.toMatchObject({
      status: 'failed',
      category: 'unsupported',
      supported: false,
    });
  });

  it('does not mark an actual plugin failure as unsupported', async () => {
    const testConnection = jest.fn().mockRejectedValue(new Error('connection refused'));
    const result = await serviceWith({ testConnection }).testConnection(input, 'organization');

    expect(result).toMatchObject({ status: 'failed', message: expect.stringContaining('connection refused') });
    expect(result).not.toHaveProperty('category');
  });
});

describe('DataSourcesUtilService.testConnection | option & credential binding', () => {
  function makeService({
    getOptions,
    getValue,
    pluginTestConnection,
    getService,
  }: {
    getOptions?: jest.Mock;
    getValue?: jest.Mock;
    pluginTestConnection?: jest.Mock;
    getService?: jest.Mock;
  }) {
    const pluginTest = pluginTestConnection ?? jest.fn().mockResolvedValue({ status: 'ok' });
    const getServiceFn = getService ?? jest.fn().mockResolvedValue({ testConnection: pluginTest });
    const service = new DataSourcesUtilService(
      { getOptions: getOptions ?? jest.fn().mockResolvedValue({ options: {} }) } as any,
      { getValue: getValue ?? jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      { getService: getServiceFn } as any,
      {} as any,
      {} as any,
      {} as any
    );
    return { service, pluginTest, getServiceFn };
  }

  const persistedDataSource = { kind: 'couchdb', pluginId: 'couchdb-plugin-id' } as any;

  it('ignores body host/port and tests the SAVED options for a use-only (non-editor) caller', async () => {
    const storedOptions = {
      host: { value: 'saved-host.internal' },
      port: { value: '5984' },
      username: { value: 'admin' },
      password: { credential_id: 'cred-stored', encrypted: true },
    };
    const { service, pluginTest } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: storedOptions }),
      getValue: jest.fn().mockResolvedValue('STORED_SECRET'),
    });

    const body = {
      kind: 'couchdb',
      plugin_id: 'couchdb-plugin-id',
      environment_id: 'env',
      options: {
        host: { value: 'attacker.evil.com' },
        port: { value: '9099' },
        username: { value: 'admin' },
        password: { credential_id: 'cred-stored', encrypted: true },
      },
    } as any;

    await service.testConnection(body, 'org', 'ds-1', undefined, {
      dataSource: persistedDataSource,
      canEditDataSource: false,
    });

    const sentOptions = pluginTest.mock.calls[0][0];
    expect(sentOptions.host).toBe('saved-host.internal');
    expect(sentOptions.port).toBe('5984');
    expect(sentOptions.password).toBe('STORED_SECRET');
  });

  it('does not resolve body-injected {{secrets.*}} for a use-only (non-editor) caller', async () => {
    const storedOptions = {
      host: { value: 'saved-host.internal' },
      username: { value: 'admin' },
      password: { value: 'placeholder' },
    };
    const getValue = jest.fn();
    const { service, pluginTest } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: storedOptions }),
      getValue,
    });

    const body = {
      kind: 'couchdb',
      plugin_id: 'couchdb-plugin-id',
      environment_id: 'env',
      options: {
        host: { value: 'attacker.evil.com' },
        username: { value: '{{secrets.DB_PASS}}' },
        password: { value: 'x' },
      },
    } as any;

    await service.testConnection(body, 'org', 'ds-1', undefined, {
      dataSource: persistedDataSource,
      canEditDataSource: false,
    });

    const sentOptions = pluginTest.mock.calls[0][0];
    expect(sentOptions.username).toBe('admin');
    expect(sentOptions.username).not.toContain('{{secrets');
    expect(sentOptions.host).toBe('saved-host.internal');
  });

  it('takes kind/plugin_id from the persisted data source, never the request body', async () => {
    const getServiceFn = jest.fn().mockResolvedValue({ testConnection: jest.fn().mockResolvedValue({ status: 'ok' }) });
    const { service } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: { host: { value: 'saved-host.internal' } } }),
      getService: getServiceFn,
    });

    const body = {
      kind: 'restapi',
      plugin_id: 'evil-plugin',
      environment_id: 'env',
      options: {},
    } as any;

    await service.testConnection(body, 'org', 'ds-1', undefined, {
      dataSource: persistedDataSource,
      canEditDataSource: false,
    });

    expect(getServiceFn).toHaveBeenCalledWith('couchdb-plugin-id', 'couchdb');
  });

  it('lets an editor test unsaved body options (test-before-save) when the credential_id matches', async () => {
    const storedOptions = {
      host: { value: 'saved-host.internal' },
      username: { value: 'admin' },
      password: { credential_id: 'cred-stored', encrypted: true },
    };
    const { service, pluginTest } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: storedOptions }),
      getValue: jest.fn().mockResolvedValue('STORED_SECRET'),
    });

    const body = {
      kind: 'couchdb',
      plugin_id: 'couchdb-plugin-id',
      environment_id: 'env',
      options: {
        host: { value: 'new-host.internal' },
        username: { value: 'admin' },
        password: { credential_id: 'cred-stored', encrypted: true },
      },
    } as any;

    await service.testConnection(body, 'org', 'ds-1', undefined, {
      dataSource: persistedDataSource,
      canEditDataSource: true,
    });

    expect(pluginTest.mock.calls[0][0].host).toBe('new-host.internal');
  });

  it('rejects an editor whose body credential_id does not belong to the data source', async () => {
    const storedOptions = {
      password: { credential_id: 'cred-stored', encrypted: true },
    };
    const { service } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: storedOptions }),
      getValue: jest.fn().mockResolvedValue('STORED_SECRET'),
    });

    const body = {
      kind: 'couchdb',
      plugin_id: 'couchdb-plugin-id',
      environment_id: 'env',
      options: {
        password: { credential_id: 'cred-foreign', encrypted: true },
      },
    } as any;

    await expect(
      service.testConnection(body, 'org', 'ds-1', undefined, {
        dataSource: persistedDataSource,
        canEditDataSource: true,
      })
    ).rejects.toThrow('credential_id does not belong to this data source');
  });
});

describe('DataSourcesUtilService.fetchOAuthToken', () => {
  type Hit = { url: string; body: string };
  let server: http.Server;
  let hits: Hit[];
  let reply: { status: number; body: string };
  let tokenUrl: string;
  const savedEnv = { ...process.env };

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        hits.push({ url: req.url, body });
        if (req.url === '/moved') {
          res.writeHead(307, { Location: tokenUrl });
          return res.end();
        }
        res.writeHead(reply.status, { 'Content-Type': 'application/json' });
        res.end(reply.body);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    tokenUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/token`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  beforeEach(() => {
    hits = [];
    reply = { status: 200, body: JSON.stringify({ access_token: 'access-1', refresh_token: 'refresh-1' }) };
    gotSpy.mockClear();
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  const service = () => serviceWith({});
  const dataSource = (kind: string) => ({ kind }) as unknown as DataSource;
  const fetchToken = (kind: string, options: Record<string, unknown>) =>
    service().fetchOAuthToken(
      { grant_type: 'authorization_code', ...options },
      'code-1',
      'user-1',
      false,
      dataSource(kind)
    );

  describe('with a custom OAuth app', () => {
    it('should post the stored client credentials to the stored token URL and return the tokens', async () => {
      const result = await fetchToken('restapi', {
        oauth_type: 'custom_app',
        access_token_url: tokenUrl,
        client_id: 'client-a',
        client_secret: 'secret-a',
      });

      expect(result).toMatchObject({ access_token: 'access-1', refresh_token: 'refresh-1' });
      expect(hits).toHaveLength(1);
      expect(new URLSearchParams(hits[0].body).get('client_id')).toBe('client-a');
    });
  });

  describe('with a ToolJet managed app', () => {
    it('should use the server Google credentials whatever the options hold', async () => {
      process.env.TJ_TEST_MARKER = 'marker-value';
      process.env.GOOGLE_CLIENT_ID = 'google-client';
      process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
      gotSpy.mockResolvedValueOnce({ body: JSON.stringify({ access_token: 'access-1' }) });

      await fetchToken('gmail', {
        oauth_type: 'tooljet_app',
        access_token_url: tokenUrl,
        GOOGLE_CLIENT_ID: 'TJ_TEST_MARKER',
        GOOGLE_CLIENT_SECRET: 'TJ_TEST_MARKER',
      });

      const sent = JSON.stringify(gotSpy.mock.calls[0][1]);
      expect(sent).not.toContain('marker-value');
      expect(gotSpy.mock.calls[0][1].form).toMatchObject({
        client_id: 'google-client',
        client_secret: 'google-secret',
      });
    });

    it.each(['gmail', 'googlesheetsv2'])(
      'should post %s only to the Google token URL, never the stored one',
      async (kind) => {
        process.env.GOOGLE_CLIENT_ID = 'google-client';
        process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
        gotSpy.mockResolvedValueOnce({ body: JSON.stringify({ access_token: 'access-1' }) });

        await fetchToken(kind, { oauth_type: 'tooljet_app', access_token_url: tokenUrl });

        expect(gotSpy).toHaveBeenCalledTimes(1);
        expect(gotSpy.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token');
        expect(hits).toHaveLength(0);
      }
    );

    it('should refuse a kind with no managed app and send nothing', async () => {
      await expect(
        fetchToken('restapi', {
          oauth_type: 'tooljet_app',
          access_token_url: tokenUrl,
        })
      ).rejects.toThrow(BadRequestException);
      expect(gotSpy).not.toHaveBeenCalled();
      expect(hits).toHaveLength(0);
    });
  });

  describe('with the outbound address check on', () => {
    const customApp = () => ({ oauth_type: 'custom_app', access_token_url: tokenUrl, client_id: 'client-a' });

    beforeEach(() => {
      process.env.SSRF_PROTECTION_ENABLED = 'true';
    });

    it('should refuse a loopback token URL in enforce mode and send nothing', async () => {
      process.env.OAUTH_TOKEN_URL_CHECK_MODE = 'enforce';

      await expect(fetchToken('restapi', customApp())).rejects.toThrow(BadRequestException);
      expect(hits).toHaveLength(0);
    });

    it('should not follow a redirect to a loopback address in enforce mode', async () => {
      process.env.OAUTH_TOKEN_URL_CHECK_MODE = 'enforce';
      const movedUrl = tokenUrl.replace('127.0.0.1', 'localhost').replace('/token', '/moved');

      await expect(fetchToken('restapi', { ...customApp(), access_token_url: movedUrl })).rejects.toThrow(
        BadRequestException
      );
      expect(hits.map((hit) => hit.url)).toEqual(['/moved']);
    });

    it('should refuse a loopback token URL on Cloud even with the env check and mode off', async () => {
      process.env.TOOLJET_EDITION = 'cloud';
      process.env.SSRF_PROTECTION_ENABLED = 'false';
      process.env.OAUTH_TOKEN_URL_CHECK_MODE = 'report';

      await expect(fetchToken('restapi', customApp())).rejects.toThrow(BadRequestException);
      expect(hits).toHaveLength(0);
    });

    it('should let a loopback token URL through in report mode (the self-hosted default)', async () => {
      delete process.env.OAUTH_TOKEN_URL_CHECK_MODE;

      await expect(fetchToken('restapi', customApp())).resolves.toMatchObject({ access_token: 'access-1' });
      expect(hits).toHaveLength(1);
    });
  });

  describe('when the token endpoint answers with an error', () => {
    it('should keep a standard OAuth error code', async () => {
      reply = {
        status: 400,
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'remote-body-marker' }),
      };

      const error = await fetchToken('restapi', {
        oauth_type: 'custom_app',
        access_token_url: tokenUrl,
        client_id: 'client-a',
      }).catch((e: BadRequestException) => e);

      expect(JSON.parse(error.message)).toEqual({ error: 'invalid_grant', status_code: 400 });
    });

    it('should return a fixed message with the status code, not the remote body', async () => {
      reply = { status: 400, body: JSON.stringify({ error: 'remote-body-marker' }) };

      const error = await fetchToken('restapi', {
        oauth_type: 'custom_app',
        access_token_url: tokenUrl,
        client_id: 'client-a',
      }).catch((e: BadRequestException) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toContain('400');
      expect(error.message).not.toContain('remote-body-marker');
    });
  });
});
