/**
 * CertificateAcquisitionService Unit Tests
 *
 * Covers prerequisite validation, the happy-path acquisition flow,
 * domain-change finalization, and scheduled renewal — all without real
 * ACME calls, filesystem access, or network binding.
 *
 * @group platform
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CertificateAcquisitionService } from '@ee/ssl-configuration/certificate-acquisition.service';
import { SslConfigurationService } from '@ee/ssl-configuration/service';
import { AcmeClientService } from '@ee/ssl-configuration/acme-client.service';
import { InstanceSettingsUtilService } from '@ee/instance-settings/util.service';
import { SslServerManagerService } from '@services/ssl-server-manager.service';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

// ---------------------------------------------------------------------------
// Mock fs — existsSync and readFileSync used in verifyCertificateExists and
// saveCertificatesToDatabase; fs/promises used for writes
// ---------------------------------------------------------------------------
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockFsPromisesMkdir = jest.fn();
const mockFsPromisesWriteFile = jest.fn();

jest.mock('fs', () => ({
  existsSync: (...args: any[]) => mockExistsSync(...args),
  readFileSync: (...args: any[]) => mockReadFileSync(...args),
  promises: {
    mkdir: (...args: any[]) => mockFsPromisesMkdir(...args),
    writeFile: (...args: any[]) => mockFsPromisesWriteFile(...args),
  },
}));

// ---------------------------------------------------------------------------
// Mock crypto.X509Certificate — returns a minimal object with validTo/validFrom
// ---------------------------------------------------------------------------
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  X509Certificate: jest.fn().mockImplementation(() => ({
    validTo: 'Jan 01 00:00:00 2026 GMT',
    validFrom: 'Oct 01 00:00:00 2025 GMT',
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const LEAF_PEM = '-----BEGIN CERTIFICATE-----\nleaf\n-----END CERTIFICATE-----\n';
const CHAIN_PEM = '-----BEGIN CERTIFICATE-----\nchain\n-----END CERTIFICATE-----\n';

function buildSslConfig(overrides: Record<string, any> = {}) {
  return {
    enabled: true,
    email: 'admin@example.com',
    staging: false,
    domain: 'app.example.com',
    fullchainPem: '',
    privkeyPem: '',
    certPem: '',
    chainPem: '',
    acquiredAt: '',
    expiresAt: '',
    domainChangeRequested: false,
    newDomain: '',
    previousDomain: '',
    ...overrides,
  };
}

describe('CertificateAcquisitionService', () => {
  let service: CertificateAcquisitionService;
  let sslConfigService: jest.Mocked<SslConfigurationService>;
  let acmeClientService: jest.Mocked<AcmeClientService>;
  let instanceSettingsUtil: jest.Mocked<InstanceSettingsUtilService>;
  let sslServerManager: jest.Mocked<SslServerManagerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificateAcquisitionService,
        {
          provide: SslConfigurationService,
          useValue: {
            getConfig: jest.fn(),
            validatePortAccessibility: jest.fn(),
          },
        },
        {
          provide: AcmeClientService,
          useValue: {
            acquireCertificate: jest.fn(),
            renewCertificate: jest.fn(),
          },
        },
        {
          provide: InstanceSettingsUtilService,
          useValue: {
            getSettings: jest.fn(),
            updateSystemParams: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SslServerManagerService,
          useValue: {
            startHttpsServer: jest.fn().mockResolvedValue(undefined),
            reloadCertificates: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CertificateAcquisitionService>(CertificateAcquisitionService);
    sslConfigService = module.get(SslConfigurationService);
    acmeClientService = module.get(AcmeClientService);
    instanceSettingsUtil = module.get(InstanceSettingsUtilService);
    sslServerManager = module.get(SslServerManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TOOLJET_HOST;
  });

  // -------------------------------------------------------------------------
  // validatePrerequisites (tested indirectly via acquireCertificate)
  // -------------------------------------------------------------------------
  describe('validatePrerequisites', () => {
    it('fails when TOOLJET_HOST is not set', async () => {
      delete process.env.TOOLJET_HOST;
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/TOOLJET_HOST/);
    });

    it('fails when TOOLJET_HOST uses http:// instead of https://', async () => {
      process.env.TOOLJET_HOST = 'http://app.example.com';
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/HTTPS/i);
    });

    it('fails when port 80 is not accessible', async () => {
      process.env.TOOLJET_HOST = 'https://app.example.com';
      sslConfigService.validatePortAccessibility
        .mockResolvedValueOnce({ accessible: false, message: 'EACCES' });
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/[Pp]ort 80/);
    });

    it('fails when port 443 is not accessible', async () => {
      process.env.TOOLJET_HOST = 'https://app.example.com';
      sslConfigService.validatePortAccessibility
        .mockResolvedValueOnce({ accessible: true, message: 'ok' })   // port 80
        .mockResolvedValueOnce({ accessible: false, message: 'EACCES' }); // port 443
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/[Pp]ort 443/);
    });
  });

  // -------------------------------------------------------------------------
  // acquireCertificate — happy path
  // -------------------------------------------------------------------------
  describe('acquireCertificate — happy path', () => {
    beforeEach(() => {
      process.env.TOOLJET_HOST = 'https://app.example.com';

      sslConfigService.validatePortAccessibility.mockResolvedValue({ accessible: true, message: 'ok' });
      sslConfigService.getConfig.mockResolvedValue(buildSslConfig() as any);

      acmeClientService.acquireCertificate.mockResolvedValue({
        key: 'private-key-pem',
        cert: LEAF_PEM + CHAIN_PEM,
        csr: 'csr-pem',
      });

      mockFsPromisesMkdir.mockResolvedValue(undefined);
      mockFsPromisesWriteFile.mockResolvedValue(undefined);

      // verifyCertificateExists — both files found
      mockExistsSync.mockReturnValue(true);
      // readFileSync — fullchain.pem content (for X509Certificate)
      mockReadFileSync.mockReturnValue(LEAF_PEM);
    });

    it('returns success and starts HTTPS server', async () => {
      const result = await service.acquireCertificate();
      expect(result.success).toBe(true);
      expect(sslServerManager.startHttpsServer).toHaveBeenCalled();
    });

    it('saves all four PEM files to DB', async () => {
      await service.acquireCertificate();
      expect(instanceSettingsUtil.updateSystemParams).toHaveBeenCalledWith(
        expect.objectContaining({
          [INSTANCE_SYSTEM_SETTINGS.SSL_FULLCHAIN_PEM]: expect.any(String),
          [INSTANCE_SYSTEM_SETTINGS.SSL_PRIVKEY_PEM]: expect.any(String),
          [INSTANCE_SYSTEM_SETTINGS.SSL_CERT_PEM]: expect.any(String),
          [INSTANCE_SYSTEM_SETTINGS.SSL_CHAIN_PEM]: expect.any(String),
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: 'app.example.com',
        })
      );
    });

    it('returns error when certificate files are not found after ACME', async () => {
      mockExistsSync.mockReturnValue(false);
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CERT_NOT_FOUND');
    });

    it('returns error when HTTPS server fails to start after cert acquisition', async () => {
      sslServerManager.startHttpsServer.mockRejectedValueOnce(new Error('EADDRINUSE'));
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTPS_START_FAILED');
    });
  });

  // -------------------------------------------------------------------------
  // acquireCertificate — SSL not configured
  // -------------------------------------------------------------------------
  describe('acquireCertificate — config guards', () => {
    beforeEach(() => {
      process.env.TOOLJET_HOST = 'https://app.example.com';
      sslConfigService.validatePortAccessibility.mockResolvedValue({ accessible: true, message: 'ok' });
    });

    it('fails when SSL is not enabled in config', async () => {
      sslConfigService.getConfig.mockResolvedValue(buildSslConfig({ enabled: false }) as any);
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/SSL is not enabled/i);
    });

    it('fails when email is not set', async () => {
      sslConfigService.getConfig.mockResolvedValue(buildSslConfig({ email: '' }) as any);
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/[Ee]mail/);
    });

    it('fails when domain is not set', async () => {
      sslConfigService.getConfig.mockResolvedValue(buildSslConfig({ domain: '' }) as any);
      const result = await service.acquireCertificate();
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/[Dd]omain/);
    });
  });

  // -------------------------------------------------------------------------
  // Domain change finalization
  // -------------------------------------------------------------------------
  describe('domain change finalization', () => {
    beforeEach(() => {
      process.env.TOOLJET_HOST = 'https://new.example.com';
      sslConfigService.validatePortAccessibility.mockResolvedValue({ accessible: true, message: 'ok' });
      sslConfigService.getConfig.mockResolvedValue(
        buildSslConfig({
          domain: 'old.example.com',
          domainChangeRequested: true,
          newDomain: 'new.example.com',
          acquiredAt: '2025-01-01T00:00:00.000Z',
        }) as any
      );
      acmeClientService.acquireCertificate.mockResolvedValue({
        key: 'key-pem',
        cert: LEAF_PEM + CHAIN_PEM,
        csr: 'csr',
      });
      mockFsPromisesMkdir.mockResolvedValue(undefined);
      mockFsPromisesWriteFile.mockResolvedValue(undefined);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(LEAF_PEM);
    });

    it('acquires cert for newDomain when domain change is requested', async () => {
      await service.acquireCertificate();
      expect(acmeClientService.acquireCertificate).toHaveBeenCalledWith(
        'new.example.com',
        expect.any(String),
        expect.any(Boolean)
      );
    });

    it('atomically finalizes domain change in DB', async () => {
      await service.acquireCertificate();
      expect(instanceSettingsUtil.updateSystemParams).toHaveBeenCalledWith(
        expect.objectContaining({
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN]: 'new.example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_PREVIOUS_DOMAIN]: 'old.example.com',
          [INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN]: '',
          [INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED]: false,
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // PEM chain splitting
  // -------------------------------------------------------------------------
  describe('PEM chain splitting (runAcmeClient)', () => {
    beforeEach(() => {
      process.env.TOOLJET_HOST = 'https://app.example.com';
      sslConfigService.validatePortAccessibility.mockResolvedValue({ accessible: true, message: 'ok' });
      mockFsPromisesMkdir.mockResolvedValue(undefined);
      mockFsPromisesWriteFile.mockResolvedValue(undefined);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(LEAF_PEM);
    });

    it('writes only the leaf cert to cert.pem and only intermediates to chain.pem', async () => {
      const fullChain = LEAF_PEM + CHAIN_PEM;
      sslConfigService.getConfig.mockResolvedValue(buildSslConfig() as any);
      acmeClientService.acquireCertificate.mockResolvedValue({
        key: 'private-key-pem',
        cert: fullChain,
        csr: 'csr-pem',
      });

      await service.acquireCertificate();

      const writeCalls = mockFsPromisesWriteFile.mock.calls;
      // Use path-separator prefix to avoid 'fullchain.pem'.endsWith('chain.pem') false positive
      const certPemCall = writeCalls.find((c) => String(c[0]).endsWith('/cert.pem'));
      const chainPemCall = writeCalls.find((c) => String(c[0]).endsWith('/chain.pem'));
      const fullchainCall = writeCalls.find((c) => String(c[0]).endsWith('/fullchain.pem'));

      expect(certPemCall?.[1]).toContain('leaf');
      expect(certPemCall?.[1]).not.toContain('chain');
      expect(chainPemCall?.[1]).toContain('chain');
      expect(chainPemCall?.[1]).not.toContain('leaf');
      expect(fullchainCall?.[1]).toBe(fullChain);
    });

    it('writes the full chain as cert.pem when there is only one PEM block', async () => {
      sslConfigService.getConfig.mockResolvedValue(buildSslConfig() as any);
      acmeClientService.acquireCertificate.mockResolvedValue({
        key: 'private-key-pem',
        cert: LEAF_PEM,
        csr: 'csr-pem',
      });

      await service.acquireCertificate();

      const writeCalls = mockFsPromisesWriteFile.mock.calls;
      const certPemCall = writeCalls.find((c) => String(c[0]).endsWith('/cert.pem'));
      // regex strips the trailing \n from each PEM block; the code adds one back → LEAF_PEM
      expect(certPemCall?.[1]).toBe(LEAF_PEM);
    });
  });

  // -------------------------------------------------------------------------
  // Scheduled renewal
  // -------------------------------------------------------------------------
  describe('checkAndRenewCertificate', () => {
    it('skips renewal when certificate has more than 30 days remaining', async () => {
      const farFuture = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString();
      sslConfigService.getConfig.mockResolvedValue(
        buildSslConfig({
          domain: 'app.example.com',
          expiresAt: farFuture,
        }) as any
      );

      await service.checkAndRenewCertificate();

      expect(acmeClientService.renewCertificate).not.toHaveBeenCalled();
    });

    it('triggers renewal when certificate is within 30 days of expiry', async () => {
      const nearExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      sslConfigService.getConfig.mockResolvedValue(
        buildSslConfig({
          domain: 'app.example.com',
          expiresAt: nearExpiry,
        }) as any
      );

      acmeClientService.renewCertificate.mockResolvedValue({
        key: 'new-key',
        cert: LEAF_PEM + CHAIN_PEM,
        csr: 'csr',
      });
      mockFsPromisesMkdir.mockResolvedValue(undefined);
      mockFsPromisesWriteFile.mockResolvedValue(undefined);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(LEAF_PEM);

      await service.checkAndRenewCertificate();

      expect(acmeClientService.renewCertificate).toHaveBeenCalledWith(
        'app.example.com',
        'admin@example.com',
        false
      );
      expect(sslServerManager.reloadCertificates).toHaveBeenCalled();
    });

    it('skips when no certificate data exists in DB', async () => {
      sslConfigService.getConfig.mockResolvedValue(
        buildSslConfig({ domain: '', expiresAt: '' }) as any
      );
      await service.checkAndRenewCertificate();
      expect(acmeClientService.renewCertificate).not.toHaveBeenCalled();
    });
  });
});
