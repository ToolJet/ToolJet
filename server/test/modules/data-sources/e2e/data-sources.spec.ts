import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createUser,
  initTestApp,
  closeTestApp,
  createDataSource,
  createDataSourceOption,
  createApplicationVersion,
  createApplication,
  ensureAppEnvironments,
  getAllEnvironments,
  createAppWithDependencies,
  login,
  updateEntity,
} from 'test-helper';
import { DataSource } from 'src/entities/data_source.entity';

/** @group platform */
describe('DataSourcesController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('EE (plan: enterprise)', () => {
    describe('POST /api/data-sources | Create data source', () => {
      it('should allow admin to create a data source', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        await ensureAppEnvironments(nestApp, adminUserData.organization.id);

        const loggedUser = await login(nestApp, adminUserData.user.email);

        const response = await request(nestApp.getHttpServer())
          .post('/api/data-sources')
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ name: 'test_data_source', kind: 'restapi', options: [] });

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
          name: 'test_data_source',
          kind: 'restapi',
          organizationId: adminUserData.organization.id,
        });
      });

      it('should not allow unauthenticated users to create data sources', async () => {
        const response = await request(nestApp.getHttpServer())
          .post('/api/data-sources')
          .send({ name: 'test_data_source', kind: 'restapi', options: [] });

        expect(response.statusCode).toBe(401);
      });
    });

    describe('GET /api/data-sources/:organizationId | List data sources', () => {
      it('should allow admin to list data sources', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        await ensureAppEnvironments(nestApp, adminUserData.organization.id);

        const loggedUser = await login(nestApp, adminUserData.user.email);

        // Create a data source via the API so it has the correct organizationId
        await request(nestApp.getHttpServer())
          .post('/api/data-sources')
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ name: 'list_test_data_source', kind: 'restapi', options: [] });

        const response = await request(nestApp.getHttpServer())
          .get(`/api/data-sources/${adminUserData.organization.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
        expect(response.body.data_sources).toBeDefined();
        expect(Array.isArray(response.body.data_sources)).toBe(true);

        const found = response.body.data_sources.find(
          (ds: any) => ds.name === 'list_test_data_source'
        );
        expect(found).toBeDefined();
      });

      it('should not allow user from another org to list data sources', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const anotherOrgAdminUserData = await createUser(nestApp, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const loggedAnotherUser = await login(nestApp, anotherOrgAdminUserData.user.email);

        // Try to list data sources for admin's org using another org's user
        const response = await request(nestApp.getHttpServer())
          .get(`/api/data-sources/${adminUserData.organization.id}`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedAnotherUser.tokenCookie);

        // OrganizationValidateGuard rejects cross-org access
        expect(response.statusCode).toBe(403);
      });
    });

    describe('PUT /api/data-sources/:id | Update data source', () => {
      it('should allow admin to update a data source', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        await ensureAppEnvironments(nestApp, adminUserData.organization.id);

        const loggedUser = await login(nestApp, adminUserData.user.email);

        // Create a data source via the API
        const createResponse = await request(nestApp.getHttpServer())
          .post('/api/data-sources')
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ name: 'update_test_data_source', kind: 'restapi', options: [] });

        const dataSourceId = createResponse.body.id;

        // Get default environment for environment_id query param
        const environments = await getAllEnvironments(nestApp, adminUserData.organization.id);
        const defaultEnv = environments.find((e: any) => e.isDefault) || environments[0];

        const response = await request(nestApp.getHttpServer())
          .put(`/api/data-sources/${dataSourceId}?environment_id=${defaultEnv.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ name: 'updated_data_source_name', options: [] });

        expect(response.statusCode).toBe(200);
      });

      it('should not allow user from another org to update', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        // Note: createAppWithDependencies below creates app which seeds environments
        const anotherOrgAdminUserData = await createUser(nestApp, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        // Create data source using createAppWithDependencies, then set organizationId
        const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
          isQueryNeeded: false,
        });
        await updateEntity(DataSource, dataSource.id, {
          organizationId: adminUserData.organization.id,
        });

        const loggedAnotherUser = await login(nestApp, anotherOrgAdminUserData.user.email);

        const response = await request(nestApp.getHttpServer())
          .put(`/api/data-sources/${dataSource.id}`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedAnotherUser.tokenCookie)
          .send({ name: 'hacked_name' });

        // Cross-org access is rejected with a clean 404 (data source not found for
        // this org) — previously an uncaught EntityNotFoundError crashed with a 500.
        expect(response.statusCode).toBe(404);
      });
    });

    describe('DELETE /api/data-sources/:id | Delete data source', () => {
      it('should allow admin to delete a data source', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        await ensureAppEnvironments(nestApp, adminUserData.organization.id);

        const loggedUser = await login(nestApp, adminUserData.user.email);

        // Create a data source via the API
        const createResponse = await request(nestApp.getHttpServer())
          .post('/api/data-sources')
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ name: 'delete_test_data_source', kind: 'restapi', options: [] });

        const dataSourceId = createResponse.body.id;

        const response = await request(nestApp.getHttpServer())
          .delete(`/api/data-sources/${dataSourceId}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
      });

      it('should not allow user from another org to delete', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        // Note: createAppWithDependencies below creates app which seeds environments
        const anotherOrgAdminUserData = await createUser(nestApp, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
          isQueryNeeded: false,
        });
        await updateEntity(DataSource, dataSource.id, {
          organizationId: adminUserData.organization.id,
        });

        const loggedAnotherUser = await login(nestApp, anotherOrgAdminUserData.user.email);

        const response = await request(nestApp.getHttpServer())
          .delete(`/api/data-sources/${dataSource.id}`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedAnotherUser.tokenCookie);

        // Cross-org access is rejected with a clean 404 (data source not found for
        // this org) — previously an uncaught EntityNotFoundError crashed with a 500.
        expect(response.statusCode).toBe(404);
      });
    });

    describe('POST /api/data-sources/:id/authorize_oauth2 | OAuth2 authorization', () => {
      it('should not be able to authorize OAuth code for a REST API source if user of another organization', async () => {
        const adminUserData = await createUser(nestApp, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const anotherOrgAdminUserData = await createUser(nestApp, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const { dataSource } = await createAppWithDependencies(nestApp, adminUserData.user, {
          isQueryNeeded: false,
        });

        // Set organizationId on data source so ValidateDataSourceGuard can find it
        await updateEntity(DataSource, dataSource.id, {
          organizationId: adminUserData.organization.id,
        });

        const loggedUser = await login(nestApp, anotherOrgAdminUserData.user.email);

        // Should not update if user of another org
        const response = await request(nestApp.getHttpServer())
          .post(`/api/data-sources/${dataSource.id}/authorize_oauth2`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({
            code: 'oauth-auth-code',
          });

        // Cross-org access is rejected with a clean 404 (data source not found for
        // this org) — previously an uncaught EntityNotFoundError crashed with a 500.
        expect(response.statusCode).toBe(404);
      });
    });
  });
});
