/** @group platform */
import { LoginConfigsUtilService } from '@modules/login-configs/util.service';
import { EncryptionService } from '@modules/encryption/service';

const CLIENT_KEY = '-----BEGIN PRIVATE KEY-----synthetic-ldap-client-key-----END PRIVATE KEY-----';

function ldapConfigs() {
  return {
    name: 'LDAP',
    host: 'ldap.example.com',
    port: 636,
    ssl: true,
    sslCerts: { client_key: CLIENT_KEY, client_cert: 'synthetic-client-cert', server_cert: 'synthetic-ca' },
  };
}

describe('LDAP client key at rest', () => {
  let service: LoginConfigsUtilService;
  let encryption: EncryptionService;

  beforeAll(() => {
    process.env.LOCKBOX_MASTER_KEY ??= '1d291a926ddfd221205a23adb4cc1db66cb9fcaf28d97c8c1950e3538e3b9281';
  });

  beforeEach(() => {
    encryption = new EncryptionService();
    service = new LoginConfigsUtilService({ get: jest.fn() } as any, encryption, {} as any, {} as any);
  });

  describe('encryptSecret', () => {
    it('encrypts ssl_certs.client_key', async () => {
      const configs = ldapConfigs();
      await service.encryptSecret(configs);
      expect(configs.sslCerts.client_key).not.toBe(CLIENT_KEY);
      expect(configs.sslCerts.client_key).not.toContain('synthetic-ldap-client-key');
    });

    it('leaves the certificates, which are public, readable', async () => {
      const configs = ldapConfigs();
      await service.encryptSecret(configs);
      expect(configs.sslCerts.client_cert).toBe('synthetic-client-cert');
      expect(configs.sslCerts.server_cert).toBe('synthetic-ca');
    });

    it('keeps the stored ciphertext when the key is saved again unchanged', async () => {
      const first = ldapConfigs();
      await service.encryptSecret(first);

      const second = ldapConfigs();
      await service.encryptSecret(second, first);
      expect(second.sslCerts.client_key).toBe(first.sslCerts.client_key);
    });

    it('stores a new ciphertext when the key changes', async () => {
      const first = ldapConfigs();
      await service.encryptSecret(first);

      const second = ldapConfigs();
      second.sslCerts.client_key = 'a-rotated-synthetic-key';
      await service.encryptSecret(second, first);
      expect(second.sslCerts.client_key).not.toBe(first.sslCerts.client_key);
    });

    it('ignores an LDAP config without certificates', async () => {
      const configs: any = { name: 'LDAP', host: 'ldap.example.com', port: 389, ssl: false };
      await expect(service.encryptSecret(configs)).resolves.not.toThrow();
      expect(configs).toEqual({ name: 'LDAP', host: 'ldap.example.com', port: 389, ssl: false });
    });
  });

  describe('decryptSecret', () => {
    it('restores the key that encryptSecret stored, so LDAP sign-in with certificates still works', async () => {
      const configs = ldapConfigs();
      await service.encryptSecret(configs);
      await service.decryptSecret(configs);
      expect(configs.sslCerts.client_key).toBe(CLIENT_KEY);
    });

    it('reads a key stored as plain text before this change, without throwing', async () => {
      const legacy = ldapConfigs();
      await expect(service.decryptSecret(legacy)).resolves.not.toThrow();
      expect(legacy.sslCerts.client_key).toBe(CLIENT_KEY);
    });
  });
});
