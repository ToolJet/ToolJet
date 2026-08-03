import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  createApplication,
  createApplicationVersion,
  createUser,
  initTestApp,
  closeTestApp,
  updateEntity,
} from 'test-helper';
import { AppVersion } from 'src/entities/app_version.entity';

/** @group platform */
describe('AppEnvironmentsController', () => {
  describe('GET /api/app-environments/:id', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('allows unauthenticated access to an environment when the requesting app is public', async () => {
      const { user } = await createUser(app, {});
      const publicApp = await createApplication(app, { name: 'Public App', user, isPublic: true });
      const version = await createApplicationVersion(app, publicApp);

      const response = await request(app.getHttpServer())
        .get(`/api/app-environments/${version.currentEnvironmentId}`)
        .query({ slug: version.slug });

      expect(response.statusCode).toBe(200);
      expect(response.body.environment.id).toBe(version.currentEnvironmentId);
    });

    it('resolves the current (public) app_version row when a stale duplicate row shares the same slug', async () => {
      // Regression: git-sync workspaces can end up with more than one app_versions row
      // carrying the same slug for the same app (e.g. a stale pre-migration row alongside
      // the current default-branch row). PublicAppEnvironmentGuard's fallback query (used
      // when no branch_id is supplied) has no ORDER BY, so it can non-deterministically
      // pick the stale row instead of the current one.
      const { user } = await createUser(app, {});
      const sharedSlug = uuidv4();
      const publicApp = await createApplication(app, { name: 'Public App', user, isPublic: true, slug: sharedSlug });

      // Stale row: created first, not public.
      const staleVersion = await createApplicationVersion(app, publicApp, { name: 'stale' });
      await updateEntity(AppVersion, staleVersion.id, { isPublic: false, slug: sharedSlug });

      // Current row: created after, public — this is the one that should win.
      const currentVersion = await createApplicationVersion(app, publicApp, { name: 'current' });
      await updateEntity(AppVersion, currentVersion.id, { isPublic: true, slug: sharedSlug });

      const response = await request(app.getHttpServer())
        .get(`/api/app-environments/${currentVersion.currentEnvironmentId}`)
        .query({ slug: sharedSlug });

      expect(response.statusCode).toBe(200);
      expect(response.body.environment.id).toBe(currentVersion.currentEnvironmentId);
    });
  });
});
