import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createUser,
  createAppWithDependencies,
  initTestApp,
  closeTestApp,
  login,
  logout,
  findEntityOrFail,
} from 'test-helper';
import { DataQuery } from 'src/entities/data_query.entity';

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
    // The bulk route authorizes the app in the URL but updates the query ids in the body.
    // It must reject any query that does not belong to the URL's version, otherwise edit
    // access to one app leaks into editing another app's queries (IDOR). This invariant is
    // edition-agnostic, so it is pinned here in CE with an admin and two apps.
    const seedTwoApps = async (suffix: string) => {
      const adminUserData = await createUser(app, {
        email: `admin-bulk-${suffix}@tooljet.io`,
        groups: ['all_users', 'admin'],
      });
      const orgId = adminUserData.organization.id;

      const { appVersion: versionA, dataQuery: queryA } = await createAppWithDependencies(app, adminUserData.user, {
        name: `app-a-${suffix}`,
      });
      const { appVersion: versionB, dataQuery: queryB } = await createAppWithDependencies(app, adminUserData.user, {
        name: `app-b-${suffix}`,
      });

      const { tokenCookie } = await login(app, adminUserData.user.email, 'password', orgId);

      return { orgId, versionA, queryA, versionB, queryB, tokenCookie };
    };

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

    it("rejects updating a query that belongs to a different version than the URL's", async () => {
      const { orgId, versionA, versionB, queryB, tokenCookie } = await seedTwoApps('idor');

      const originalOptions = (await findEntityOrFail(DataQuery, { id: queryB.id } as any)).options;
      const foreignOptions = { mode: 'sql', query: 'SELECT current_user' };

      // URL = version A, body = version B's query: must be rejected.
      const response = await request(app.getHttpServer())
        .patch(`/api/data-queries/versions/${versionA.id}`)
        .set('tj-workspace-id', orgId)
        .set('Cookie', tokenCookie)
        .send({
          app_version_id: versionA.id,
          data_queries_options: [{ id: queryB.id, options: foreignOptions }],
        });

      expect(response.statusCode).toBe(403);

      // Version B's query must be unchanged.
      const persisted = await findEntityOrFail(DataQuery, { id: queryB.id } as any);
      expect(persisted.appVersionId).toBe(versionB.id);
      expect(persisted.options).toEqual(originalOptions);
      expect(persisted.options).not.toMatchObject(foreignOptions);
    });

    it("allows updating a query that belongs to the URL's version", async () => {
      const { orgId, versionA, queryA, tokenCookie } = await seedTwoApps('legit');

      const newOptions = { ...((queryA.options as object) || {}), url_params: [['sort', 'created']] };

      const response = await request(app.getHttpServer())
        .patch(`/api/data-queries/versions/${versionA.id}`)
        .set('tj-workspace-id', orgId)
        .set('Cookie', tokenCookie)
        .send({
          app_version_id: versionA.id,
          data_queries_options: [{ id: queryA.id, options: newOptions }],
        });

      expect(response.statusCode).toBe(200);

      const persisted = await findEntityOrFail(DataQuery, { id: queryA.id } as any);
      expect(persisted.options).toMatchObject(newOptions);
    });
  });
});
