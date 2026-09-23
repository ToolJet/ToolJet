import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoginConfigsUtilService } from '../../../../src/modules/login-configs/util.service';
import { EncryptionService } from '../../../../src/modules/encryption/service';
import { OrganizationRepository } from '../../../../src/modules/organizations/repository';
import { SSOConfigsRepository } from '../../../../src/modules/login-configs/repository';

describe('LoginConfigsUtilService', () => {
  let service: LoginConfigsUtilService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginConfigsUtilService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: EncryptionService, useValue: { encryptColumnValue: jest.fn(), decryptColumnValue: jest.fn() } },
        { provide: OrganizationRepository, useValue: {} },
        { provide: SSOConfigsRepository, useValue: {} },
      ],
    }).compile();

    service = module.get<LoginConfigsUtilService>(LoginConfigsUtilService);
  });

  describe('buildConfigs', () => {
    it('strips clientSecret (camelCase) from configs', () => {
      const config = {
        sso: 'git',
        enabled: true,
        configs: { clientId: 'my-client-id', clientSecret: 'super-secret', hostName: 'github.com' },
      };

      const result = service.buildConfigs(config, 'config-id-1');

      expect(result.configs.clientId).toBe('my-client-id');
      expect(result.configs.hostName).toBe('github.com');
      expect(result.configs.clientSecret).toBeUndefined();
    });

    it('strips client_secret (snake_case) from configs', () => {
      const config = {
        sso: 'openid',
        enabled: true,
        configs: { client_id: 'my-client-id', client_secret: 'super-secret', well_known_url: 'https://provider/.well-known/openid-configuration' },
      };

      const result = service.buildConfigs(config, 'config-id-2');

      expect(result.configs.client_id).toBe('my-client-id');
      expect(result.configs.well_known_url).toBeDefined();
      expect(result.configs.client_secret).toBeUndefined();
    });

    it('strips any key containing "secret" regardless of casing', () => {
      const config = {
        sso: 'openid',
        enabled: true,
        configs: {
          clientId: 'id',
          clientSecret: 'secret1',
          CLIENT_SECRET: 'secret2',
          someSecretKey: 'secret3',
          name: 'My OIDC',
        },
      };

      const result = service.buildConfigs(config, 'config-id-3');

      expect(result.configs.clientId).toBe('id');
      expect(result.configs.name).toBe('My OIDC');
      expect(result.configs.clientSecret).toBeUndefined();
      expect(result.configs.CLIENT_SECRET).toBeUndefined();
      expect(result.configs.someSecretKey).toBeUndefined();
    });

    it('preserves non-secret fields and the configId', () => {
      const config = {
        sso: 'openid',
        enabled: true,
        configs: { clientId: 'id', wellKnownUrl: 'https://example.com/.well-known', name: 'Corp SSO' },
      };

      const result = service.buildConfigs(config, 'cfg-abc');

      expect(result.configId).toBe('cfg-abc');
      expect(result.sso).toBe('openid');
      expect(result.enabled).toBe(true);
      expect(result.configs).toEqual({ clientId: 'id', wellKnownUrl: 'https://example.com/.well-known', name: 'Corp SSO' });
    });

    it('handles empty configs object without throwing', () => {
      const config = { sso: 'google', enabled: true, configs: {} };
      const result = service.buildConfigs(config, 'cfg-empty');
      expect(result.configs).toEqual({});
    });

    it('returns config unchanged when config is null or undefined', () => {
      expect(service.buildConfigs(null, 'x')).toBeNull();
      expect(service.buildConfigs(undefined, 'x')).toBeUndefined();
    });

    it('handles missing configs key on the config object', () => {
      const config = { sso: 'form', enabled: true };
      const result = service.buildConfigs(config, 'cfg-form');
      expect(result.configs).toEqual({});
    });
  });
});
