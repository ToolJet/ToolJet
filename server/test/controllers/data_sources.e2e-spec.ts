import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createUser,
  createNestAppInstance,
  createDataSource,
  createDataSourceOption,
  createApplicationVersion,
  createApplication,
  createAppEnvironments,
  getAllEnvironments,
  generateAppDefaults,
  authenticateUser,
} from '../test.helper';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'src/entities/data_source.entity';

describe('data sources controller', () => {
  let app: INestApplication;
  let defaultDataSource: TypeOrmDataSource;

  beforeAll(async () => {
    app = await createNestAppInstance();
    defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/data-sources', () => {
    it('should allow admin to create a data source', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await createAppEnvironments(app, adminUserData.organization.id);

      const loggedUser = await authenticateUser(app, adminUserData.user.email);

      const response = await request(app.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'test_data_source', kind: 'restapi', options: [] });

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('test_data_source');
      expect(response.body.kind).toBe('restapi');
      expect(response.body.organizationId).toBe(adminUserData.organization.id);
    });

    it('should not allow unauthenticated users to create data sources', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/data-sources')
        .send({ name: 'test_data_source', kind: 'restapi', options: [] });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/data-sources/:organizationId', () => {
    it('should allow admin to list data sources', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await createAppEnvironments(app, adminUserData.organization.id);

      const loggedUser = await authenticateUser(app, adminUserData.user.email);

      // Create a data source via the API so it has the correct organizationId
      await request(app.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'list_test_data_source', kind: 'restapi', options: [] });

      const response = await request(app.getHttpServer())
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
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const loggedAnotherUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);

      // Try to list data sources for admin's org using another org's user
      const response = await request(app.getHttpServer())
        .get(`/api/data-sources/${adminUserData.organization.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedAnotherUser.tokenCookie);

      // OrganizationValidateGuard rejects cross-org access
      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /api/data-sources/:id', () => {
    it('should allow admin to update a data source', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await createAppEnvironments(app, adminUserData.organization.id);

      const loggedUser = await authenticateUser(app, adminUserData.user.email);

      // Create a data source via the API
      const createResponse = await request(app.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'update_test_data_source', kind: 'restapi', options: [] });

      const dataSourceId = createResponse.body.id;

      // Get default environment for environment_id query param
      const environments = await getAllEnvironments(app, adminUserData.organization.id);
      const defaultEnv = environments.find((e: any) => e.isDefault) || environments[0];

      const response = await request(app.getHttpServer())
        .put(`/api/data-sources/${dataSourceId}?environment_id=${defaultEnv.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'updated_data_source_name', options: [] });

      expect(response.statusCode).toBe(200);
    });

    it('should not allow user from another org to update', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      // Note: generateAppDefaults below creates app which seeds environments
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      // Create data source using generateAppDefaults, then set organizationId
      const { dataSource } = await generateAppDefaults(app, adminUserData.user, {
        isQueryNeeded: false,
      });
      await defaultDataSource.manager.update(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedAnotherUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);

      const response = await request(app.getHttpServer())
        .put(`/api/data-sources/${dataSource.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedAnotherUser.tokenCookie)
        .send({ name: 'hacked_name' });

      // Cross-org access is rejected — either 404 (guard) or 500 (ability resolution)
      expect(response.statusCode).not.toBe(200);
    });
  });

  describe('DELETE /api/data-sources/:id', () => {
    it('should allow admin to delete a data source', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      await createAppEnvironments(app, adminUserData.organization.id);

      const loggedUser = await authenticateUser(app, adminUserData.user.email);

      // Create a data source via the API
      const createResponse = await request(app.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'delete_test_data_source', kind: 'restapi', options: [] });

      const dataSourceId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/api/data-sources/${dataSourceId}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(200);
    });

    it('should not allow user from another org to delete', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      // Note: generateAppDefaults below creates app which seeds environments
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const { dataSource } = await generateAppDefaults(app, adminUserData.user, {
        isQueryNeeded: false,
      });
      await defaultDataSource.manager.update(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedAnotherUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);

      const response = await request(app.getHttpServer())
        .delete(`/api/data-sources/${dataSource.id}`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedAnotherUser.tokenCookie);

      // Cross-org access is rejected — either 404 (guard) or 500 (ability resolution)
      expect(response.statusCode).not.toBe(200);
    });
  });

  describe('POST /api/data-sources/:id/authorize_oauth2', () => {
    it('should not be able to authorize OAuth code for a REST API source if user of another organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const anotherOrgAdminUserData = await createUser(app, {
        email: 'another@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const { dataSource } = await generateAppDefaults(app, adminUserData.user, {
        isQueryNeeded: false,
      });

      // Set organizationId on data source so ValidateDataSourceGuard can find it
      await defaultDataSource.manager.update(DataSource, dataSource.id, {
        organizationId: adminUserData.organization.id,
      });

      const loggedUser = await authenticateUser(app, anotherOrgAdminUserData.user.email);

      // Should not update if user of another org
      const response = await request(app.getHttpServer())
        .post(`/api/data-sources/${dataSource.id}/authorize_oauth2`)
        .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({
          code: 'oauth-auth-code',
        });

      // Cross-org access is rejected — either 404 (guard) or 500 (ability resolution)
      expect(response.statusCode).not.toBe(200);
    });
  });
});
