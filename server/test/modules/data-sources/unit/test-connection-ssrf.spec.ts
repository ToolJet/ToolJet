import * as net from 'net';
import { DataSourcesUtilService } from '../../../../src/modules/data-sources/util.service';
import { SSRF_RUNTIME_CONFIG_KEY } from '../../../../src/helpers/ssrf-protection.helper';

describe('DataSourcesUtilService.validateTestConnectionOptionsForSSRF', () => {
  const service = Object.create(DataSourcesUtilService.prototype) as any;
  const validate = (kind: string, options: Record<string, any>) =>
    service.validateTestConnectionOptionsForSSRF(kind, options);

  beforeEach(() => {
    (globalThis as any)[SSRF_RUNTIME_CONFIG_KEY] = {
      enabled: true,
      allowedHostnames: new Set<string>(),
      allowedRanges: new net.BlockList(),
    };
  });

  afterEach(() => {
    delete (globalThis as any)[SSRF_RUNTIME_CONFIG_KEY];
  });

  it('skips database kinds', async () => {
    await expect(validate('mysql', { host: '127.0.0.1', protocol: 'hostname' })).resolves.toBeUndefined();
  });

  it('checks HTTP-style kinds', async () => {
    await expect(validate('influxdb', { host: '127.0.0.1', port: 8086, protocol: 'http' })).rejects.toThrow();
  });

  it('ignores non-http protocol values as a scheme', async () => {
    // 'hostname' is not a scheme: the host is validated as https://example.com, so any
    // failure must not be the "scheme not allowed" one (DNS may be unavailable offline).
    await validate('couchdb', { host: 'example.com', protocol: 'hostname' }).catch((error) => {
      expect(error.message).not.toMatch(/scheme/i);
    });
  });
});
