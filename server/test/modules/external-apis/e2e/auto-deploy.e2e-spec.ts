import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  resetDB,
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
} from 'test-helper';
import { AppVersion, AppVersionStatus } from 'src/entities/app_version.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { App } from 'src/entities/app.entity';
import { Repository } from 'typeorm';

/**
 * External API — POST /ext/apps/:appIdOrSlug/git-sync/release (autoDeployApp)
 *
 * Promotes an existing (non-draft) version to the production environment and
 * makes it the app's current version.
 * Tested cases:
 *   - Auth: missing header, wrong token
 *   - 404: app not found, versionId not found for app
 *   - 400: versionId/versionName is a draft, versionName not found, no target
 *     resolvable because the app isn't git-synced
 *   - 201 happy path: by versionId, by versionName, by slug, redeploy of an
 *     already-published version
 *   - DB persistence + isolation from other versions on the same app
 */

/** @group platform */
describe('External API — POST /ext/apps/:appIdOrSlug/git-sync/release', () => {
  let AUTH_HEADER: string;

  let nestApp: INestApplication;
  let versionRepo: Repository<AppVersion>;
  let envRepo: Repository<AppEnvironment>;
  let appRepo: Repository<App>;

  beforeAll(async () => {
    process.env.ENABLE_EXTERNAL_API = 'true';
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));

    const configService = nestApp.get<ConfigService>(ConfigService);
    AUTH_HEADER = `Basic ${configService.get('EXTERNAL_API_ACCESS_TOKEN')}`;

    const ds = getDefaultDataSource();
    versionRepo = ds.getRepository(AppVersion);
    envRepo = ds.getRepository(AppEnvironment);
    appRepo = ds.getRepository(App);
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await resetDB();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async function seedOrg() {
    const { user, organization } = await createUser(nestApp, {
      email: `admin+${Date.now()}@tooljet.io`,
      groups: ['admin'],
    });
    return { user, organization };
  }

  async function seedApp(user: any) {
    return createApplication(nestApp, { user, name: `App-${Date.now()}`, isPublic: false });
  }

  async function seedVersion(
    app: App & { organizationId: string },
    name: string,
    status: AppVersionStatus
  ): Promise<AppVersion> {
    const version = await createApplicationVersion(nestApp, app, { name });
    await versionRepo.update(version.id, { status });
    return versionRepo.findOne({ where: { id: version.id } });
  }

  async function prodEnvFor(organizationId: string) {
    return envRepo.findOne({ where: { organizationId }, order: { priority: 'DESC' } });
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  describe('auth', () => {
    it('returns 403 when Authorization header is missing', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .send({})
        .expect(403);
    });

    it('returns 403 when Authorization header has wrong token', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', 'Basic wrong-token')
        .send({})
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 404 — not found cases
  // ---------------------------------------------------------------------------

  describe('404 cases', () => {
    it('returns 404 when app does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${nonExistentId}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(404);
    });

    // findByIdOrSlug branches on isUUID(idOrSlug): a UUID-format id takes the
    // id lookup above; a non-UUID string skips straight to the slug query.
    // Neither the UUID-format 404 case above nor any other test in this file
    // exercises that slug-only branch when it resolves to nothing.
    it('returns 404 when app slug does not exist', async () => {
      await request(nestApp.getHttpServer())
        .post('/api/ext/apps/does-not-exist-slug/git-sync/release')
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(404);
    });

    it('returns 404 when versionId does not belong to the app', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: '00000000-0000-0000-0000-000000000002' })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  // ---------------------------------------------------------------------------
  // 400 — validation
  // ---------------------------------------------------------------------------

  describe('400 — validation', () => {
    it('returns 400 when the targeted versionId is a draft', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const draft = await seedVersion(app as any, 'v1', AppVersionStatus.DRAFT);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: draft.id })
        .expect(400);

      expect(response.body.message).toContain('draft');
    });

    it('returns 400 when versionName does not match any version', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionName: 'does-not-exist' })
        .expect(400);
    });

    it('returns 400 when the targeted versionName is a draft', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const draft = await seedVersion(app as any, 'v1', AppVersionStatus.DRAFT);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionName: draft.name })
        .expect(400);
    });

    it('returns 400 when neither versionId nor versionName is given and the app has no git sync configured', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(400);

      expect(response.body.message).toBe('App is not synced with Git');
    });
  });

  // ---------------------------------------------------------------------------
  // 201 — happy path
  // ---------------------------------------------------------------------------

  describe('201 — happy path', () => {
    it('deploys the version by versionId to the production environment', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);
      const prodEnv = await prodEnvFor(organization.id);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: version.id })
        .expect(201);

      expect(response.body.currentVersionId).toBe(version.id);

      const updatedVersion = await versionRepo.findOne({ where: { id: version.id } });
      expect(updatedVersion.status).toBe(AppVersionStatus.PUBLISHED);
      expect(updatedVersion.currentEnvironmentId).toBe(prodEnv.id);
    });

    it('deploys the version by versionName', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);
      const prodEnv = await prodEnvFor(organization.id);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionName: version.name })
        .expect(201);

      expect(response.body.currentVersionId).toBe(version.id);

      const updatedVersion = await versionRepo.findOne({ where: { id: version.id } });
      expect(updatedVersion.currentEnvironmentId).toBe(prodEnv.id);
    });

    it('resolves app by slug', async () => {
      const { user } = await seedOrg();
      const slug = `my-app-${Date.now()}`;
      const app = await createApplication(nestApp, { user, name: `App-${Date.now()}`, isPublic: false, slug });
      const version = await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${slug}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: version.id })
        .expect(201);

      expect(response.body.currentVersionId).toBe(version.id);
    });

    it('resolves app by slug when versionName is also given', async () => {
      const { user } = await seedOrg();
      const slug = `my-app-${Date.now()}`;
      const app = await createApplication(nestApp, { user, name: `App-${Date.now()}`, isPublic: false, slug });
      const version = await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${slug}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionName: version.name })
        .expect(201);

      expect(response.body.currentVersionId).toBe(version.id);
    });

    it('updates the app row currentVersionId in the database', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: version.id })
        .expect(201);

      const updatedApp = await appRepo.findOne({ where: { id: app.id } });
      expect(updatedApp.currentVersionId).toBe(version.id);
    });

    it('does not affect other versions on the same app', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const target = await seedVersion(app as any, 'v2', AppVersionStatus.PUBLISHED);
      const other = await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);
      const otherEnvBefore = other.currentEnvironmentId;

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: target.id })
        .expect(201);

      const reloadedOther = await versionRepo.findOne({ where: { id: other.id } });
      expect(reloadedOther.currentEnvironmentId).toBe(otherEnvBefore);
      expect(reloadedOther.status).toBe(AppVersionStatus.PUBLISHED);
    });

    it('redeploying an already-published version succeeds and keeps it PUBLISHED', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedVersion(app as any, 'v1', AppVersionStatus.PUBLISHED);
      const prodEnv = await prodEnvFor(organization.id);
      await versionRepo.update(version.id, { currentEnvironmentId: prodEnv.id });

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: version.id })
        .expect(201);

      const updatedVersion = await versionRepo.findOne({ where: { id: version.id } });
      expect(updatedVersion.status).toBe(AppVersionStatus.PUBLISHED);
      expect(updatedVersion.currentEnvironmentId).toBe(prodEnv.id);
    });
  });
});
