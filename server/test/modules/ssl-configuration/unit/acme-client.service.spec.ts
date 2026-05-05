/**
 * AcmeClientService Unit Tests
 *
 * Covers:
 * - getOrCreateAccountKey() 3-step resolution (filesystem → DB → generate)
 * - handleChallengeCreate / handleChallengeRemove — DB-based multi-pod storage
 * - getChallengeResponse — DB lookup for serving challenge tokens
 * - ACME challenge token validation (path-traversal prevention)
 *
 * @group platform
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AcmeClientService } from '@ee/ssl-configuration/acme-client.service';
import { InstanceSettingsUtilService } from '@ee/instance-settings/util.service';
import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_SETTINGS_TYPE } from '@modules/instance-settings/constants';

// ---------------------------------------------------------------------------
// Mock fs/promises
// ---------------------------------------------------------------------------
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: (...args: any[]) => mockReadFile(...args),
  writeFile: (...args: any[]) => mockWriteFile(...args),
  mkdir: (...args: any[]) => mockMkdir(...args),
}));

// ---------------------------------------------------------------------------
// Mock acme-client — keep tests fast, avoid real ACME HTTP calls
// ---------------------------------------------------------------------------
const mockAcmeAuto = jest.fn();
const mockCreatePrivateKey = jest.fn();
const mockCreateCsr = jest.fn();

jest.mock('acme-client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    auto: (...args: any[]) => mockAcmeAuto(...args),
  })),
  crypto: {
    createPrivateKey: (...args: any[]) => mockCreatePrivateKey(...args),
    createCsr: (...args: any[]) => mockCreateCsr(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeModule(settingsOverrides: Partial<InstanceSettingsUtilService> = {}) {
  return Test.createTestingModule({
    providers: [
      AcmeClientService,
      {
        provide: InstanceSettingsUtilService,
        useValue: {
          getSettings: jest.fn().mockResolvedValue(null),
          updateSystemParams: jest.fn().mockResolvedValue(undefined),
          ...settingsOverrides,
        },
      },
    ],
  }).compile();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('AcmeClientService', () => {
  let service: AcmeClientService;
  let instanceSettingsUtil: jest.Mocked<InstanceSettingsUtilService>;

  beforeEach(async () => {
    const module: TestingModule = await makeModule();
    service = module.get<AcmeClientService>(AcmeClientService);
    instanceSettingsUtil = module.get(InstanceSettingsUtilService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // getOrCreateAccountKey — 3-step resolution
  // -------------------------------------------------------------------------
  describe('getOrCreateAccountKey (via acquireCertificate)', () => {
    beforeEach(() => {
      mockCreateCsr.mockResolvedValue([
        { toString: () => 'mock-private-key' },
        { toString: () => 'mock-csr' },
      ]);
      mockAcmeAuto.mockResolvedValue('-----BEGIN CERTIFICATE-----\nleaf\n-----END CERTIFICATE-----\n');
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
    });

    it('step 1: uses existing account key from filesystem when present', async () => {
      mockReadFile.mockResolvedValueOnce('existing-account-key-pem');

      await service.acquireCertificate('app.example.com', 'admin@example.com', false);

      expect(mockReadFile).toHaveBeenCalledWith('/etc/letsencrypt/account.pem', 'utf8');
      expect(instanceSettingsUtil.getSettings).not.toHaveBeenCalledWith(
        INSTANCE_SYSTEM_SETTINGS.SSL_ACCOUNT_KEY,
        expect.anything(),
        expect.anything()
      );
    });

    it('step 2: falls back to DB when filesystem key is absent', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
      instanceSettingsUtil.getSettings.mockResolvedValue('db-account-key-pem');

      await service.acquireCertificate('app.example.com', 'admin@example.com', false);

      expect(instanceSettingsUtil.getSettings).toHaveBeenCalledWith(
        INSTANCE_SYSTEM_SETTINGS.SSL_ACCOUNT_KEY,
        false,
        expect.anything()
      );
      // Restores key to filesystem so next call hits step 1
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/etc/letsencrypt/account.pem',
        'db-account-key-pem',
        expect.objectContaining({ mode: 0o600 })
      );
    });

    it('step 3: generates a new key and persists to both filesystem and DB', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
      instanceSettingsUtil.getSettings.mockResolvedValue(null);
      mockCreatePrivateKey.mockResolvedValue({ toString: () => 'generated-key-pem' });

      await service.acquireCertificate('app.example.com', 'admin@example.com', false);

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/etc/letsencrypt/account.pem',
        'generated-key-pem',
        expect.objectContaining({ mode: 0o600 })
      );
      expect(instanceSettingsUtil.updateSystemParams).toHaveBeenCalledWith(
        expect.objectContaining({
          [INSTANCE_SYSTEM_SETTINGS.SSL_ACCOUNT_KEY]: 'generated-key-pem',
        })
      );
    });

    it('does not throw when DB save of generated key fails (non-fatal)', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
      instanceSettingsUtil.getSettings.mockResolvedValue(null);
      mockCreatePrivateKey.mockResolvedValue({ toString: () => 'generated-key-pem' });
      instanceSettingsUtil.updateSystemParams.mockRejectedValue(new Error('DB write failed'));

      await expect(
        service.acquireCertificate('app.example.com', 'admin@example.com', false)
      ).resolves.not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // ACME challenge — DB-based multi-pod storage
  // -------------------------------------------------------------------------
  describe('handleChallengeCreate and handleChallengeRemove (DB storage)', () => {
    // Expose private methods via a test-specific subclass
    class TestableAcmeClientService extends AcmeClientService {
      async testChallengeCreate(token: string, keyAuth = 'keyAuth') {
        return (this as any).handleChallengeCreate({}, { token }, keyAuth);
      }
      async testChallengeRemove(token: string) {
        return (this as any).handleChallengeRemove({}, { token }, '');
      }
    }

    let svc: TestableAcmeClientService;
    let util: jest.Mocked<InstanceSettingsUtilService>;

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          { provide: AcmeClientService, useClass: TestableAcmeClientService },
          {
            provide: InstanceSettingsUtilService,
            useValue: {
              getSettings: jest.fn().mockResolvedValue(null),
              updateSystemParams: jest.fn().mockResolvedValue(undefined),
            },
          },
        ],
      }).compile();

      svc = module.get<AcmeClientService>(AcmeClientService) as TestableAcmeClientService;
      util = module.get(InstanceSettingsUtilService);
    });

    it('stores token → keyAuth JSON map in DB on create', async () => {
      util.getSettings.mockResolvedValue(null); // no existing challenges

      await svc.testChallengeCreate('abc123', 'abc123.fingerprint');

      expect(util.updateSystemParams).toHaveBeenCalledWith({
        [INSTANCE_SYSTEM_SETTINGS.SSL_ACME_CHALLENGE]: JSON.stringify({
          abc123: 'abc123.fingerprint',
        }),
      });
    });

    it('merges new token into existing challenges map', async () => {
      util.getSettings.mockResolvedValue(JSON.stringify({ existing: 'existing.fp' }));

      await svc.testChallengeCreate('newtoken', 'newtoken.fp');

      expect(util.updateSystemParams).toHaveBeenCalledWith({
        [INSTANCE_SYSTEM_SETTINGS.SSL_ACME_CHALLENGE]: JSON.stringify({
          existing: 'existing.fp',
          newtoken: 'newtoken.fp',
        }),
      });
    });

    it('removes token from DB map on challenge remove', async () => {
      util.getSettings.mockResolvedValue(JSON.stringify({ abc123: 'abc123.fp', other: 'other.fp' }));

      await svc.testChallengeRemove('abc123');

      expect(util.updateSystemParams).toHaveBeenCalledWith({
        [INSTANCE_SYSTEM_SETTINGS.SSL_ACME_CHALLENGE]: JSON.stringify({ other: 'other.fp' }),
      });
    });

    it('does not throw when remove DB write fails (non-fatal)', async () => {
      util.getSettings.mockResolvedValue(JSON.stringify({ abc123: 'abc123.fp' }));
      util.updateSystemParams.mockRejectedValueOnce(new Error('DB error'));

      await expect(svc.testChallengeRemove('abc123')).resolves.not.toThrow();
    });

    it('does NOT write to the filesystem on challenge create', async () => {
      util.getSettings.mockResolvedValue(null);
      await svc.testChallengeCreate('abc123', 'abc123.fp');
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getChallengeResponse — DB lookup used by the middleware
  // -------------------------------------------------------------------------
  describe('getChallengeResponse', () => {
    it('returns the key authorization for a known token', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        JSON.stringify({ abc123: 'abc123.fingerprint' })
      );

      const result = await service.getChallengeResponse('abc123');

      expect(result).toBe('abc123.fingerprint');
    });

    it('returns null for an unknown token', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        JSON.stringify({ other: 'other.fp' })
      );

      expect(await service.getChallengeResponse('abc123')).toBeNull();
    });

    it('returns null when no challenges are stored', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(null);

      expect(await service.getChallengeResponse('abc123')).toBeNull();
    });

    it('returns null for a token with path-traversal sequences', async () => {
      instanceSettingsUtil.getSettings.mockResolvedValue(
        JSON.stringify({ '../etc/passwd': 'malicious' })
      );

      expect(await service.getChallengeResponse('../etc/passwd')).toBeNull();
      expect(instanceSettingsUtil.getSettings).not.toHaveBeenCalled();
    });

    it('returns null for tokens with forward slashes', async () => {
      expect(await service.getChallengeResponse('a/b')).toBeNull();
    });

    it('returns null when DB read throws (graceful degradation)', async () => {
      instanceSettingsUtil.getSettings.mockRejectedValue(new Error('DB down'));

      expect(await service.getChallengeResponse('abc123')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Token validation — shared between create, remove, and getChallengeResponse
  // -------------------------------------------------------------------------
  describe('ACME challenge token validation', () => {
    class TestableAcmeClientService extends AcmeClientService {
      async testChallengeCreate(token: string) {
        return (this as any).handleChallengeCreate({}, { token }, 'keyAuth');
      }
    }

    let svc: TestableAcmeClientService;

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          { provide: AcmeClientService, useClass: TestableAcmeClientService },
          {
            provide: InstanceSettingsUtilService,
            useValue: {
              getSettings: jest.fn().mockResolvedValue(null),
              updateSystemParams: jest.fn().mockResolvedValue(undefined),
            },
          },
        ],
      }).compile();
      svc = module.get<AcmeClientService>(AcmeClientService) as TestableAcmeClientService;
    });

    it('accepts valid alphanumeric token', async () => {
      await expect(svc.testChallengeCreate('abc123XYZ')).resolves.not.toThrow();
    });

    it('accepts tokens with hyphens and underscores (valid ACME format)', async () => {
      await expect(svc.testChallengeCreate('abc-123_XYZ')).resolves.not.toThrow();
    });

    it('rejects tokens with path-traversal sequences (..)', async () => {
      await expect(svc.testChallengeCreate('../etc/passwd')).rejects.toThrow('Invalid ACME challenge token');
    });

    it('rejects tokens with forward slashes', async () => {
      await expect(svc.testChallengeCreate('a/b')).rejects.toThrow('Invalid ACME challenge token');
    });

    it('rejects tokens with null bytes', async () => {
      await expect(svc.testChallengeCreate('abc\0def')).rejects.toThrow('Invalid ACME challenge token');
    });
  });
});
