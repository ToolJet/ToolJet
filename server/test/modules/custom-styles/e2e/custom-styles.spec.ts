import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createUser, createApplication, createApplicationVersion } from 'test-helper';

/**
 * GET /api/custom-styles/:slug — regression test for a DI wiring gap in CustomStylesModule
 * (it never imported AppsModule, so AppAuthGuard's injected AppsUtilService was undefined).
 * That crashed with a 500 ("Cannot read properties of undefined (reading
 * 'getAppOrganizationDetails')") instead of a clean 401 whenever an unauthenticated request
 * hit a non-public app — i.e. any public-viewer request on an app that isn't (yet) public.
 */
describe('CustomStylesController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('returns 401, not 500, for an unauthenticated request against a non-public app', async () => {
      const { user } = await createUser(app, { email: 'custom-styles-guard@tooljet.io' });
      const application = await createApplication(app, { name: 'private-app', isPublic: false, user } as any);
      const version = await createApplicationVersion(app, application as any);

      const response = await request(app.getHttpServer()).get(`/api/custom-styles/${version.slug}`);

      expect(response.statusCode).toBe(401);
    });
  });
});
