import * as http from 'http';
import { AddressInfo } from 'net';
import { BadRequestException } from '@nestjs/common';
import { DataSourcesUtilService } from '../../../../src/modules/data-sources/util.service';
import { createSSRFSafeLookup, SSRF_RUNTIME_CONFIG_KEY } from '../../../../src/helpers/ssrf-protection.helper';
import { buildSSRFRuntimeConfig } from '../../../../src/helpers/ssrf-allowlist.helper';

const service = () =>
  new DataSourcesUtilService(
    null as unknown as never,
    null as unknown as never,
    null as unknown as never,
    null as unknown as never,
    null as unknown as never,
    null as unknown as never,
    null as unknown as never,
    null as unknown as never,
    null as unknown as never
  );

const publish = (enabled: boolean, allowlist: string[]) => {
  (globalThis as any)[SSRF_RUNTIME_CONFIG_KEY] = buildSSRFRuntimeConfig(enabled, allowlist);
};

type LookupResult = { err: NodeJS.ErrnoException | null; address?: unknown; family?: number };

const runLookup = (hostname: string, options: object): Promise<LookupResult> =>
  new Promise((resolve) => {
    const lookup = createSSRFSafeLookup();
    lookup(hostname, options, (err, address, family) => resolve({ err, address, family }));
  });

const originalEdition = process.env.TOOLJET_EDITION;

afterEach(() => {
  delete (globalThis as any)[SSRF_RUNTIME_CONFIG_KEY];
  if (originalEdition === undefined) delete process.env.TOOLJET_EDITION;
  else process.env.TOOLJET_EDITION = originalEdition;
});

describe('DataSourcesUtilService.fetchOAuthToken', () => {
  let server: http.Server;
  let baseUrl: string;
  const hits: string[] = [];

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      hits.push(req.url);
      if (req.url === '/redirect') {
        res.writeHead(307, { Location: '/stolen' });
        return res.end();
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  beforeEach(() => {
    hits.length = 0;
    process.env.TOOLJET_EDITION = 'ee';
    publish(true, ['127.0.0.1']);
  });

  const fetchToken = (path: string) =>
    service().fetchOAuthToken(
      { access_token_url: `${baseUrl}${path}`, client_id: 'id', client_secret: 'secret', grant_type: 'code' },
      'code',
      'user',
      false,
      { kind: 'restapi' } as never
    );

  it('returns the token when the token endpoint answers 200', async () => {
    await expect(fetchToken('/token')).resolves.toMatchObject({ access_token: 'access', refresh_token: 'refresh' });
  });

  it('does not follow a 307 from the token endpoint, so the client secret is not re-sent', async () => {
    const result = fetchToken('/redirect');

    await expect(result).rejects.toThrow(BadRequestException);
    await expect(result).rejects.toThrow(/redirect/i);
    expect(hits).toEqual(['/redirect']);
  });
});

describe('createSSRFSafeLookup', () => {
  beforeEach(() => {
    process.env.TOOLJET_EDITION = 'ee';
  });

  it('is undefined when protection is off', () => {
    publish(false, []);
    expect(createSSRFSafeLookup()).toBeUndefined();
  });

  it('rejects a hostname that resolves to 127.0.0.1 when protection is on', async () => {
    publish(true, []);
    const { err } = await runLookup('localhost', { family: 4 });

    expect(err).toMatchObject({
      code: 'SSRF_BLOCKED',
      address: '127.0.0.1',
      message: expect.stringContaining(
        'Requests to localhost are blocked because it resolves to a private network address (127.0.0.1).'
      ),
    });
  });

  it('allows the resolved address when it is allowlisted', async () => {
    publish(true, ['127.0.0.1']);

    await expect(runLookup('localhost', { family: 4 })).resolves.toMatchObject({
      err: null,
      address: '127.0.0.1',
      family: 4,
    });
  });

  it('returns the array shape for all:true lookups', async () => {
    publish(true, ['127.0.0.1']);

    await expect(runLookup('localhost', { all: true, family: 4 })).resolves.toMatchObject({
      err: null,
      address: [{ address: '127.0.0.1', family: 4 }],
    });
  });

  it('rejects an all:true lookup when any resolved address is blocked', async () => {
    publish(true, []);
    const { err } = await runLookup('localhost', { all: true, family: 4 });

    expect(err).toMatchObject({ code: 'SSRF_BLOCKED' });
  });
});
