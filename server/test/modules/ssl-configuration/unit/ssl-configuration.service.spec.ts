/**
 * SslConfigurationService Unit Tests
 *
 * Covers config validation, domain format rules, prerequisite checks,
 * and domain-change lifecycle — all without hitting the database or
 * binding real network ports.
 *
 * @group platform
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SslConfigurationService } from '@ee/ssl-configuration/service';
import { InstanceSettingsUtilService } from '@ee/instance-settings/util.service';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

// ---------------------------------------------------------------------------
// Mock net so validatePortAccessibility never binds a real socket
// ---------------------------------------------------------------------------
jest.mock('net', () => {
  const EventEmitter = require('events');
  return {
    createServer: jest.fn(() => {
      const server = new EventEmitter();
      server.listen = jest.fn((_port: number, _host: string) => {
        // Emit listening synchronously so the promise resolves
        process.nextTick(() => server.emit('listening'));
      });
      server.close = jest.fn((cb?: () => void) => cb && cb());
      return server;
    }),
  };
});

describe('SslConfigurationService', () => {
  let service: SslConfigurationService;
  let instanceSettingsUtil: jest.Mocked<InstanceSettingsUtilService>;

  const mockSettings = (overrides: Record<string, any> = {}) => ({
    [INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED]: 'false',
    [INSTANCE_SYSTEM_SETTINGS.SSL_EMAIL]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_STAGING]: 'false',
    [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_FULLCHAIN_PEM]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_PRIVKEY_PEM]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_CERT_PEM]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_CHAIN_PEM]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_EXPIRES_AT]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_PREVIOUS_DOMAIN]: '',
    [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED]: 'false',
    [INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN]: '',
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SslConfigurationService,
        {
          provide: InstanceSettingsUtilService,
          useValue: {
            getSettings: jest.fn(),
            updateSystemParams: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SslConfigurationService>(SslConfigurationService);
    instanceSettingsUtil = module.get(InstanceSettingsUtilService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // getConfig
  // -------------------------------------------------------------------------
  describe('getConfig', () => {
    it('returns disabled config when SSL is off', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(mockSettings());
      const config = await service.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.domain).toBe('');
      expect(config.fullchainPem).toBe('');
    });

    it('returns enabled config with certificate data', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        mockSettings({
          [INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED]: 'true',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: 'app.example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_EMAIL]: 'admin@example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT]: '2025-01-01T00:00:00.000Z',
          [INSTANCE_SYSTEM_SETTINGS.SSL_EXPIRES_AT]: '2025-04-01T00:00:00.000Z',
        })
      );
      const config = await service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.domain).toBe('app.example.com');
      expect(config.acquiredAt).toBe('2025-01-01T00:00:00.000Z');
    });

    it('maps domain change state correctly', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        mockSettings({
          [INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED]: 'true',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: 'old.example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED]: 'true',
          [INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN]: 'new.example.com',
        })
      );
      const config = await service.getConfig();
      expect(config.domainChangeRequested).toBe(true);
      expect(config.newDomain).toBe('new.example.com');
    });
  });

  // -------------------------------------------------------------------------
  // updateConfig — domain validation
  // -------------------------------------------------------------------------
  describe('updateConfig — domain validation', () => {
    beforeEach(() => {
      // updateConfig calls getConfig() first when domain is provided.
      // Return an empty (no cert acquired) settings object so the pre-check passes
      // and domain/email validation can be exercised.
      instanceSettingsUtil.getSettings.mockResolvedValue(mockSettings());
    });

    it('rejects domains that include a protocol', async () => {
      await expect(
        service.updateConfig({ enabled: true, email: 'a@b.com', domain: 'https://app.example.com' })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects domains that include a port', async () => {
      await expect(
        service.updateConfig({ enabled: true, email: 'a@b.com', domain: 'app.example.com:8080' })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects domains that include a path', async () => {
      await expect(
        service.updateConfig({ enabled: true, email: 'a@b.com', domain: 'app.example.com/tooljet' })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid domain characters', async () => {
      await expect(
        service.updateConfig({ enabled: true, email: 'a@b.com', domain: 'app_underscore.com' })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects empty domain when SSL is enabled', async () => {
      await expect(
        service.updateConfig({ enabled: true, email: 'a@b.com', domain: '' })
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a valid subdomain', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(mockSettings());
      await expect(
        service.updateConfig({ enabled: true, email: 'a@b.com', domain: 'app.example.com' })
      ).resolves.not.toThrow();
      expect(instanceSettingsUtil.updateSystemParams).toHaveBeenCalled();
    });

    it('rejects missing email when SSL is enabled', async () => {
      await expect(
        service.updateConfig({ enabled: true, email: '', domain: 'app.example.com' })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects malformed email', async () => {
      await expect(
        service.updateConfig({ enabled: true, email: 'not-an-email', domain: 'app.example.com' })
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks direct domain change after cert is acquired', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        mockSettings({
          [INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED]: 'true',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: 'old.example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT]: '2025-01-01T00:00:00.000Z',
        })
      );
      await expect(
        service.updateConfig({ enabled: true, email: 'a@b.com', domain: 'new.example.com' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------------------
  // validatePrerequisites
  // -------------------------------------------------------------------------
  describe('validatePrerequisites', () => {
    beforeEach(() => {
      process.env.TOOLJET_HOST = 'https://app.example.com';
    });

    afterEach(() => {
      delete process.env.TOOLJET_HOST;
      delete process.env.SUB_PATH;
    });

    it('throws when TOOLJET_HOST is not set', async () => {
      delete process.env.TOOLJET_HOST;
      await expect(service.validatePrerequisites()).rejects.toThrow(BadRequestException);
    });

    it('throws when TOOLJET_HOST uses HTTP instead of HTTPS', async () => {
      process.env.TOOLJET_HOST = 'http://app.example.com';
      await expect(service.validatePrerequisites()).rejects.toThrow(BadRequestException);
    });

    it('throws when TOOLJET_HOST contains a path component', async () => {
      process.env.TOOLJET_HOST = 'https://app.example.com/tooljet/';
      await expect(service.validatePrerequisites()).rejects.toThrow(BadRequestException);
    });

    it('resolves with port status for a valid TOOLJET_HOST', async () => {
      const result = await service.validatePrerequisites();
      expect(result.tooljetHost).toBe('https://app.example.com');
      expect(result).toHaveProperty('port80');
      expect(result).toHaveProperty('port443');
      expect(result).toHaveProperty('ready');
    });
  });

  // -------------------------------------------------------------------------
  // requestDomainChange
  // -------------------------------------------------------------------------
  describe('requestDomainChange', () => {
    it('throws when SSL is disabled', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(mockSettings());
      await expect(service.requestDomainChange({ newDomain: 'new.example.com' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('throws when no certificate exists', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        mockSettings({
          [INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED]: 'true',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: 'app.example.com',
        })
      );
      await expect(service.requestDomainChange({ newDomain: 'new.example.com' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('throws when new domain equals current domain', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        mockSettings({
          [INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED]: 'true',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: 'app.example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT]: '2025-01-01T00:00:00.000Z',
        })
      );
      await expect(service.requestDomainChange({ newDomain: 'app.example.com' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('stores newDomain and sets domainChangeRequested flag', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        mockSettings({
          [INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED]: 'true',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: 'old.example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT]: '2025-01-01T00:00:00.000Z',
        })
      );
      await service.requestDomainChange({ newDomain: 'new.example.com' });
      expect(instanceSettingsUtil.updateSystemParams).toHaveBeenCalledWith(
        expect.objectContaining({
          [INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN]: 'new.example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED]: true,
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // cancelDomainChange
  // -------------------------------------------------------------------------
  describe('cancelDomainChange', () => {
    it('throws when no domain change is pending', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(mockSettings());
      await expect(service.cancelDomainChange()).rejects.toThrow(BadRequestException);
    });

    it('clears domain change state', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        mockSettings({
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED]: 'true',
          [INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN]: 'new.example.com',
        })
      );
      await service.cancelDomainChange();
      expect(instanceSettingsUtil.updateSystemParams).toHaveBeenCalledWith(
        expect.objectContaining({
          [INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN]: '',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED]: false,
        })
      );
    });
  });
});
