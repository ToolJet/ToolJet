import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createUser,
  initTestApp,
  closeTestApp,
  login,
  saveEntity,
  getDefaultDataSource,
  getTooljetDbDataSource,
} from 'test-helper';
import { DataSource } from 'src/entities/data_source.entity';
import { AppVersion } from 'src/entities/app_version.entity';

/** Create the built-in static data sources that templates expect to exist. */
async function createDefaultDataSources(organizationId: string) {
  const kinds = ['restapi', 'runjs', 'runpy', 'tooljetdb', 'workflows'];
  for (const kind of kinds) {
    await saveEntity(DataSource, {
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

/** @group platform */
describe('LibraryAppsController', () => {
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

  describe('POST /api/library_apps | Create from template', () => {
    it('should be able to create app if user has app create permission', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['end-user', 'admin'],
      });

      const organization = adminUserData.organization;
      const nonAdminUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['end-user'],
        organization,
      });

      let loggedUser = await login(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await login(app, 'developer@tooljet.io');
      nonAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      // Templates expect built-in static data sources to exist in the organization
      await createDefaultDataSources(adminUserData.organization.id);

      // Every template creates ToolJet DB tables, which live in the workspace's own schema. Test setup doesn't
      // create it, and a failed table create aborts the suite transaction for every later test in this file.
      // The ToolJet DB connection runs in the suite transaction too, so the schema is rolled back with the test.
      const tooljetDb = getTooljetDbDataSource();
      expect(tooljetDb).toBeDefined();
      await tooljetDb.query(`CREATE SCHEMA IF NOT EXISTS "workspace_${adminUserData.organization.id}"`);

      const createFromTemplate = (tokenCookie: string[], appName: string) =>
        request(app.getHttpServer())
          .post('/api/library_apps')
          // Use personal-task-list: the smallest template (one ToolJet DB table, no foreign keys, no jsonb)
          .send({ identifier: 'personal-task-list', appName, dependentPlugins: [] })
          .set('tj-workspace-id', adminUserData.organization.id)
          .set('Cookie', tokenCookie);

      const nonAdminResponse = await createFromTemplate(nonAdminUserData['tokenCookie'], 'Personal Task List App');
      expect(nonAdminResponse.statusCode).toBe(403);

      const adminResponse = await createFromTemplate(adminUserData['tokenCookie'], 'Personal Task List App');
      expect(adminResponse.statusCode).toBe(201);

      // apps.name stays null; the app's name lives on its versions
      const appId = adminResponse.body.app[0].id;
      const version = await getDefaultDataSource().manager.findOneOrFail(AppVersion, { where: { appId } });
      expect(version.appName).toBe('Personal Task List App');
    });

    it('should return error if template identifier is not found', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['end-user', 'admin'],
      });

      const loggedUser = await login(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post('/api/library_apps')
        .send({ identifier: 'non-existent-template', appName: 'Non existent template' })
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie']);

      expect(response.body).toMatchObject({
        message: 'App definition not found',
        path: '/api/library_apps',
        statusCode: 400,
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/library_apps | List templates', () => {
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

      let loggedUser = await login(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await login(app, superAdminUserData.user.email, 'password', adminUserData.organization.id);
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(app.getHttpServer())
        .get('/api/library_apps')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie']);

      expect(response.statusCode).toBe(200);

      let templateAppIds = response.body['template_app_manifests'].map((manifest) => manifest.id);

      expect(new Set(templateAppIds)).toContain('major-incident-management');
      expect(new Set(templateAppIds)).toContain('status-page');

      response = await request(app.getHttpServer())
        .get('/api/library_apps')
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie']);

      expect(response.statusCode).toBe(200);

      templateAppIds = response.body['template_app_manifests'].map((manifest) => manifest.id);

      expect(new Set(templateAppIds)).toContain('major-incident-management');
      expect(new Set(templateAppIds)).toContain('status-page');
    });
  });
});
