import * as net from 'net';
import got from 'got';
import {
  getSSRFConfig,
  validateUrlForSSRF,
  validateUrlForSSRFSync,
  createSSRFSafeLookup,
  isAllowlisted,
  getSSRFProtectionOptions,
} from '../lib/ssrf-protection';

const KEY = '__TOOLJET_SSRF_RUNTIME_CONFIG__';
const ranges = (...cidrs: string[]) => {
  const b = new net.BlockList();
  cidrs.forEach((c) => {
    const [a, p] = c.split('/');
    b.addSubnet(a, +p, net.isIP(a) === 6 ? 'ipv6' : 'ipv4');
  });
  return b;
};
afterEach(() => {
  delete (globalThis as any)[KEY];
  delete process.env.SSRF_PROTECTION_ENABLED;
  delete process.env.TOOLJET_EDITION;
});

describe('getSSRFConfig with runtime config', () => {
  it('ignores env vars and fixes DNS check + blocked schemes when the runtime key is present', () => {
    process.env.SSRF_PROTECTION_ENABLED = 'false';
    (globalThis as any)[KEY] = { enabled: true, allowedHostnames: new Set(), allowedRanges: ranges() };
    expect(getSSRFConfig()).toMatchObject({
      enabled: true,
      dnsResolutionCheck: true,
      blockedSchemes: ['file', 'gopher', 'dict', 'ftp', 'jar', 'data', 'javascript'],
    });
  });
  it('falls back to env behaviour when the runtime key is absent', () => {
    expect(getSSRFConfig().enabled).toBe(true); // CE/unset default is ON in this copy
  });
});

describe('edition-aware defaults are bypassed when the runtime key is present', () => {
  it('blocks RFC1918 when the runtime key is present even on EE', async () => {
    process.env.TOOLJET_EDITION = 'ee';
    (globalThis as any)[KEY] = { enabled: true, allowedHostnames: new Set(), allowedRanges: ranges() };
    expect(getSSRFConfig().allowPrivateNetworks).toBe(false);
    await expect(validateUrlForSSRF('http://10.1.2.3/')).rejects.toThrow();
  });
  it('keeps today\'s EE behaviour when the key is absent', async () => {
    process.env.TOOLJET_EDITION = 'ee';
    process.env.SSRF_PROTECTION_ENABLED = 'true';
    await expect(validateUrlForSSRF('http://10.1.2.3/')).resolves.toBeUndefined();
  });
});

describe('isAllowlisted', () => {
  it('matches hostnames case-insensitively and IPs inside allowed ranges', () => {
    const config = { allowedHostnames: new Set(['jira.corp']), allowedRanges: ranges('10.0.4.0/24') };
    expect(isAllowlisted('JIRA.corp', config)).toBe(true);
    expect(isAllowlisted('10.0.4.9', config)).toBe(true);
    expect(isAllowlisted('10.0.5.9', config)).toBe(false);
  });
});

describe('validateUrlForSSRF with runtime config', () => {
  beforeEach(() => {
    (globalThis as any)[KEY] = {
      enabled: true,
      allowedHostnames: new Set(['jira.corp']),
      allowedRanges: ranges('10.0.4.0/24'),
    };
  });
  it('blocks an RFC1918 literal that is not allowlisted', async () => {
    await expect(validateUrlForSSRF('http://192.168.1.5/')).rejects.toThrow();
  });
  it('allows an IP inside an allowlisted CIDR', async () => {
    await expect(validateUrlForSSRF('http://10.0.4.12:11434/')).resolves.toBeUndefined();
  });
  it('allows an allowlisted hostname without DNS', async () => {
    await expect(validateUrlForSSRF('http://jira.corp/')).resolves.toBeUndefined();
  });
  it('blocks localhost unless allowlisted', async () => {
    await expect(validateUrlForSSRF('http://localhost/')).rejects.toThrow();
  });
  it('blocks the metadata IP', async () => {
    await expect(validateUrlForSSRF('http://169.254.169.254/')).rejects.toThrow();
  });
  it('blocks a dangerous scheme even when the host is allowlisted', async () => {
    await expect(validateUrlForSSRF('gopher://jira.corp:70/_x')).rejects.toThrow(/scheme/i);
    await expect(validateUrlForSSRF('ftp://10.0.4.12/')).rejects.toThrow(/scheme/i);
  });
  it('blocks a dangerous scheme on an allowlisted host in the sync check too', () => {
    expect(() => validateUrlForSSRFSync('gopher://jira.corp:70/_x')).toThrow(/scheme/i);
  });
  it('allows anything when disabled', async () => {
    (globalThis as any)[KEY].enabled = false;
    await expect(validateUrlForSSRF('http://127.0.0.1/')).resolves.toBeUndefined();
  });
});

describe('createSSRFSafeLookup with runtime config', () => {
  it('allowlisted hostname resolving to private IP passes lookup', (done) => {
    (globalThis as any)[KEY] = { enabled: true, allowedHostnames: new Set(['localhost']), allowedRanges: ranges() };
    createSSRFSafeLookup()('localhost', {}, (err, address) => {
      expect(err).toBeNull();
      expect(address).toBeDefined();
      done();
    });
  });
  it('resolved IP inside an allowlisted CIDR passes lookup', (done) => {
    (globalThis as any)[KEY] = {
      enabled: true,
      allowedHostnames: new Set(),
      allowedRanges: ranges('127.0.0.0/8', '::1/128'),
    };
    createSSRFSafeLookup()('localhost', {}, (err) => {
      expect(err).toBeNull();
      done();
    });
  });
  it('resolved private IP not allowlisted is blocked with SSRF_BLOCKED', (done) => {
    (globalThis as any)[KEY] = { enabled: true, allowedHostnames: new Set(), allowedRanges: ranges() };
    createSSRFSafeLookup()('localhost', {}, (err) => {
      expect(err?.code).toBe('SSRF_BLOCKED');
      done();
    });
  });
});

describe('lookup with options.all (Node 22 autoSelectFamily)', () => {
  const enable = (...hosts: string[]) => {
    (globalThis as any)[KEY] = { enabled: true, allowedHostnames: new Set(hosts), allowedRanges: ranges() };
  };
  it('lookup with all:true returns the array for a public host', (done) => {
    enable();
    (createSSRFSafeLookup() as any)('example.com', { all: true }, (err: any, addresses: any) => {
      expect(err).toBeNull();
      expect(Array.isArray(addresses)).toBe(true);
      expect(addresses[0]).toHaveProperty('address');
      done();
    });
  });
  it('lookup with all:true blocks when a resolved address is private', (done) => {
    enable();
    (createSSRFSafeLookup() as any)('localhost', { all: true }, (err: any) => {
      expect(err?.code).toBe('SSRF_BLOCKED');
      done();
    });
  });
  it('lookup with all:true passes an allowlisted hostname', (done) => {
    enable('localhost');
    (createSSRFSafeLookup() as any)('localhost', { all: true }, (err: any, addresses: any) => {
      expect(err).toBeNull();
      expect(Array.isArray(addresses)).toBe(true);
      done();
    });
  });
  it('real got request succeeds with protection enabled', async () => {
    enable();
    const res = await got('https://example.com', getSSRFProtectionOptions(undefined, { timeout: { request: 10000 }, retry: 0 }));
    expect(res.statusCode).toBe(200);
  }, 20000);
});

describe('cross-copy SSRF parity (runtime key present)', () => {
  // Keep this block identical in all three SSRF suites (built-in, marketplace, server).
  const publishRanges = (...cidrs: string[]) => {
    (globalThis as any)[KEY] = { enabled: true, allowedHostnames: new Set(), allowedRanges: ranges(...cidrs) };
  };
  it.each([
    'http://[::1]/',
    'http://[fd00::1]/',
    'http://[fd00:ec2::254]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:169.254.169.254]/',
    'http://[fe80::1]/',
  ])('blocks %s with an empty allowlist', async (url) => {
    publishRanges();
    await expect(validateUrlForSSRF(url)).rejects.toThrow();
  });
  it('allows a hostname that resolves into an allowlisted CIDR', async () => {
    publishRanges('127.0.0.0/8', '::1/128');
    await expect(validateUrlForSSRF('http://localhost/')).resolves.toBeUndefined();
  });
  it('allows an IPv6 literal inside an allowlisted CIDR', async () => {
    publishRanges('::1/128');
    await expect(validateUrlForSSRF('http://[::1]/')).resolves.toBeUndefined();
  });
});
