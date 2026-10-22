import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, closeTestApp, createAppWithDependencies, login } from 'test-helper';

/** @group platform */
describe('DataQueriesController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  describe('GET /api/data-queries/:versionId | List queries', () => {
    it("should return 404 for another workspace's app version instead of its query list", async () => {
      const adminUserData = await createUser(app, { email: 'admin@tooljet.io', groups: ['all_users', 'admin'] });
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const { tokenCookie } = await login(app, anotherOrgAdminUserData.user.email);
      const { appVersion } = await createAppWithDependencies(app, adminUserData.user, {});

      const response = await request(app.getHttpServer())
        .get(`/api/data-queries/${appVersion.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', tokenCookie);

      expect(response.statusCode).toBe(404);
    });
  });
});
