/**
 * AcmeClientService Unit Tests
 *
 * Covers:
 * - getOrCreateAccountKey() 3-step resolution (filesystem → DB → generate)
 * - ACME challenge path-traversal prevention
 * - Challenge file write and removal
 *
 * @group platform
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AcmeClientService } from '@ee/ssl-configuration/acme-client.service';
import { InstanceSettingsUtilService } from '@ee/instance-settings/util.service';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

// ---------------------------------------------------------------------------
// Mock fs/promises
// ---------------------------------------------------------------------------
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();
const mockUnlink = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: (...args: any[]) => mockReadFile(...args),
  writeFile: (...args: any[]) => mockWriteFile(...args),
  mkdir: (...args: any[]) => mockMkdir(...args),
  unlink: (...args: any[]) => mockUnlink(...args),
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
// Test suite
// ---------------------------------------------------------------------------
describe('AcmeClientService', () => {
  let service: AcmeClientService;
  let instanceSettingsUtil: jest.Mocked<InstanceSettingsUtilService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcmeClientService,
        {
          provide: InstanceSettingsUtilService,
          useValue: {
            getSettings: jest.fn(),
            updateSystemParams: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AcmeClientService>(AcmeClientService);
    instanceSettingsUtil = module.get(InstanceSettingsUtilService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // getOrCreateAccountKey — 3-step resolution
  // -------------------------------------------------------------------------
  describe('getOrCreateAccountKey (via acquireCertificate)', () => {
    // We test indirectly through acquireCertificate() since getOrCreateAccountKey is private

    beforeEach(() => {
      mockCreateCsr.mockResolvedValue([
        { toString: () => 'mock-private-key' },
        { toString: () => 'mock-csr' },
      ]);
      mockAcmeAuto.mockResolvedValue('-----BEGIN CERTIFICATE-----\nleaf\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nchain\n-----END CERTIFICATE-----\n');
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
    });

    it('step 1: uses existing account key from filesystem when present', async () => {
      const existingKey = 'existing-account-key-pem';
      mockReadFile.mockResolvedValueOnce(existingKey); // account.pem read succeeds

      await service.acquireCertificate('app.example.com', 'admin@example.com', false);

      // Should have read account.pem from filesystem
      expect(mockReadFile).toHaveBeenCalledWith('/etc/letsencrypt/account.pem', 'utf8');
      // DB should NOT have been queried for account key
      expect(instanceSettingsUtil.getSettings).not.toHaveBeenCalled();
    });

    it('step 2: falls back to DB when filesystem key is absent', async () => {
      const dbKey = 'db-account-key-pem';
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT')); // filesystem miss
      instanceSettingsUtil.getSettings.mockResolvedValue(dbKey);

      await service.acquireCertificate('app.example.com', 'admin@example.com', false);

      // Should have queried DB
      expect(instanceSettingsUtil.getSettings).toHaveBeenCalledWith(
        INSTANCE_SYSTEM_SETTINGS.SSL_ACCOUNT_KEY,
        false,
        expect.anything()
      );
      // Should have written the key back to filesystem
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/etc/letsencrypt/account.pem',
        dbKey,
        expect.objectContaining({ mode: 0o600 })
      );
    });

    it('step 3: generates a new key and persists to both filesystem and DB when neither has it', async () => {
      const generatedKey = { toString: () => 'generated-key-pem' };
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT')); // filesystem miss
      instanceSettingsUtil.getSettings.mockResolvedValue(null);   // DB miss
      mockCreatePrivateKey.mockResolvedValue(generatedKey);

      await service.acquireCertificate('app.example.com', 'admin@example.com', false);

      // New key written to filesystem
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/etc/letsencrypt/account.pem',
        'generated-key-pem',
        expect.objectContaining({ mode: 0o600 })
      );
      // And saved to DB
      expect(instanceSettingsUtil.updateSystemParams).toHaveBeenCalledWith(
        expect.objectContaining({
          [INSTANCE_SYSTEM_SETTINGS.SSL_ACCOUNT_KEY]: 'generated-key-pem',
        })
      );
    });

    it('continues without throwing when DB save of generated key fails', async () => {
      const generatedKey = { toString: () => 'generated-key-pem' };
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
      instanceSettingsUtil.getSettings.mockResolvedValue(null);
      mockCreatePrivateKey.mockResolvedValue(generatedKey);
      instanceSettingsUtil.updateSystemParams.mockRejectedValue(new Error('DB write failed'));

      // Should NOT throw — DB failure is non-fatal
      await expect(
        service.acquireCertificate('app.example.com', 'admin@example.com', false)
      ).resolves.not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // ACME challenge path-traversal prevention
  // -------------------------------------------------------------------------
  describe('ACME challenge security', () => {
    // Expose private methods via a test-specific subclass
    class TestableAcmeClientService extends AcmeClientService {
      async testChallengeCreate(token: string) {
        return (this as any).handleChallengeCreate({}, { token }, 'keyAuthorization');
      }

      async testChallengeRemove(token: string) {
        return (this as any).handleChallengeRemove({}, { token }, 'keyAuthorization');
      }
    }

    let testableService: TestableAcmeClientService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          { provide: AcmeClientService, useClass: TestableAcmeClientService },
          {
            provide: InstanceSettingsUtilService,
            useValue: { getSettings: jest.fn(), updateSystemParams: jest.fn() },
          },
        ],
      }).compile();

      testableService = module.get<AcmeClientService>(AcmeClientService) as TestableAcmeClientService;
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);
    });

    it('accepts a valid alphanumeric challenge token', async () => {
      await expect(testableService.testChallengeCreate('abc123XYZ')).resolves.not.toThrow();
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('rejects tokens with path-traversal sequences (..)', async () => {
      await expect(testableService.testChallengeCreate('../etc/passwd')).rejects.toThrow(
        'Invalid ACME challenge token'
      );
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('rejects tokens with forward slashes', async () => {
      await expect(testableService.testChallengeCreate('a/b')).rejects.toThrow(
        'Invalid ACME challenge token'
      );
    });

    it('rejects tokens with null bytes', async () => {
      await expect(testableService.testChallengeCreate('abc\0def')).rejects.toThrow(
        'Invalid ACME challenge token'
      );
    });

    it('accepts tokens with hyphens and underscores (valid ACME tokens)', async () => {
      await expect(testableService.testChallengeCreate('abc-123_XYZ')).resolves.not.toThrow();
    });

    it('removes challenge file for a valid token', async () => {
      await testableService.testChallengeRemove('validtoken123');
      expect(mockUnlink).toHaveBeenCalledWith(
        expect.stringContaining('validtoken123')
      );
    });

    it('does not throw when challenge file removal fails (non-fatal)', async () => {
      mockUnlink.mockRejectedValueOnce(new Error('ENOENT'));
      await expect(testableService.testChallengeRemove('validtoken123')).resolves.not.toThrow();
    });

    it('rejects removal of path-traversal token', async () => {
      await expect(testableService.testChallengeRemove('../../../etc/shadow')).rejects.toThrow(
        'Invalid ACME challenge token'
      );
      expect(mockUnlink).not.toHaveBeenCalled();
    });
  });

});
