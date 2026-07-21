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
import { SourceControlProviderService } from '@ee/app-git/source-control-provider';
import { Repository } from 'typeorm';

/**
 * External API — POST /ext/apps/:appIdOrSlug/versions/save
 *
 * Transitions the app's single DRAFT version to PUBLISHED, with an optional rename.
 * Tested cases:
 *   - Auth: missing header, wrong token
 *   - 404: app not found, no versions at all
 *   - 409: version already saved
 *   - 201 happy path: no rename, with rename, by slug
 *   - 400: name exceeds max length
 *   - End-to-end: save then release chain
 */

/** @group platform */
describe('External API — POST /ext/apps/:appIdOrSlug/versions/save', () => {
  // AUTH_HEADER is resolved from ConfigService after boot — getEnvVars() merges
  // .env.test over process.env, so the effective token is whatever .env.test declares.
  let AUTH_HEADER: string;

  let nestApp: INestApplication;
  let versionRepo: Repository<AppVersion>;
  let envRepo: Repository<AppEnvironment>;

  beforeAll(async () => {
    process.env.ENABLE_EXTERNAL_API = 'true';
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));

    const configService = nestApp.get<ConfigService>(ConfigService);
    AUTH_HEADER = `Basic ${configService.get('EXTERNAL_API_ACCESS_TOKEN')}`;

    const ds = getDefaultDataSource();
    versionRepo = ds.getRepository(AppVersion);
    envRepo = ds.getRepository(AppEnvironment);
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

  // Use createApplicationVersion (handles all required columns correctly) then
  // patch just the status field — avoids the module_reference_id column issue.
  async function seedDraftVersion(app: App & { organizationId: string }, name = 'v1'): Promise<AppVersion | null> {
    const version = await createApplicationVersion(nestApp, app, { name });
    await versionRepo.update(version.id, { status: AppVersionStatus.DRAFT });
    return versionRepo.findOne({ where: { id: version.id } });
  }

  async function seedPublishedVersion(
    app: App & { organizationId: string },
    name = 'v1-pub'
  ): Promise<AppVersion | null> {
    const version = await createApplicationVersion(nestApp, app, { name });
    await versionRepo.update(version.id, { status: AppVersionStatus.PUBLISHED });
    return versionRepo.findOne({ where: { id: version.id } });
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  describe('auth', () => {
    it('returns 403 when Authorization header is missing', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);

      await request(nestApp.getHttpServer()).post(`/api/ext/apps/${app.id}/versions/save`).send({}).expect(403);
    });

    it('returns 403 when Authorization header has wrong token', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
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
        .post(`/api/ext/apps/${nonExistentId}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(404);
    });

    it('returns 404 when app has no versions at all', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // 409 — already saved
  // ---------------------------------------------------------------------------

  describe('409 — already saved', () => {
    it('returns 409 when the only version is already PUBLISHED', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      await seedPublishedVersion(app as any, 'v1');

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(409);

      expect(response.body.message).toBe('Version is already saved');
    });
  });

  // ---------------------------------------------------------------------------
  // 400 — validation
  // ---------------------------------------------------------------------------

  describe('400 — validation', () => {
    it('returns 400 when name exceeds 25 characters', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      await seedDraftVersion(app as any, 'v1');

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'a'.repeat(26) })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // 201 — happy path
  // ---------------------------------------------------------------------------

  describe('201 — happy path', () => {
    it('saves the DRAFT version to PUBLISHED, targeting the development environment', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      const draft = await seedDraftVersion(app as any, 'v1');

      const devEnv = await envRepo.findOne({
        where: { organizationId: organization.id },
        order: { priority: 'ASC' },
      });

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      expect(response.body.id).toBe(draft.id);
      expect(response.body.status).toBe(AppVersionStatus.PUBLISHED);
      expect(response.body.currentEnvironmentId).toBe(devEnv.id);
      expect(response.body.appId).toBe(app.id);
    });

    it('renames the DRAFT version when name is provided', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      await seedDraftVersion(app as any, 'v1');

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'release-1.0.0' })
        .expect(201);

      expect(response.body.status).toBe(AppVersionStatus.PUBLISHED);
      expect(response.body.name).toBe('release-1.0.0');
    });

    it('accepts name at exactly 25 characters (boundary)', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      await seedDraftVersion(app as any, 'v1');

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'a'.repeat(25) })
        .expect(201);

      expect(response.body.status).toBe(AppVersionStatus.PUBLISHED);
      expect(response.body.name).toBe('a'.repeat(25));
    });

    it('resolves app by slug', async () => {
      const { user } = await seedOrg();
      const slug = `my-app-${Date.now()}`;
      const appRepo: Repository<App> = getDefaultDataSource().getRepository(App);
      const app = await createApplication(nestApp, { user, name: `App-${Date.now()}`, isPublic: false, slug });
      await seedDraftVersion(app as any, 'v1');

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${slug}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      expect(response.body.status).toBe(AppVersionStatus.PUBLISHED);
    });

    it('persists the status change in the database', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const draft = await seedDraftVersion(app as any, 'v1');

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      const updated = await versionRepo.findOne({ where: { id: draft.id } });
      expect(updated.status).toBe(AppVersionStatus.PUBLISHED);
    });

    it('does not affect other versions on the same app', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const draft = await seedDraftVersion(app as any, 'v1');
      const published = await seedPublishedVersion(app as any, 'v0');

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      // The pre-existing published version must remain untouched
      const reloadedPublished = await versionRepo.findOne({ where: { id: published.id } });
      expect(reloadedPublished.status).toBe(AppVersionStatus.PUBLISHED);

      // Draft is now published
      const reloadedDraft = await versionRepo.findOne({ where: { id: draft.id } });
      expect(reloadedDraft.status).toBe(AppVersionStatus.PUBLISHED);
    });

    it('persists currentEnvironmentId to the development environment in the database', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      const draft = await seedDraftVersion(app as any, 'v1');

      const devEnv = await envRepo.findOne({
        where: { organizationId: organization.id },
        order: { priority: 'ASC' },
      });

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      const updated = await versionRepo.findOne({ where: { id: draft.id } });
      expect(updated.currentEnvironmentId).toBe(devEnv.id);
    });
  });

  // ---------------------------------------------------------------------------
  // Git tag creation
  // ---------------------------------------------------------------------------

  describe('git tag creation', () => {
    it('creates a git tag when git sync is configured for the app', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      await seedDraftVersion(app as any, 'v1');

      const scProvider = nestApp.get(SourceControlProviderService);
      const mockStrategy = { createGitTag: jest.fn().mockResolvedValue({ success: true, tagName: 'co_rel/v1' }) };
      jest.spyOn(scProvider, 'getSourceControlService').mockResolvedValue(mockStrategy as any);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      expect(mockStrategy.createGitTag).toHaveBeenCalledWith(
        app.id,
        expect.any(String),
        expect.objectContaining({ id: expect.any(String) }),
        expect.any(String)
      );
    });

    it('returns 201 and persists the save even when git tag creation throws', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const draft = await seedDraftVersion(app as any, 'v1');

      const scProvider = nestApp.get(SourceControlProviderService);
      const mockStrategy = { createGitTag: jest.fn().mockRejectedValue(new Error('git connection failed')) };
      jest.spyOn(scProvider, 'getSourceControlService').mockResolvedValue(mockStrategy as any);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      const updated = await versionRepo.findOne({ where: { id: draft.id } });
      expect(updated.status).toBe(AppVersionStatus.PUBLISHED);
    });

    it('returns 201 when no git sync is configured (getSourceControlService throws)', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const draft = await seedDraftVersion(app as any, 'v1');

      const scProvider = nestApp.get(SourceControlProviderService);
      jest
        .spyOn(scProvider, 'getSourceControlService')
        .mockRejectedValue(new Error('No Git Provider is enabled for the workspace'));

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      const updated = await versionRepo.findOne({ where: { id: draft.id } });
      expect(updated.status).toBe(AppVersionStatus.PUBLISHED);
    });
  });
});
