import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, createAppWithDependencies, initTestApp, closeTestApp, login, logout } from 'test-helper';

/** @group platform */
describe('DataQueriesController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  describe('PATCH /api/data-queries/versions/:versionId | Bulk update query options', () => {
    // Regression: a public app must not let a no-permission member rewrite its query options.
    it('should return 403 for a viewer bulk-updating query options of a PUBLIC app', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['all_users', 'viewer'],
        organization: adminUserData.organization,
      });

      const { appVersion, dataQuery } = await createAppWithDependencies(app, adminUserData.user, {
        isAppPublic: true,
      });

      const loggedViewer = await login(app, viewerUserData.user.email);

      const response = await request(app.getHttpServer())
        .patch(`/api/data-queries/versions/${appVersion.id}`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', loggedViewer.tokenCookie)
        .send({
          data_queries_options: [{ id: dataQuery.id, options: { query: 'SELECT 1', mode: 'sql' } }],
        });

      expect(response.statusCode).toBe(403);

      await logout(app, loggedViewer.tokenCookie, viewerUserData.user.defaultOrganizationId);
    });
  });
});
