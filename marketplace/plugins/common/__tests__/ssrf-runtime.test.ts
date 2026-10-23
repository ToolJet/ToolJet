import * as net from 'net';
import got from 'got';
import {
  getSSRFConfig,
  validateUrlForSSRF,
  validateUrlForSSRFSync,
  createSSRFSafeLookup,
  isAllowlisted,
  getSSRFProtectionOptions,
  isPrivateIP,
  isDangerousPrivateIP,
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

describe('IPv6 forms that embed an IPv4', () => {
  it.each([
    '::ffff:127.0.0.1',
    '0:0:0:0:0:ffff:7f00:1',
    '64:ff9b::7f00:1',
    '2002:a9fe:a9fe::',
    '::',
    'febf::1',
    'ff02::1',
    '64:ff9b:1:7f00:0:100:808:808',
    '64:ff9b:1::808:808',
    'fe80::1%eth0',
    '::FFFF:7F00:1',
  ])('self-hosted policy (isDangerousPrivateIP) blocks %s', (ip) => {
    expect(isDangerousPrivateIP(ip)).toBe(true);
  });
  it.each(['::ffff:10.0.0.1', '64:ff9b::a00:1', '2002:c0a8:101::', '64:ff9b::808:808'])(
    'self-hosted policy (isDangerousPrivateIP) allows %s like its IPv4',
    (ip) => {
      expect(isDangerousPrivateIP(ip)).toBe(false);
    }
  );
  it.each(['::ffff:10.0.0.1', '64:ff9b::a00:1', '2002:c0a8:101::', 'fec0::1'])(
    'strict policy (isPrivateIP) blocks %s',
    (ip) => {
      expect(isPrivateIP(ip)).toBe(true);
    }
  );
  it.each(['http://[::ffff:127.0.0.1]/', 'http://[fe80::1]/', 'http://[64:ff9b::a9fe:a9fe]/'])(
    'sync check strips brackets and blocks %s on CE defaults',
    (url) => {
      expect(() => validateUrlForSSRFSync(url)).toThrow();
    }
  );
  it('keeps sending a bracketed public literal to the DNS step on CE defaults (verdict unchanged)', async () => {
    await expect(validateUrlForSSRF('http://[2606:4700:4700::1111]/')).rejects.toThrow();
  });
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
    'http://[febf::1]/',
    'http://[fec0::1]/',
    'http://[ff02::1]/',
    'http://[::]/',
    'http://[::ffff:7f00:1]/',
    'http://[0:0:0:0:0:ffff:7f00:1]/',
    'http://[::ffff:10.0.0.1]/',
    'http://[::ffff:0:7f00:1]/',
    'http://[::127.0.0.1]/',
    'http://[64:ff9b::a9fe:a9fe]/',
    'http://[64:ff9b::7f00:1]/',
    'http://[64:ff9b:1::a9fe:a9fe]/',
    'http://[64:ff9b:1:7f00:0:100:808:808]/',
    'http://[64:ff9b:1::808:808]/',
    'http://[FE80::1]/',
    'http://[::FFFF:7F00:1]/',
    'http://[2002:7f00:1::]/',
    'http://[2002:a9fe:a9fe::]/',
    'http://[2001:0:4136:e378:8000:63bf:80ff:fffe]/',
  ])('blocks %s with an empty allowlist', async (url) => {
    publishRanges();
    await expect(validateUrlForSSRF(url)).rejects.toThrow();
  });
  it.each(['http://[2606:4700:4700::1111]/', 'http://[64:ff9b::808:808]/', 'http://[2002:808:808::]/'])(
    'allows the public IPv6 literal %s with an empty allowlist',
    async (url) => {
      publishRanges();
      await expect(validateUrlForSSRF(url)).resolves.toBeUndefined();
    }
  );
  it('allows a hostname that resolves into an allowlisted CIDR', async () => {
    publishRanges('127.0.0.0/8', '::1/128');
    await expect(validateUrlForSSRF('http://localhost/')).resolves.toBeUndefined();
  });
  it('allows an IPv6 literal inside an allowlisted CIDR', async () => {
    publishRanges('::1/128');
    await expect(validateUrlForSSRF('http://[::1]/')).resolves.toBeUndefined();
  });
});

describe('redirect hook resolves the target before validating', () => {
  const http = require('http');
  let server: any;
  afterEach(async () => {
    if (server) await new Promise((r) => server.close(r));
    server = undefined;
  });
  const start = async (handler: (req: any, res: any) => void) => {
    server = http.createServer(handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    return `http://127.0.0.1:${server.address().port}`;
  };
  const allowLoopback = () => {
    (globalThis as any)[KEY] = { enabled: true, allowedHostnames: new Set(), allowedRanges: ranges('127.0.0.0/8') };
  };

  it('follows a relative Location against the request URL', async () => {
    allowLoopback();
    const base = await start((req, res) => {
      if (req.url === '/start') {
        res.writeHead(302, { Location: '/next' });
        res.end();
      } else {
        res.end('next-body');
      }
    });
    const res = await got(`${base}/start`, getSSRFProtectionOptions(undefined, {}));
    expect(res.body).toBe('next-body');
  });

  it('still blocks a redirect to a metadata address', async () => {
    allowLoopback();
    const base = await start((req, res) => {
      res.writeHead(302, { Location: 'http://169.254.169.254/' });
      res.end();
    });
    await expect(got(`${base}/start`, getSSRFProtectionOptions(undefined, {}))).rejects.toMatchObject({
      message: 'Redirect blocked by SSRF protection',
    });
  });
});
