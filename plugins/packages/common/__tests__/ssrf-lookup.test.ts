import got from 'got';
import { createSSRFSafeLookup, getSSRFProtectionOptions } from '../lib/ssrf-protection';

const ENV_KEYS = ['SSRF_PROTECTION_ENABLED', 'TOOLJET_EDITION'];

jest.setTimeout(30000);

describe('SSRF-safe DNS lookup with options.all (Node 22 / got 11)', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    ENV_KEYS.forEach((k) => (saved[k] = process.env[k]));
    process.env.SSRF_PROTECTION_ENABLED = 'true';
    process.env.TOOLJET_EDITION = 'cloud';
  });

  afterEach(() => {
    ENV_KEYS.forEach((k) => {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });

  const lookup = (hostname: string, opts: any) =>
    new Promise<{ err: any; address?: any; family?: number }>((resolve) => {
      const fn: any = createSSRFSafeLookup();
      fn(hostname, opts, (err: any, address: any, family: number) => resolve({ err, address, family }));
    });

  it('lookup with all:true returns the array for a public host', async () => {
    const { err, address } = await lookup('example.com', { all: true });
    expect(err).toBeNull();
    expect(Array.isArray(address)).toBe(true);
    expect(address.length).toBeGreaterThan(0);
    expect(address[0]).toMatchObject({ address: expect.any(String), family: expect.any(Number) });
  });

  it('lookup with all:true blocks when a resolved address is private', async () => {
    const { err } = await lookup('localhost', { all: true });
    expect(err).toMatchObject({ code: 'SSRF_BLOCKED', hostname: 'localhost' });
  });

  it('real got request succeeds with protection enabled', async () => {
    const response = await got(
      'https://example.com',
      getSSRFProtectionOptions(undefined, { timeout: { request: 10000 }, retry: 0 })
    );
    expect(response.statusCode).toBe(200);
  });
});
