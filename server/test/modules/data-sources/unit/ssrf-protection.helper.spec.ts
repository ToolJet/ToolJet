import * as net from 'net';
import * as dnsPromises from 'dns/promises';
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
  describe('hosts-file fallback when resolve4/resolve6 find nothing', () => {
    let spies: jest.SpyInstance[] = [];
    const mockDns = (lookupAnswer: { address: string; family: number }[]) => {
      const notFound = Object.assign(new Error('queryA ENOTFOUND tooljet.localhost'), { code: 'ENOTFOUND' });
      spies = [
        jest.spyOn(dnsPromises, 'resolve4').mockRejectedValue(notFound),
        jest.spyOn(dnsPromises, 'resolve6').mockRejectedValue(notFound),
        jest.spyOn(dnsPromises, 'lookup').mockResolvedValue(lookupAnswer as never),
      ];
    };
    afterEach(() => spies.forEach((spy) => spy.mockRestore()));

    it('allows a hosts-file name whose address is inside an allowlisted CIDR', async () => {
      mockDns([{ address: '192.168.49.2', family: 4 }]);
      publishRanges('192.168.49.0/24');
      await expect(validateUrlForSSRF('http://tooljet.localhost/')).resolves.toBeUndefined();
    });
    it('blocks it as resolving to a private IP when the allowlist is empty', async () => {
      mockDns([{ address: '192.168.49.2', family: 4 }]);
      publishRanges();
      const privateIP = /resolves to a private network address \(192\.168\.49\.2\)/;
      await expect(validateUrlForSSRF('http://tooljet.localhost/')).rejects.toThrow(privateIP);
    });
    it('blocks it when the hosts-file lookup finds nothing either', async () => {
      mockDns([]);
      publishRanges('192.168.49.0/24');
      await expect(validateUrlForSSRF('http://tooljet.localhost/')).rejects.toThrow();
    });
  });
  describe('block messages name the host, the reason and where to allow it', () => {
    const hint = 'A super admin can allow it in Settings → Security → Outbound requests.';
    let spies: jest.SpyInstance[] = [];
    afterEach(() => spies.forEach((spy) => spy.mockRestore()));

    it('says an IP literal is a private network address', async () => {
      publishRanges();
      await expect(validateUrlForSSRF('http://10.0.0.5/')).rejects.toThrow(
        `Requests to 10.0.0.5 are blocked because it is a private network address. ${hint}`
      );
    });
    it('says which private address a hostname resolves to', async () => {
      spies = [
        jest.spyOn(dnsPromises, 'resolve4').mockResolvedValue(['192.168.49.2']),
        jest.spyOn(dnsPromises, 'resolve6').mockRejectedValue(new Error('queryAaaa ENODATA db.corp')),
      ];
      publishRanges();
      await expect(validateUrlForSSRF('http://db.corp/')).rejects.toThrow(
        `Requests to db.corp are blocked because it resolves to a private network address (192.168.49.2). ${hint}`
      );
    });
    it('keeps the resolver error for a host that does not resolve', async () => {
      spies = [
        jest.spyOn(dnsPromises, 'resolve4').mockRejectedValue(new Error('queryA ENOTFOUND invalid-host')),
        jest.spyOn(dnsPromises, 'resolve6').mockRejectedValue(new Error('queryAaaa ENOTFOUND invalid-host')),
        jest.spyOn(dnsPromises, 'lookup').mockRejectedValue(new Error('getaddrinfo ENOTFOUND invalid-host')),
      ];
      publishRanges();
      await expect(validateUrlForSSRF('http://invalid-host/')).rejects.toThrow(
        `Requests to invalid-host are blocked because it could not be resolved (getaddrinfo ENOTFOUND invalid-host). ${hint}`
      );
    });
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

  it('Cloud names the blocked address without pointing at a settings page it does not have', async () => {
    process.env.TOOLJET_EDITION = 'cloud';
    const rejection = expect(validateUrlForSSRF('http://10.0.0.1/')).rejects;
    await rejection.toThrow('Requests to 10.0.0.1 are blocked because it is a private network address.');
    await expect(validateUrlForSSRF('http://10.0.0.1/')).rejects.not.toThrow(/Settings/);
  });

  it('Cloud blocks an IPv4-mapped RFC1918 literal', async () => {
    process.env.TOOLJET_EDITION = 'cloud';
    await expect(validateUrlForSSRF('http://[::ffff:10.0.0.1]/')).rejects.toThrow(BadRequestException);
  });

  it('Cloud allows a public IPv6 literal without a DNS lookup', async () => {
    process.env.TOOLJET_EDITION = 'cloud';
    const resolve4 = jest.spyOn(dnsPromises, 'resolve4');
    const resolve6 = jest.spyOn(dnsPromises, 'resolve6');
    try {
      await expect(validateUrlForSSRF('http://[2606:4700:4700::1111]/')).resolves.toBeUndefined();
      expect(resolve4).not.toHaveBeenCalled();
      expect(resolve6).not.toHaveBeenCalled();
    } finally {
      resolve4.mockRestore();
      resolve6.mockRestore();
    }
  });

  it.each([
    ['fe80::1%eth0', 'blocks'],
    ['64:ff9b:1:7f00:0:100:808:808', 'blocks'],
    ['2606:4700:4700::1111', 'allows'],
  ])('CE classifies a resolved address %s and %s the hostname', async (address, verdict) => {
    process.env.TOOLJET_EDITION = 'ce';
    const resolve4 = jest.spyOn(dnsPromises, 'resolve4').mockRejectedValue(new Error('ENODATA'));
    const resolve6 = jest.spyOn(dnsPromises, 'resolve6').mockResolvedValue([address]);
    try {
      const check = expect(validateUrlForSSRF('http://answer.example/'));
      if (verdict === 'blocks') await check.rejects.toThrow(BadRequestException);
      else await check.resolves.toBeUndefined();
    } finally {
      resolve4.mockRestore();
      resolve6.mockRestore();
    }
  });

  it('CE keeps sending a bracketed public literal to the DNS step (verdict unchanged)', async () => {
    process.env.TOOLJET_EDITION = 'ce';
    await expect(validateUrlForSSRF('http://[2606:4700:4700::1111]/')).rejects.toThrow(BadRequestException);
  });

  it('CE still allows 10.0.0.1 with no env vars', async () => {
    process.env.TOOLJET_EDITION = 'ce';
    await expect(validateUrlForSSRF('http://10.0.0.1/')).resolves.toBeUndefined();
  });
});
