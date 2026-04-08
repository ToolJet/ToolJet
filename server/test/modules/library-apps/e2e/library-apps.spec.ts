import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, closeTestApp, login, saveEntity } from 'test-helper';
import { DataSource } from 'src/entities/data_source.entity';

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
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  describe('EE (plan: enterprise)', () => {
    describe('POST /api/library_apps | Create from template', () => {
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

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'developer@tooljet.io');
        nonAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(
          app,
          superAdminUserData.user.email,
          'password',
          adminUserData.organization.id
        );
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        // Templates expect built-in static data sources to exist in the organization
        await createDefaultDataSources(adminUserData.organization.id);

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

        loggedUser = await login(
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
  });
});
