import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance, authenticateUser } from '../test.helper';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'src/entities/data_source.entity';

/** Create the built-in static data sources that templates expect to exist. */
async function createDefaultDataSources(ds: TypeOrmDataSource, organizationId: string) {
  const kinds = ['restapi', 'runjs', 'runpy', 'tooljetdb', 'workflows'];
  for (const kind of kinds) {
    await ds.manager.save(DataSource, {
      name: `${kind}default`,
      kind,
      scope: 'global',
      organizationId,
      type: 'static',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }
}

describe('library apps controller', () => {
  let app: INestApplication;
  let defaultDataSource: TypeOrmDataSource;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
    defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
  });

  describe('POST /api/library_apps', () => {
    it('should be able to create app if user has app create permission or has instance user type', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['end-user', 'admin'],
      });

      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['end-user', 'admin'],
        userType: 'instance',
      });

      const organization = adminUserData.organization;
      const nonAdminUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['end-user'],
        organization,
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      nonAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.organization.id
      );
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      // Templates expect built-in static data sources to exist in the organization
      await createDefaultDataSources(defaultDataSource, adminUserData.organization.id);

      // Use json-formatter template (no ToolJet DB tables) to avoid QueryRunner
      // issues in the test environment
      let response = await request(app.getHttpServer())
        .post('/api/library_apps')
        .send({ identifier: 'json-formatter', appName: 'JSON Formatter App', dependentPlugins: [] })
        .set('tj-workspace-id', nonAdminUserData.user.defaultOrganizationId)
        .set('Cookie', nonAdminUserData['tokenCookie']);

      expect(response.statusCode).toBe(403);

      response = await request(app.getHttpServer())
        .post('/api/library_apps')
        .send({ identifier: 'json-formatter', appName: 'JSON Formatter App', dependentPlugins: [] })
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie']);

      expect(response.statusCode).toBe(201);
      expect(response.body.app[0].name).toContain('JSON Formatter App');
    });

    it('should return error if template identifier is not found', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['end-user', 'admin'],
      });

      const loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post('/api/library_apps')
        .send({ identifier: 'non-existent-template', appName: 'Non existent template' })
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie']);

      const { timestamp, ...restBody } = response.body;

      expect(timestamp).toBeDefined();
      expect(restBody).toEqual({
        message: 'App definition not found',
        path: '/api/library_apps',
        statusCode: 400,
      });
    });
  });

  describe('GET /api/library_apps', () => {
    it('should be get app manifests', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['end-user', 'admin'],
      });

      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['end-user', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.organization.id
      );
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(app.getHttpServer())
        .get('/api/library_apps')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie']);

      expect(response.statusCode).toBe(200);

      let templateAppIds = response.body['template_app_manifests'].map((manifest) => manifest.id);

      expect(new Set(templateAppIds)).toContain('release-notes');
      expect(new Set(templateAppIds)).toContain('bug-tracker');

      response = await request(app.getHttpServer())
        .get('/api/library_apps')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie']);

      expect(response.statusCode).toBe(200);

      templateAppIds = response.body['template_app_manifests'].map((manifest) => manifest.id);

      expect(new Set(templateAppIds)).toContain('release-notes');
      expect(new Set(templateAppIds)).toContain('bug-tracker');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
