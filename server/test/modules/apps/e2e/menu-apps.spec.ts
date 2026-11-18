import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createUser,
  login,
  createApplication,
  createApplicationVersion,
  markVersionAsReleased,
  grantAppPermission,
  createFolder,
  addAppToFolder,
  findEntityOrFail,
} from 'test-helper';
import { App } from 'src/entities/app.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';

/** @group platform */
describe('AppsController', () => {
  let app: INestApplication;
  let admin: { workspaceId: string; cookie: string };
  let endUser: { workspaceId: string; cookie: string };

  const released = async (name: string, user: any): Promise<App> => {
    const application = await createApplication(app, { name, user }, false);
    const version = await createApplicationVersion(app, application);
    await markVersionAsReleased(application.id, version.id);
    return application;
  };

  beforeAll(async () => {
    ({ app } = await initTestApp());

    const adminData = await createUser(app, { email: 'menu-admin@tooljet.io', groups: ['all_users', 'admin'] });
    const organization = adminData.organization;
    await createUser(app, { email: 'menu-end-user@tooljet.io', groups: ['end-user'], organization });
    const otherWorkspace = await createUser(app, { email: 'menu-other@tooljet.io', groups: ['all_users', 'admin'] });

    // Granted to end users: two released apps (one in a folder) and one draft.
    const beta = await released('Beta', adminData.user);
    const alpha = await released('alpha', adminData.user);
    const draft = await createApplication(app, { name: 'Draft', user: adminData.user }, false);
    await createApplicationVersion(app, draft);
    // Released, but never granted to end users.
    await released('Restricted', adminData.user);
    // Released in another workspace.
    await released('Elsewhere', otherWorkspace.user);

    const endUserGroup = await findEntityOrFail(GroupPermissions, {
      name: 'end-user',
      organizationId: organization.id,
    } as any);
    for (const granted of [beta, alpha, draft]) {
      await grantAppPermission(app, granted, endUserGroup.id, { read: true, update: false, delete: false });
    }

    const internal = await createFolder(app, { name: 'Internal', organizationId: organization.id });
    await addAppToFolder(app, beta, internal);

    admin = { workspaceId: organization.id, cookie: (await login(app, 'menu-admin@tooljet.io')).tokenCookie };
    endUser = { workspaceId: organization.id, cookie: (await login(app, 'menu-end-user@tooljet.io')).tokenCookie };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  const getMenuApps = (as: { workspaceId: string; cookie: string }) =>
    request(app.getHttpServer())
      .get('/api/apps/menu-apps')
      .set('tj-workspace-id', as.workspaceId)
      .set('Cookie', as.cookie);

  describe('GET /api/apps/menu-apps | List released apps for the page menu', () => {
    it('should reject a request without a session', async () => {
      await request(app.getHttpServer()).get('/api/apps/menu-apps').expect(401);
    });

    it('should return only the released apps an end user can open, sorted by name, with their folder', async () => {
      const response = await getMenuApps(endUser).expect(200);

      expect(response.body).toEqual({
        apps: [
          { id: expect.any(String), name: 'alpha', slug: expect.any(String), folder: null },
          {
            id: expect.any(String),
            name: 'Beta',
            slug: expect.any(String),
            folder: { id: expect.any(String), name: 'Internal' },
          },
        ],
      });
    });

    it('should include every released app in the workspace for an admin, but no drafts or other workspaces', async () => {
      const response = await getMenuApps(admin).expect(200);

      expect(response.body.apps.map((menuApp: { name: string }) => menuApp.name)).toEqual([
        'alpha',
        'Beta',
        'Restricted',
      ]);
    });
  });
});
