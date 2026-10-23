import * as net from 'net';
import * as dns from 'dns/promises';
import { DataSourcesUtilService } from '../../../../src/modules/data-sources/util.service';
import { SSRF_RUNTIME_CONFIG_KEY } from '../../../../src/helpers/ssrf-protection.helper';

type ValidateTestConnectionOptions = {
  validateTestConnectionOptionsForSSRF(
    kind: string,
    pluginId: string | undefined,
    options: Record<string, unknown>
  ): Promise<void>;
};

describe('DataSourcesUtilService.validateTestConnectionOptionsForSSRF', () => {
  const service = Object.create(DataSourcesUtilService.prototype) as unknown as ValidateTestConnectionOptions;
  const validate = (kind: string, options: Record<string, unknown>, pluginId?: string) =>
    service.validateTestConnectionOptionsForSSRF(kind, pluginId, options);

  beforeEach(() => {
    (globalThis as Record<string, unknown>)[SSRF_RUNTIME_CONFIG_KEY] = {
      enabled: true,
      allowedHostnames: new Set<string>(),
      allowedRanges: new net.BlockList(),
    };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[SSRF_RUNTIME_CONFIG_KEY];
    jest.restoreAllMocks();
  });

  describe('database kinds', () => {
    it('skips the host check for a built-in database kind', async () => {
      await expect(validate('postgresql', { host: '127.0.0.1' })).resolves.toBeUndefined();
      await expect(validate('mysql', { host: '127.0.0.1', protocol: 'hostname' })).resolves.toBeUndefined();
    });

    it('still checks the host when a marketplace plugin_id comes with a database kind', async () => {
      await expect(validate('mysql', { host: '127.0.0.1' }, 'a-marketplace-plugin-id')).rejects.toThrow();
    });
  });

  describe('every other kind', () => {
    it('checks host/port/protocol on an HTTP-style kind', async () => {
      await expect(validate('influxdb', { host: '127.0.0.1', port: 8086, protocol: 'http' })).rejects.toThrow();
    });

    it('checks URL-style options on a kind that is not listed anywhere', async () => {
      await expect(validate('s3', { endpoint: 'http://169.254.169.254' })).rejects.toThrow();
      await expect(validate('qdrant', { url: 'http://127.0.0.1:6333' })).rejects.toThrow();
    });

    it('treats a non-http protocol value as no scheme and validates the host as https', async () => {
      jest.spyOn(dns, 'resolve4').mockResolvedValue(['93.184.215.14']);
      jest.spyOn(dns, 'resolve6').mockResolvedValue([]);
      await expect(validate('couchdb', { host: 'example.com', protocol: 'hostname' })).resolves.toBeUndefined();
    });
  });
});
