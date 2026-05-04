/**
 * SslConfigurationController E2E Tests
 *
 * Tests the full HTTP request → NestJS controller → service → database flow
 * for every SSL API endpoint. Certificate acquisition (ACME) and the HTTPS
 * server manager are mocked so tests run without real TLS or network calls.
 *
 * @group working
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createUser, buildTestSession, findEntity, saveEntity } from 'test-helper';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
import { CertificateAcquisitionService } from '@ee/ssl-configuration/certificate-acquisition.service';
import { SslServerManagerService } from '@services/ssl-server-manager.service';
import { SslCertificateLifecycleService } from '@ee/ssl-configuration/ssl-lifecycle.service';

/** @group platform */
describe('SslConfigurationController (e2e)', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookies: string[];
    let adminOrgId: string;
    let acquisitionService: CertificateAcquisitionService;
    let serverManager: SslServerManagerService;

    // ---------------------------------------------------------------------------
    // Helpers to seed / read SSL settings directly in the DB
    // instance_settings records are pre-seeded by migrations and never truncated
    // ---------------------------------------------------------------------------
    async function setSslSetting(key: INSTANCE_SYSTEM_SETTINGS, value: string) {
      const existing = await findEntity(InstanceSettings, { key });
      if (existing) {
        existing.value = value;
        await saveEntity(InstanceSettings, existing);
      }
    }

    async function enableSsl(domain = 'app.example.com', email = 'admin@example.com') {
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED, 'true');
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN, domain);
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_EMAIL, email);
    }

    async function resetSslSettings() {
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED, 'false');
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN, '');
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_EMAIL, '');
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT, '');
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED, 'false');
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN, '');
    }

    async function markCertificateAcquired(domain = 'app.example.com') {
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT, new Date().toISOString());
      await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN, domain);
    }

    // ---------------------------------------------------------------------------
    // Suite setup / teardown
    // ---------------------------------------------------------------------------
    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));

      // Create admin user and build a test session cookie (no HTTP round-trip)
      const { user, organization } = await createUser(app, {
        email: 'ssl-admin@tooljet.io',
        groups: ['admin', 'end-user'],
      });
      adminOrgId = organization.id;
      ({ tokenCookie: adminCookies } = await buildTestSession(user, adminOrgId));

      // Mock CertificateAcquisitionService — no real ACME calls
      acquisitionService = app.get(CertificateAcquisitionService);
      jest.spyOn(acquisitionService, 'acquireCertificate').mockResolvedValue({
        success: true,
        message: 'Certificate acquired successfully',
        certificate: { domain: 'app.example.com', expiresAt: new Date('2026-01-01') },
      });
      jest.spyOn(acquisitionService, 'checkAndRenewCertificate').mockResolvedValue(undefined);

      // Mock SslServerManagerService — no real HTTPS server binding
      serverManager = app.get(SslServerManagerService);
      jest.spyOn(serverManager, 'startHttpsServer').mockResolvedValue(undefined);
      jest.spyOn(serverManager, 'reloadCertificates').mockResolvedValue(undefined);
      jest.spyOn(serverManager, 'stopHttpsServer').mockResolvedValue(undefined);
      jest.spyOn(serverManager, 'transitionTo').mockResolvedValue(undefined);
      jest.spyOn(serverManager, 'determineState').mockReturnValue('HTTP_ONLY_DISABLED' as any);

      // Mock SslCertificateLifecycleService — no real openssl calls
      const lifecycleService = app.get(SslCertificateLifecycleService);
      jest.spyOn(lifecycleService, 'checkCertificateExpiry').mockResolvedValue(null);
    }, 60_000);

    beforeEach(async () => {
      // Reset to clean state before each test
      await resetSslSettings();
    });

    afterEach(() => {
      // Re-apply stable mock defaults that individual tests may have overridden
      jest.spyOn(serverManager, 'determineState').mockReturnValue('HTTP_ONLY_DISABLED' as any);
      jest.spyOn(serverManager, 'transitionTo').mockResolvedValue(undefined);
      jest.spyOn(acquisitionService, 'acquireCertificate').mockResolvedValue({
        success: true,
        message: 'Certificate acquired successfully',
        certificate: { domain: 'app.example.com', expiresAt: new Date('2026-01-01') },
      });
      jest.spyOn(acquisitionService, 'checkAndRenewCertificate').mockResolvedValue(undefined);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    // =========================================================================
    // GET /api/ssl — @PublicSSL (no JWT required)
    // =========================================================================
    describe('GET /api/ssl', () => {
      it('is accessible without authentication (PublicSSL)', async () => {
        await request(app.getHttpServer())
          .get('/api/ssl')
          .expect(200);
      });

      it('returns enabled: false when SSL has not been configured', async () => {
        const { body } = await request(app.getHttpServer())
          .get('/api/ssl')
          .expect(200);

        expect(body.config.enabled).toBe(false);
        expect(body.config.domain).toBe('');
      });

      it('returns the configured domain and email after saving settings', async () => {
        await enableSsl('app.example.com', 'admin@example.com');

        const { body } = await request(app.getHttpServer())
          .get('/api/ssl')
          .expect(200);

        expect(body.config.enabled).toBe(true);
        expect(body.config.domain).toBe('app.example.com');
        expect(body.config.email).toBe('admin@example.com');
      });
    });

    // =========================================================================
    // PATCH /api/ssl — requires JWT
    // =========================================================================
    describe('PATCH /api/ssl', () => {
      it('returns 401 without authentication', async () => {
        await request(app.getHttpServer())
          .patch('/api/ssl')
          .send({ enabled: true, email: 'a@b.com', domain: 'app.example.com' })
          .expect(401);
      });

      it('saves SSL configuration and returns the updated config', async () => {
        const { body } = await request(app.getHttpServer())
          .patch('/api/ssl')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ enabled: true, email: 'admin@example.com', domain: 'app.example.com' })
          .expect(200);

        expect(body.config.enabled).toBe(true);
        expect(body.config.domain).toBe('app.example.com');
        expect(body.config.email).toBe('admin@example.com');
      });

      it('rejects a domain that includes the protocol', async () => {
        await request(app.getHttpServer())
          .patch('/api/ssl')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ enabled: true, email: 'admin@example.com', domain: 'https://app.example.com' })
          .expect(400);
      });

      it('rejects a domain that includes a port', async () => {
        await request(app.getHttpServer())
          .patch('/api/ssl')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ enabled: true, email: 'admin@example.com', domain: 'app.example.com:8080' })
          .expect(400);
      });

      it('rejects a domain that includes a path', async () => {
        await request(app.getHttpServer())
          .patch('/api/ssl')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ enabled: true, email: 'admin@example.com', domain: 'app.example.com/tooljet' })
          .expect(400);
      });

      it('rejects enabling SSL without an email', async () => {
        await request(app.getHttpServer())
          .patch('/api/ssl')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ enabled: true, domain: 'app.example.com' })
          .expect(400);
      });

      it('rejects enabling SSL without a domain', async () => {
        await request(app.getHttpServer())
          .patch('/api/ssl')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ enabled: true, email: 'admin@example.com' })
          .expect(400);
      });

      it('blocks changing domain after a certificate has been acquired', async () => {
        await enableSsl('old.example.com');
        await markCertificateAcquired('old.example.com');

        await request(app.getHttpServer())
          .patch('/api/ssl')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ enabled: true, email: 'admin@example.com', domain: 'new.example.com' })
          .expect(400);
      });
    });

    // =========================================================================
    // GET /api/ssl/validate — @PublicSSL
    // =========================================================================
    describe('GET /api/ssl/validate', () => {
      it('is accessible without authentication', async () => {
        process.env.TOOLJET_HOST = 'https://app.example.com';
        await request(app.getHttpServer())
          .get('/api/ssl/validate')
          .expect(200);
        delete process.env.TOOLJET_HOST;
      });

      it('returns 400 when TOOLJET_HOST is not set', async () => {
        const saved = process.env.TOOLJET_HOST;
        delete process.env.TOOLJET_HOST;

        await request(app.getHttpServer())
          .get('/api/ssl/validate')
          .expect(400);

        if (saved) process.env.TOOLJET_HOST = saved;
      });

      it('returns 400 when TOOLJET_HOST uses HTTP instead of HTTPS', async () => {
        process.env.TOOLJET_HOST = 'http://app.example.com';

        await request(app.getHttpServer())
          .get('/api/ssl/validate')
          .expect(400);

        delete process.env.TOOLJET_HOST;
      });

      it('returns 400 when TOOLJET_HOST contains a path component', async () => {
        process.env.TOOLJET_HOST = 'https://app.example.com/tooljet/';

        await request(app.getHttpServer())
          .get('/api/ssl/validate')
          .expect(400);

        delete process.env.TOOLJET_HOST;
      });

      it('returns port accessibility info for a valid TOOLJET_HOST', async () => {
        process.env.TOOLJET_HOST = 'https://app.example.com';

        const { body } = await request(app.getHttpServer())
          .get('/api/ssl/validate')
          .expect(200);

        // validatePrerequisites returns camelCase directly (no decamelizeKeys in controller)
        expect(body).toHaveProperty('tooljetHost');
        expect(body).toHaveProperty('port80');
        expect(body).toHaveProperty('port443');
        expect(body).toHaveProperty('ready');

        delete process.env.TOOLJET_HOST;
      });
    });

    // =========================================================================
    // GET /api/ssl/certificate/status — @PublicSSL
    // =========================================================================
    describe('GET /api/ssl/certificate/status', () => {
      it('is accessible without authentication', async () => {
        await request(app.getHttpServer())
          .get('/api/ssl/certificate/status')
          .expect(200);
      });

      it('returns ssl_enabled: false and HTTP_ONLY_DISABLED state when SSL is off', async () => {
        const { body } = await request(app.getHttpServer())
          .get('/api/ssl/certificate/status')
          .expect(200);

        expect(body.ssl_enabled).toBe(false);
        expect(body.certificate_acquired).toBe(false);
        expect(body.nginx_state).toBe('HTTP_ONLY_DISABLED');
      });

      it('returns certificate_acquired: false when no cert has been issued', async () => {
        await enableSsl('app.example.com');
        jest.spyOn(serverManager, 'determineState').mockReturnValue('HTTP_ONLY_PENDING' as any);

        const { body } = await request(app.getHttpServer())
          .get('/api/ssl/certificate/status')
          .expect(200);

        expect(body.ssl_enabled).toBe(true);
        expect(body.certificate_acquired).toBe(false);
      });

      it('includes domain in the status response', async () => {
        await enableSsl('app.example.com');

        const { body } = await request(app.getHttpServer())
          .get('/api/ssl/certificate/status')
          .expect(200);

        expect(body.domain).toBe('app.example.com');
      });
    });

    // =========================================================================
    // POST /api/ssl/certificate/acquire — @PublicSSL
    // =========================================================================
    describe('POST /api/ssl/certificate/acquire', () => {
      it('is accessible without authentication (PublicSSL)', async () => {
        await enableSsl();

        await request(app.getHttpServer())
          .post('/api/ssl/certificate/acquire')
          .expect(201);
      });

      it('returns success: true and certificate details on successful acquisition', async () => {
        await enableSsl();

        const { body } = await request(app.getHttpServer())
          .post('/api/ssl/certificate/acquire')
          .expect(201);

        expect(body.success).toBe(true);
        expect(body.certificate.domain).toBe('app.example.com');
      });

      it('returns success: false when acquisition service reports failure', async () => {
        jest.spyOn(acquisitionService, 'acquireCertificate').mockResolvedValueOnce({
          success: false,
          message: 'ACME challenge failed',
          error: { code: 'ACME_CHALLENGE_FAILED', details: 'Domain verification failed' },
        });
        await enableSsl();

        const { body } = await request(app.getHttpServer())
          .post('/api/ssl/certificate/acquire')
          .expect(201);

        expect(body.success).toBe(false);
        expect(body.message).toMatch(/ACME/i);
      });
    });

    // =========================================================================
    // POST /api/ssl/domain/change — requires JWT
    // =========================================================================
    describe('POST /api/ssl/domain/change', () => {
      it('returns 401 without authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/ssl/domain/change')
          .send({ newDomain: 'new.example.com' })
          .expect(401);
      });

      it('returns 400 when SSL is disabled', async () => {
        await request(app.getHttpServer())
          .post('/api/ssl/domain/change')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ newDomain: 'new.example.com' })
          .expect(400);
      });

      it('returns 400 when no certificate exists yet', async () => {
        await enableSsl('old.example.com');

        await request(app.getHttpServer())
          .post('/api/ssl/domain/change')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ newDomain: 'new.example.com' })
          .expect(400);
      });

      it('returns 400 when newDomain equals the current domain', async () => {
        await enableSsl('app.example.com');
        await markCertificateAcquired('app.example.com');

        await request(app.getHttpServer())
          .post('/api/ssl/domain/change')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ newDomain: 'app.example.com' })
          .expect(400);
      });

      it('stages the domain change and sets domain_change_requested', async () => {
        await enableSsl('old.example.com');
        await markCertificateAcquired('old.example.com');

        const { body } = await request(app.getHttpServer())
          .post('/api/ssl/domain/change')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .send({ newDomain: 'new.example.com' })
          .expect(201);

        expect(body.config.domain_change_requested).toBe(true);
        expect(body.config.new_domain).toBe('new.example.com');
      });
    });

    // =========================================================================
    // POST /api/ssl/domain/cancel-change — requires JWT
    // =========================================================================
    describe('POST /api/ssl/domain/cancel-change', () => {
      it('returns 401 without authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/ssl/domain/cancel-change')
          .expect(401);
      });

      it('returns 400 when no domain change is pending', async () => {
        await enableSsl('app.example.com');

        await request(app.getHttpServer())
          .post('/api/ssl/domain/cancel-change')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .expect(400);
      });

      it('clears domain change state and returns updated config', async () => {
        await enableSsl('old.example.com');
        await markCertificateAcquired('old.example.com');
        await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED, 'true');
        await setSslSetting(INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN, 'new.example.com');

        const { body } = await request(app.getHttpServer())
          .post('/api/ssl/domain/cancel-change')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .expect(201);

        expect(body.config.domain_change_requested).toBe(false);
        expect(body.config.new_domain).toBe('');
      });
    });

    // =========================================================================
    // POST /api/ssl/certificate/renew — requires JWT
    // =========================================================================
    describe('POST /api/ssl/certificate/renew', () => {
      it('returns 401 without authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/ssl/certificate/renew')
          .expect(401);
      });

      it('returns success: true when renewal check runs without error', async () => {
        const { body } = await request(app.getHttpServer())
          .post('/api/ssl/certificate/renew')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .expect(201);

        expect(body.success).toBe(true);
        expect(acquisitionService.checkAndRenewCertificate).toHaveBeenCalled();
      });

      it('returns success: false when renewal throws', async () => {
        jest.spyOn(acquisitionService, 'checkAndRenewCertificate').mockRejectedValueOnce(
          new Error('Rate limit exceeded')
        );

        const { body } = await request(app.getHttpServer())
          .post('/api/ssl/certificate/renew')
          .set('Cookie', adminCookies)
          .set('tj-workspace-id', adminOrgId)
          .expect(201);

        expect(body.success).toBe(false);
        expect(body.message).toMatch(/Rate limit/);
      });
    });
  });
});
