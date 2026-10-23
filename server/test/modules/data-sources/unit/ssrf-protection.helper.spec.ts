import * as net from 'net';
import { BadRequestException } from '@nestjs/common';
import {
  validateUrlForSSRF,
  SSRF_RUNTIME_CONFIG_KEY,
  SSRFRuntimeConfig,
} from '../../../../src/helpers/ssrf-protection.helper';

const KEY = SSRF_RUNTIME_CONFIG_KEY;

const ranges = (...cidrs: string[]) => {
  const list = new net.BlockList();
  cidrs.forEach((cidr) => {
    const [address, prefix] = cidr.split('/');
    list.addSubnet(address, +prefix, net.isIP(address) === 6 ? 'ipv6' : 'ipv4');
  });
  return list;
};

const publish = (config: Partial<SSRFRuntimeConfig> = {}) => {
  (globalThis as any)[SSRF_RUNTIME_CONFIG_KEY] = {
    enabled: true,
    allowedHostnames: new Set<string>(),
    allowedRanges: ranges(),
    ...config,
  };
};

describe('validateUrlForSSRF with runtime config', () => {
  const originalEdition = process.env.TOOLJET_EDITION;

  beforeEach(() => {
    process.env.TOOLJET_EDITION = 'ee';
    publish({ allowedHostnames: new Set(['jira.corp']), allowedRanges: ranges('10.0.4.0/24') });
  });

  afterEach(() => {
    delete (globalThis as any)[SSRF_RUNTIME_CONFIG_KEY];
    delete process.env.SSRF_PROTECTION_ENABLED;
    if (originalEdition === undefined) delete process.env.TOOLJET_EDITION;
    else process.env.TOOLJET_EDITION = originalEdition;
  });

  it('blocks an RFC1918 literal that is not allowlisted', async () => {
    await expect(validateUrlForSSRF('http://192.168.1.5/')).rejects.toThrow(BadRequestException);
  });

  it('blocks 10.x when the runtime key is present', async () => {
    await expect(validateUrlForSSRF('http://10.1.2.3/')).rejects.toThrow(BadRequestException);
  });

  it('allows an IP inside an allowlisted CIDR', async () => {
    await expect(validateUrlForSSRF('http://10.0.4.12:11434/')).resolves.toBeUndefined();
  });

  it('allows an allowlisted hostname without DNS', async () => {
    await expect(validateUrlForSSRF('http://jira.corp/')).resolves.toBeUndefined();
  });

  it('blocks localhost unless allowlisted', async () => {
    await expect(validateUrlForSSRF('http://localhost/')).rejects.toThrow(BadRequestException);
    publish({ allowedHostnames: new Set(['localhost']) });
    await expect(validateUrlForSSRF('http://localhost/')).resolves.toBeUndefined();
  });

  it('blocks the metadata IP', async () => {
    await expect(validateUrlForSSRF('http://169.254.169.254/')).rejects.toThrow(BadRequestException);
  });

  it('blocks disallowed schemes', async () => {
    await expect(validateUrlForSSRF('file:///etc/passwd')).rejects.toThrow(BadRequestException);
  });

  it('allows anything when disabled', async () => {
    publish({ enabled: false });
    await expect(validateUrlForSSRF('http://127.0.0.1/')).resolves.toBeUndefined();
  });

  it('ignores SSRF_PROTECTION_ENABLED once the runtime key is present', async () => {
    process.env.SSRF_PROTECTION_ENABLED = 'false';
    await expect(validateUrlForSSRF('http://127.0.0.1/')).rejects.toThrow(BadRequestException);
  });
});

describe('validateUrlForSSRF without runtime config', () => {
  const originalEdition = process.env.TOOLJET_EDITION;

  afterEach(() => {
    if (originalEdition === undefined) delete process.env.TOOLJET_EDITION;
    else process.env.TOOLJET_EDITION = originalEdition;
  });

  it('keeps CE env behaviour when the runtime key is absent', async () => {
    process.env.TOOLJET_EDITION = 'ce';
    await expect(validateUrlForSSRF('http://10.1.2.3/')).resolves.toBeUndefined();
  });
});

afterEach(() => {
  delete (globalThis as any)[KEY];
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

describe('edition defaults without a runtime key', () => {
  const originalEdition = process.env.TOOLJET_EDITION;
  afterEach(() => {
    if (originalEdition === undefined) delete process.env.TOOLJET_EDITION;
    else process.env.TOOLJET_EDITION = originalEdition;
  });

  it.each([
    'http://169.254.169.254/',
    'http://10.0.0.1/',
    'http://172.16.0.1/',
    'http://192.168.1.1/',
    'http://[fd00::1]/',
  ])('Cloud blocks %s', async (url) => {
    process.env.TOOLJET_EDITION = 'cloud';
    await expect(validateUrlForSSRF(url)).rejects.toThrow(BadRequestException);
  });

  it('CE still allows 10.0.0.1 with no env vars', async () => {
    process.env.TOOLJET_EDITION = 'ce';
    await expect(validateUrlForSSRF('http://10.0.0.1/')).resolves.toBeUndefined();
  });
});
