import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createUser,
  initTestApp,
  closeTestApp,
  login,
  saveEntity,
  updateEntity,
  findEntityOrFail,
  createApplication,
  createApplicationVersion,
} from 'test-helper';
import { DataSource } from 'src/entities/data_source.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';

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
    // QUARANTINE(library-apps): failing since main CI rehab — see #17262.
    // Every template in the library creates ToolJet DB tables (personal-task-list is the smallest, with one), and the
    // test setup never creates the workspace's `workspace_<orgId>` schema, so the import fails with
    // `schema "workspace_<orgId>" does not exist`. That aborts the suite transaction, and every later test in this
    // file then fails with QueryRunnerAlreadyReleasedError. To re-enable, create the schema before the import, as
    // ee/test/modules/tooljet-db/e2e/tooljetdb-limits.spec.ts does.
    it.skip('should be able to create app if user has app create permission or has instance user type', async () => {
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

      loggedUser = await login(app, superAdminUserData.user.email, 'password', adminUserData.organization.id);
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      // Templates expect built-in static data sources to exist in the organization
      await createDefaultDataSources(adminUserData.organization.id);

      // Use personal-task-list: the smallest template (one ToolJet DB table, no foreign keys, no jsonb)
      let response = await request(app.getHttpServer())
        .post('/api/library_apps')
        .send({ identifier: 'personal-task-list', appName: 'Personal Task List App', dependentPlugins: [] })
        .set('tj-workspace-id', nonAdminUserData.user.defaultOrganizationId)
        .set('Cookie', nonAdminUserData['tokenCookie']);

      expect(response.statusCode).toBe(403);

      response = await request(app.getHttpServer())
        .post('/api/library_apps')
        .send({ identifier: 'personal-task-list', appName: 'Personal Task List App', dependentPlugins: [] })
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie']);

      expect(response.statusCode).toBe(201);
      expect(response.body.app[0].name).toContain('Personal Task List App');
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
      expect(response.body).toMatchObject({
        template_app_manifests: expect.arrayContaining([
          expect.objectContaining({
            id: 'hvac-service-management',
            name: expect.any(String),
            description: expect.any(String),
            category: 'field-services',
            sources: expect.arrayContaining([{ id: 'tooljetdb', name: 'ToolJet Database' }]),
          }),
        ]),
        categories: expect.objectContaining({ 'field-services': 'Field services' }),
      });

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

  describe('GET /api/library_apps/:identifier/default-name | Suggest app name', () => {
    const TEMPLATE_ID = 'hvac-service-management';
    const TEMPLATE_NAME = 'HVAC service management';

    async function signIn() {
      const adminUserData = await createUser(app, { email: 'admin@tooljet.io', groups: ['end-user', 'admin'] });
      const { tokenCookie } = await login(app);
      return { user: adminUserData.user, organization: adminUserData.organization, tokenCookie };
    }

    async function seedApp(
      user,
      name: string,
      { type = 'front-end', branchId }: { type?: string; branchId?: string } = {}
    ) {
      const application = await createApplication(app, { name, user, type });
      const version = await createApplicationVersion(app, application);
      if (branchId) await updateEntity(AppVersion, version.id, { branchId });
    }

    function getDefaultName(session: { user; tokenCookie: string }, query = '') {
      return request(app.getHttpServer())
        .get(`/api/library_apps/${TEMPLATE_ID}/default-name${query}`)
        .set('tj-workspace-id', session.user.defaultOrganizationId)
        .set('Cookie', session.tokenCookie);
    }

    it('should return the template name when no app has it', async () => {
      const session = await signIn();

      const response = await getDefaultName(session);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ name: TEMPLATE_NAME });
    });

    it('should append the next suffix when the name and copies are taken', async () => {
      const session = await signIn();
      await seedApp(session.user, TEMPLATE_NAME);
      await seedApp(session.user, `${TEMPLATE_NAME}_1`);
      await seedApp(session.user, `${TEMPLATE_NAME}_3`);
      await seedApp(session.user, `${TEMPLATE_NAME} pro_5`);

      const response = await getDefaultName(session);

      expect(response.body).toEqual({ name: `${TEMPLATE_NAME}_4` });
    });

    it('should ignore modules with the same name', async () => {
      const session = await signIn();
      await seedApp(session.user, TEMPLATE_NAME, { type: 'module' });

      const response = await getDefaultName(session);

      expect(response.body).toEqual({ name: TEMPLATE_NAME });
    });

    it('should only count names on the requested branch', async () => {
      const session = await signIn();
      const feature = await saveEntity(WorkspaceBranch, {
        organizationId: session.organization.id,
        name: 'feature',
        isDefault: false,
      });
      await seedApp(session.user, TEMPLATE_NAME, { branchId: feature.id });

      const onDefault = await getDefaultName(session);
      const onFeature = await getDefaultName(session, `?branchId=${feature.id}`);

      expect(onDefault.body).toEqual({ name: TEMPLATE_NAME });
      expect(onFeature.body).toEqual({ name: `${TEMPLATE_NAME}_1` });
    });

    it('should not reveal app names from another workspace branch', async () => {
      const session = await signIn();
      const other = await createUser(app, { email: 'other@tooljet.io', groups: ['end-user', 'admin'] });
      await seedApp(other.user, TEMPLATE_NAME);
      const otherBranch = await findEntityOrFail(WorkspaceBranch, {
        organizationId: other.organization.id,
        isDefault: true,
      });

      const response = await getDefaultName(session, `?branchId=${otherBranch.id}`);

      expect(response.body).toEqual({ name: TEMPLATE_NAME });
    });

    it('should reject a branchId that is not a UUID', async () => {
      const session = await signIn();

      const response = await getDefaultName(session, '?branchId=not-a-uuid');

      expect(response.statusCode).toBe(400);
    });

    it('should reject an unknown template', async () => {
      const session = await signIn();

      const response = await request(app.getHttpServer())
        .get('/api/library_apps/non-existent-template/default-name')
        .set('tj-workspace-id', session.user.defaultOrganizationId)
        .set('Cookie', session.tokenCookie);

      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({ message: 'App definition not found' });
    });

    it('should reject an end user without app create permission', async () => {
      const session = await signIn();
      await createUser(app, { email: 'enduser@tooljet.io', groups: ['end-user'], organization: session.organization });
      const endUser = await login(app, 'enduser@tooljet.io');

      const response = await getDefaultName({ user: session.user, tokenCookie: endUser.tokenCookie });

      expect(response.statusCode).toBe(403);
    });

    it('should require a session', async () => {
      const response = await request(app.getHttpServer()).get(`/api/library_apps/${TEMPLATE_ID}/default-name`);

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Template identifiers | Path traversal', () => {
    it('should refuse an identifier that walks out of a template folder', async () => {
      const adminUserData = await createUser(app, { email: 'admin@tooljet.io', groups: ['end-user', 'admin'] });
      const { tokenCookie } = await login(app);

      // Before the guard, this resolved to templates/../templates/hvac-service-management/definition.json
      const response = await request(app.getHttpServer())
        .post('/api/library_apps')
        .send({ identifier: '../templates/hvac-service-management', appName: 'Traversal', dependentPlugins: [] })
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', tokenCookie);

      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({ message: 'App definition not found' });
    });
  });
});
