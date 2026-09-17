import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createApplication, createApplicationVersion, createUser, initTestApp, closeTestApp } from 'test-helper';

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
  });
});
