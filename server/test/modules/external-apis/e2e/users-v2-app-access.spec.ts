/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createGroupPermission,
  createUserGroupPermissions,
  grantAppPermission,
} from 'test-helper';
import { App } from 'src/entities/app.entity';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';

type WorkspaceUser = User & { organizationId: string };

jest.setTimeout(120_000);

const getExtAuth = () => `Basic ${process.env.EXTERNAL_API_ACCESS_TOKEN}`;

describe('ExternalApisUsersControllerV2 app access (EE enterprise)', () => {
  let app: INestApplication;
  let organization: Organization;
  let adminUser: WorkspaceUser;
  let builderUser: WorkspaceUser;
  let viewerUser: WorkspaceUser;
  let alphaApp: App;
  let betaApp: App;
  let gammaApp: App;

  const get = (path: string) => request(app.getHttpServer()).get(path).set('Authorization', getExtAuth());

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  beforeEach(async () => {
    ({ organization, user: adminUser } = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['end-user', 'admin'],
    }));
    ({ user: builderUser } = await createUser(app, { email: 'builder@tooljet.io', groups: ['builder'], organization }));
    ({ user: viewerUser } = await createUser(app, { email: 'viewer@tooljet.io', groups: ['end-user'], organization }));

    alphaApp = await createApplication(app, { name: 'Alpha', slug: 'alpha', user: adminUser });
    betaApp = await createApplication(app, { name: 'Beta', slug: 'beta', user: adminUser });
    gammaApp = await createApplication(app, { name: 'Gamma', slug: 'gamma', user: adminUser });

    const financeGroup = await createGroupPermission(app, { name: 'Finance', organizationId: organization.id });
    await createUserGroupPermissions(app, viewerUser, ['Finance']);
    await grantAppPermission(app, betaApp, financeGroup.id, { read: true });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('GET /api/v2/ext/workspaces/:workspace/users/:user/apps', () => {
    it('should list only the apps a user can view through a custom group, with the group as the source', async () => {
      const res = await get(`/api/v2/ext/workspaces/${organization.id}/users/viewer@tooljet.io/apps`).expect(200);

      expect(res.body.pagination).toEqual({ page: 1, per_page: 20, total_count: 1 });
      expect(res.body.data).toHaveLength(1);
      const [beta] = res.body.data;
      expect(beta).toMatchObject({ id: betaApp.id, name: 'Beta', slug: 'beta' });
      expect(beta.permissions).toMatchObject({ can_view: true, can_edit: false, hidden_from_dashboard: false });
      expect(beta.access_sources).toEqual([
        {
          type: 'group',
          group: expect.objectContaining({ name: 'Finance', type: 'custom' }),
          scope: 'selected_apps',
          permission: 'view',
          hidden_from_dashboard: false,
        },
      ]);
    });

    it('should report edit access to every app for a builder through their role', async () => {
      const res = await get(`/api/v2/ext/workspaces/${organization.id}/users/${builderUser.id}/apps`).expect(200);

      expect(res.body.data.map((a) => a.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
      for (const item of res.body.data) {
        expect(item.permissions).toMatchObject({ can_view: true, can_edit: true });
        expect(item.permissions.environments.development).toBe(true);
        expect(item.access_sources).toEqual([
          expect.objectContaining({
            type: 'group',
            group: expect.objectContaining({ name: 'builder', type: 'default' }),
            scope: 'all_apps',
            permission: 'edit',
          }),
        ]);
      }
    });

    it('should mark apps the user created as owned and editable', async () => {
      const ownApp = await createApplication(app, { name: 'Delta', slug: 'delta', user: viewerUser });

      const res = await get(`/api/v2/ext/workspaces/${organization.id}/users/${viewerUser.id}/apps`).expect(200);

      const delta = res.body.data.find((item) => item.id === ownApp.id);
      expect(delta.permissions).toMatchObject({ can_view: true, can_edit: true });
      expect(delta.access_sources).toEqual([{ type: 'owner' }]);
    });

    it('should only return view-only apps when filtered by view permission', async () => {
      await createApplication(app, { name: 'Delta', slug: 'delta', user: viewerUser });

      const res = await get(
        `/api/v2/ext/workspaces/${organization.id}/users/${viewerUser.id}/apps?permission=view`
      ).expect(200);

      expect(res.body.data.map((a) => a.name)).toEqual(['Beta']);
    });

    it('should paginate apps and report the total count', async () => {
      const res = await get(
        `/api/v2/ext/workspaces/${organization.id}/users/${builderUser.id}/apps?page=2&per_page=2`
      ).expect(200);

      expect(res.body.pagination).toEqual({ page: 2, per_page: 2, total_count: 3 });
      expect(res.body.data.map((a) => a.id)).toEqual([gammaApp.id]);
    });

    it('should filter apps by name', async () => {
      const res = await get(`/api/v2/ext/workspaces/${organization.id}/users/${builderUser.id}/apps?search=alp`).expect(
        200
      );

      expect(res.body.data.map((a) => a.id)).toEqual([alphaApp.id]);
    });

    it('should reject a page size above the limit', async () => {
      await get(`/api/v2/ext/workspaces/${organization.id}/users/${builderUser.id}/apps?per_page=101`).expect(400);
    });

    it('should return 404 for a user outside the workspace', async () => {
      const { user: outsider } = await createUser(app, { email: 'outsider@tooljet.io', groups: ['end-user'] });

      await get(`/api/v2/ext/workspaces/${organization.id}/users/${outsider.id}/apps`).expect(404);
    });

    it('should reject requests without the external API token', async () => {
      await request(app.getHttpServer())
        .get(`/api/v2/ext/workspaces/${organization.id}/users/${viewerUser.id}/apps`)
        .expect(403);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspace/apps/:app/users', () => {
    it('should list users who can access an app along with how they got access', async () => {
      const res = await get(`/api/v2/ext/workspaces/${organization.id}/apps/beta/users`).expect(200);

      expect(res.body.pagination).toEqual({ page: 1, per_page: 20, total_count: 3 });
      expect(res.body.data.map((u) => u.email)).toEqual(['admin@tooljet.io', 'builder@tooljet.io', 'viewer@tooljet.io']);

      const admin = res.body.data[0];
      expect(admin).toMatchObject({ id: adminUser.id, status: 'active', role: 'admin' });
      expect(admin.permissions).toMatchObject({ can_view: true, can_edit: true });
      expect(admin.access_sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'group', group: expect.objectContaining({ name: 'admin' }), permission: 'edit' }),
          { type: 'owner' },
        ])
      );

      const viewer = res.body.data[2];
      expect(viewer).toMatchObject({ role: 'end-user' });
      expect(viewer.permissions).toMatchObject({ can_view: true, can_edit: false });
      expect(viewer.access_sources).toEqual([
        expect.objectContaining({
          type: 'group',
          group: expect.objectContaining({ name: 'Finance', type: 'custom' }),
          scope: 'selected_apps',
          permission: 'view',
        }),
      ]);
    });

    it('should not list users without access to the app', async () => {
      const res = await get(`/api/v2/ext/workspaces/${organization.id}/apps/${alphaApp.id}/users`).expect(200);

      expect(res.body.data.map((u) => u.email)).toEqual(['admin@tooljet.io', 'builder@tooljet.io']);
    });

    it('should only return users who can edit when filtered by edit permission', async () => {
      const res = await get(`/api/v2/ext/workspaces/${organization.id}/apps/beta/users?permission=edit`).expect(200);

      expect(res.body.data.map((u) => u.email)).toEqual(['admin@tooljet.io', 'builder@tooljet.io']);
    });

    it('should paginate users and report the total count', async () => {
      const res = await get(`/api/v2/ext/workspaces/${organization.id}/apps/beta/users?page=3&per_page=1`).expect(200);

      expect(res.body.pagination).toEqual({ page: 3, per_page: 1, total_count: 3 });
      expect(res.body.data.map((u) => u.email)).toEqual(['viewer@tooljet.io']);
    });

    it('should agree with the per-user endpoint on what each user can do', async () => {
      const appUsers = await get(`/api/v2/ext/workspaces/${organization.id}/apps/beta/users`).expect(200);

      for (const appUser of appUsers.body.data) {
        const userApps = await get(`/api/v2/ext/workspaces/${organization.id}/users/${appUser.id}/apps`).expect(200);
        const beta = userApps.body.data.find((item) => item.id === betaApp.id);
        expect(beta.permissions).toEqual(appUser.permissions);
        expect(beta.access_sources).toEqual(appUser.access_sources);
      }
    });

    it('should return 404 for an unknown app', async () => {
      await get(`/api/v2/ext/workspaces/${organization.id}/apps/does-not-exist/users`).expect(404);
    });
  });
});
