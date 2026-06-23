/**
 * @group platform
 */
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  updateEntity,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'src/entities/app.entity';
import { AppVersion, AppVersionStatus } from 'src/entities/app_version.entity';

// initTestApp() can exceed 60s when Jest restarts the worker to free memory
jest.setTimeout(120_000);

describe('ExternalApisAppsController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let appEntity: App;
    let version: AppVersion;
    const versionSlug = 'release-ext-slug';
    // ExternalApiSecurityGuard validates `Authorization: Basic <EXTERNAL_API_ACCESS_TOKEN>`.
    // Read the token from the same ConfigService the guard resolves it from — the
    // app's ConfigModule and process.env can diverge (different env files), so
    // ConfigService is the single source of truth.
    let authHeader: string;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      authHeader = `Basic ${app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN')}`;

      const admin = await createAdmin(app, 'ext-apps-admin@tooljet.io');
      appEntity = await createApplication(app, { name: 'ext-release-app', user: admin.user });
      version = await createApplicationVersion(app, appEntity as App & { organizationId: string });
      // Slug resolution is keyed on app_versions.slug. The release endpoint also
      // rejects DRAFT versions, so seed a non-draft, slug-bearing version.
      await updateEntity(AppVersion, version.id, { slug: versionSlug, status: AppVersionStatus.PUBLISHED });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    describe('POST /api/ext/apps/:appIdOrSlug/git-sync/release | Auto-release app', () => {
      // Regression: findByIdOrSlug's slug branch did not load app.appVersions,
      // so autoDeployApp could not resolve the target version and returned 404
      // for slug input even though the version existed.
      it('should release by versionId when the app is addressed by slug', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/ext/apps/${versionSlug}/git-sync/release`)
          .set('Authorization', authHeader)
          .send({ versionId: version.id });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ id: appEntity.id });
      });

      it('should release by versionName when the app is addressed by slug', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/ext/apps/${versionSlug}/git-sync/release`)
          .set('Authorization', authHeader)
          .send({ versionName: version.name });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ id: appEntity.id });
      });

      it('should release by versionId when the app is addressed by UUID', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/ext/apps/${appEntity.id}/git-sync/release`)
          .set('Authorization', authHeader)
          .send({ versionId: version.id });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ id: appEntity.id });
      });

      it('should return 404 for an unknown slug', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post('/api/ext/apps/does-not-exist-slug/git-sync/release')
          .set('Authorization', authHeader)
          .send({ versionId: version.id });

        expect(res.status).toBe(404);
      });

      it('should return 403 when the authorization header is missing', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/ext/apps/${versionSlug}/git-sync/release`)
          .send({ versionId: version.id });

        expect(res.status).toBe(403);
      });

      it('should return 403 when the access token is wrong', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/ext/apps/${versionSlug}/git-sync/release`)
          .set('Authorization', 'Basic wrong-token')
          .send({ versionId: version.id });

        expect(res.status).toBe(403);
      });
    });
  });
});
