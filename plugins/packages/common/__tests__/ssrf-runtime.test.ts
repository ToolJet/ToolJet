import * as net from 'net';
import { getSSRFConfig, validateUrlForSSRF, createSSRFSafeLookup, isAllowlisted } from '../lib/ssrf-protection';

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
    expect(getSSRFConfig().enabled).toBe(false);
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
