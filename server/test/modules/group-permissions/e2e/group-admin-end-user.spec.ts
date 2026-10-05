import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createBuilder,
  createEndUser,
  findEntity,
  saveEntity,
  createGroupPermission,
} from 'test-helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupAdmin } from '@entities/group_admin.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';

/**
 * End-user group admins | e2e tests (EE, enterprise plan).
 *
 * An end-user assigned as group admin manages membership of the custom groups they
 * administer — nothing else. Adding end-users to a builder-level group needs a role
 * change, which only workspace admins may perform.
 *
 *   POST /api/v2/group-permissions/:id/admins           | assign end-user as group admin
 *   GET  /api/v2/group-permissions/:id/admins/addable   | end-users are addable
 *   POST /api/v2/group-permissions/:id/users            | scoped add-user + role-change guard
 *   GET  /api/v2/group-permissions                      | scoped list
 *   PUT  /api/v2/group-permissions/role/user            | demotion keeps group-admin rows
 */

const email = (label: string) => `${label}-${Date.now().toString(36)}@tooljet.io`;

/** @group platform */
describe('End-user group admins', () => {
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

  async function createCustomGroup(orgId: string, name: string, extra: Partial<GroupPermissions> = {}) {
    return createGroupPermission(nestApp, {
      organizationId: orgId,
      name,
      type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
      ...extra,
    } as Partial<GroupPermissions>);
  }

  /** An end-user who administers `groupName`, in a fresh workspace with a workspace admin. */
  async function setupEndUserGroupAdmin(label: string, groupExtra: Partial<GroupPermissions> = {}) {
    const admin = await createAdmin(nestApp, email(`admin-${label}`));
    const endUserAdmin = await createEndUser(nestApp, email(`eu-admin-${label}`), { workspace: admin.workspace });
    const group = await createCustomGroup(admin.workspace.id, `group-${label}`, groupExtra);
    await saveEntity(GroupAdmin, {
      userId: endUserAdmin.user.id,
      groupId: group.id,
      organizationId: admin.workspace.id,
    });
    return { admin, endUserAdmin, group };
  }

  function as(user: { cookie: string[] }, workspaceId: string) {
    const server = nestApp.getHttpServer();
    const headers = (req: request.Test) => req.set('tj-workspace-id', workspaceId).set('Cookie', user.cookie);
    return {
      get: (url: string) => headers(request(server).get(url)),
      post: (url: string) => headers(request(server).post(url)),
      put: (url: string) => headers(request(server).put(url)),
    };
  }

  describe('assignment', () => {
    it('workspace admin can assign an end-user as group admin → 201 + row in group_admins', async () => {
      const admin = await createAdmin(nestApp, email('admin-assign'));
      const endUser = await createEndUser(nestApp, email('eu-assign'), { workspace: admin.workspace });
      const group = await createCustomGroup(admin.workspace.id, 'avengers');

      const response = await as(admin, admin.workspace.id)
        .post(`/api/v2/group-permissions/${group.id}/admins`)
        .send({ userId: endUser.user.id });

      expect(response.statusCode).toBe(201);
      expect(
        await findEntity(GroupAdmin, { userId: endUser.user.id, groupId: group.id, organizationId: admin.workspace.id })
      ).not.toBeNull();
    });

    it('addable-admins list includes end-users', async () => {
      const admin = await createAdmin(nestApp, email('admin-addable'));
      const endUser = await createEndUser(nestApp, email('eu-addable'), { workspace: admin.workspace });
      const group = await createCustomGroup(admin.workspace.id, 'avengers');

      const response = await as(admin, admin.workspace.id).get(`/api/v2/group-permissions/${group.id}/admins/addable`);

      expect(response.statusCode).toBe(200);
      expect(response.body.map((u: { id: string }) => u.id)).toContain(endUser.user.id);
    });
  });

  describe('membership management on an administered group', () => {
    it('end-user admin can add an end-user to their group → 201', async () => {
      const { admin, endUserAdmin, group } = await setupEndUserGroupAdmin('add');
      const target = await createEndUser(nestApp, email('eu-target'), { workspace: admin.workspace });

      const response = await as(endUserAdmin, admin.workspace.id)
        .post(`/api/v2/group-permissions/${group.id}/users`)
        .send({ userIds: [target.user.id], groupId: group.id });

      expect(response.statusCode).toBe(201);
    });

    it('end-user admin can add themselves to their group → 201', async () => {
      const { admin, endUserAdmin, group } = await setupEndUserGroupAdmin('self');

      const response = await as(endUserAdmin, admin.workspace.id)
        .post(`/api/v2/group-permissions/${group.id}/users`)
        .send({ userIds: [endUserAdmin.user.id], groupId: group.id });

      expect(response.statusCode).toBe(201);
    });

    it('group list shows only the custom groups they administer — no default groups', async () => {
      const { admin, endUserAdmin, group } = await setupEndUserGroupAdmin('list');
      await createCustomGroup(admin.workspace.id, 'not-mine');

      const response = await as(endUserAdmin, admin.workspace.id).get('/api/v2/group-permissions');

      expect(response.statusCode).toBe(200);
      expect(response.body.groupPermissions.map((g: { id: string }) => g.id)).toEqual([group.id]);
    });
  });

  describe('access outside membership management → 403', () => {
    it('cannot add users to a group they do not administer', async () => {
      const { admin, endUserAdmin } = await setupEndUserGroupAdmin('other');
      const other = await createCustomGroup(admin.workspace.id, 'not-mine');
      const target = await createEndUser(nestApp, email('eu-other-target'), { workspace: admin.workspace });

      const response = await as(endUserAdmin, admin.workspace.id)
        .post(`/api/v2/group-permissions/${other.id}/users`)
        .send({ userIds: [target.user.id], groupId: other.id });

      expect(response.statusCode).toBe(403);
    });

    it('cannot update their group', async () => {
      const { admin, endUserAdmin, group } = await setupEndUserGroupAdmin('update');

      const response = await as(endUserAdmin, admin.workspace.id)
        .put(`/api/v2/group-permissions/${group.id}`)
        .send({ name: 'renamed' });

      expect(response.statusCode).toBe(403);
    });

    it('cannot read granular permissions of their group', async () => {
      const { admin, endUserAdmin, group } = await setupEndUserGroupAdmin('granular');

      const response = await as(endUserAdmin, admin.workspace.id).get(
        `/api/v2/group-permissions/${group.id}/granular-permissions`
      );

      expect(response.statusCode).toBe(403);
    });

    it('cannot assign another group admin', async () => {
      const { admin, endUserAdmin, group } = await setupEndUserGroupAdmin('assign');
      const other = await createEndUser(nestApp, email('eu-assign-other'), { workspace: admin.workspace });

      const response = await as(endUserAdmin, admin.workspace.id)
        .post(`/api/v2/group-permissions/${group.id}/admins`)
        .send({ userId: other.user.id });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('role change required (builder-level group)', () => {
    it('end-user admin gets 409 USER_ROLE_CHANGE_ADMIN_REQUIRED even when sending allowRoleChange', async () => {
      const { admin, endUserAdmin, group } = await setupEndUserGroupAdmin('rolechange', { appCreate: true });
      const target = await createEndUser(nestApp, email('eu-rolechange-target'), { workspace: admin.workspace });

      const response = await as(endUserAdmin, admin.workspace.id)
        .post(`/api/v2/group-permissions/${group.id}/users`)
        .send({ userIds: [target.user.id], groupId: group.id, allowRoleChange: true });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toMatchObject({ type: 'USER_ROLE_CHANGE_ADMIN_REQUIRED' });
    });

    it('end-user admin cannot add themselves to a builder-level group → 409 and no membership row', async () => {
      const { admin, endUserAdmin, group } = await setupEndUserGroupAdmin('selfpromote', { appCreate: true });

      const response = await as(endUserAdmin, admin.workspace.id)
        .post(`/api/v2/group-permissions/${group.id}/users`)
        .send({ userIds: [endUserAdmin.user.id], groupId: group.id, allowRoleChange: true });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toMatchObject({ type: 'USER_ROLE_CHANGE_ADMIN_REQUIRED' });
      expect(await findEntity(GroupUsers, { groupId: group.id, userId: endUserAdmin.user.id })).toBeNull();
    });

    it('builder group admin cannot promote end-users either → 409', async () => {
      const admin = await createAdmin(nestApp, email('admin-builder-ga'));
      const builder = await createBuilder(nestApp, email('builder-ga'), { workspace: admin.workspace });
      const group = await createCustomGroup(admin.workspace.id, 'builder-level', { appCreate: true });
      await saveEntity(GroupAdmin, { userId: builder.user.id, groupId: group.id, organizationId: admin.workspace.id });
      const target = await createEndUser(nestApp, email('eu-builder-ga-target'), { workspace: admin.workspace });

      const response = await as(builder, admin.workspace.id)
        .post(`/api/v2/group-permissions/${group.id}/users`)
        .send({ userIds: [target.user.id], groupId: group.id, allowRoleChange: true });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toMatchObject({ type: 'USER_ROLE_CHANGE_ADMIN_REQUIRED' });
    });

    it('workspace admin still promotes with allowRoleChange → 201', async () => {
      const admin = await createAdmin(nestApp, email('admin-promote'));
      const group = await createCustomGroup(admin.workspace.id, 'builder-level', { appCreate: true });
      const target = await createEndUser(nestApp, email('eu-promote-target'), { workspace: admin.workspace });

      const response = await as(admin, admin.workspace.id)
        .post(`/api/v2/group-permissions/${group.id}/users`)
        .send({ userIds: [target.user.id], groupId: group.id, allowRoleChange: true });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('role downgrade', () => {
    it('demoting a builder group admin to end-user keeps their group-admin rows', async () => {
      const admin = await createAdmin(nestApp, email('admin-downgrade'));
      const builder = await createBuilder(nestApp, email('builder-downgrade'), { workspace: admin.workspace });
      const group = await createCustomGroup(admin.workspace.id, 'avengers');
      const row = await saveEntity(GroupAdmin, {
        userId: builder.user.id,
        groupId: group.id,
        organizationId: admin.workspace.id,
      });

      const response = await as(admin, admin.workspace.id)
        .put('/api/v2/group-permissions/role/user')
        .send({ userId: builder.user.id, newRole: 'end-user' });

      expect(response.statusCode).toBe(200);
      expect(await findEntity(GroupAdmin, { id: row.id })).not.toBeNull();
    });
  });
});
