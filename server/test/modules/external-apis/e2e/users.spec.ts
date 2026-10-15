/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createUser, initTestApp, closeTestApp, createGroupPermission } from 'test-helper';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';

jest.setTimeout(120_000);

const getExtAuth = () => `Basic ${process.env.EXTERNAL_API_ACCESS_TOKEN}`;

describe('ExternalApisUsersController (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('POST /api/ext/users — inviteUrl', () => {
    it('should include a non-null inviteUrl per workspace in the response', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Vendor One',
          email: 'vendor1@example.com',
          workspaces: [{ id: orgId }],
        })
        .expect(201);

      expect(res.body.workspaces).toHaveLength(1);
      expect(res.body.workspaces[0].inviteUrl).toBeTruthy();
    });

    it('should create the user in every requested workspace', async () => {
      const { user: adminUserOne } = await createUser(app, { email: 'admin4@tooljet.io' });
      const { user: adminUserTwo } = await createUser(app, { email: 'admin5@tooljet.io' });

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Vendor Multi',
          email: 'vendor-multi@example.com',
          workspaces: [{ id: adminUserOne.defaultOrganizationId }, { id: adminUserTwo.defaultOrganizationId }],
        })
        .expect(201);

      expect(res.body.workspaces).toHaveLength(2);
      expect(res.body.workspaces.map((workspace: { id: string }) => workspace.id)).toEqual(
        expect.arrayContaining([adminUserOne.defaultOrganizationId, adminUserTwo.defaultOrganizationId])
      );
    });

    it('inviteUrl should contain the correct oid query param matching the workspace id', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin2@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Vendor Two',
          email: 'vendor2@example.com',
          workspaces: [{ id: orgId }],
        })
        .expect(201);

      const inviteUrl: string = res.body.workspaces[0].inviteUrl;
      expect(inviteUrl).toContain(`oid=${orgId}`);
    });

    it('should assign the specified role to the user in the workspace', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin6@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Builder User',
          email: 'builder1@example.com',
          workspaces: [{ id: orgId, role: 'builder' }],
        })
        .expect(201);

      const groupNames = res.body.userGroups.map((g: { name: string }) => g.name);
      expect(groupNames).toContain('builder');
    });

    it('should assign different roles across multiple workspaces', async () => {
      const { user: orgOneAdmin } = await createUser(app, { email: 'admin7@tooljet.io' });
      const { user: orgTwoAdmin } = await createUser(app, { email: 'admin8@tooljet.io' });

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Multi Role User',
          email: 'multi-role@example.com',
          workspaces: [
            { id: orgOneAdmin.defaultOrganizationId, role: 'builder' },
            { id: orgTwoAdmin.defaultOrganizationId, role: 'end-user' },
          ],
        })
        .expect(201);

      expect(res.body.workspaces).toHaveLength(2);
      const groupNames = res.body.userGroups.map((g: { name: string }) => g.name);
      expect(groupNames).toContain('builder');
      expect(groupNames).toContain('end-user');
    });

    it('should return an org-invite URL (not a full invite URL) when user status is active and workspace status is not set', async () => {
      // user:active (no invitationToken) + workspace:unset (defaults to invited) → org-invite URL only
      const { user: adminUser } = await createUser(app, { email: 'admin-active-user@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Active User Vendor',
          email: 'active-user-vendor@example.com',
          status: 'active',
          workspaces: [{ id: orgId }],
        })
        .expect(201);

      const inviteUrl: string = res.body.workspaces[0].inviteUrl;
      expect(inviteUrl).toBeTruthy();
      expect(inviteUrl).toContain('organization-invitations');
      expect(inviteUrl).not.toContain('/invitations/');
    });

    it('should set OrganizationUser status to invited and generate an invitationToken when user is active and workspace status is not set', async () => {
      // workspace always defaults to invited regardless of user status — caller must share the org-invite URL
      const { user: adminUser } = await createUser(app, { email: 'admin-active-orguser@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Active OrgUser Vendor',
          email: 'active-orguser-vendor@example.com',
          status: 'active',
          workspaces: [{ id: orgId }],
        })
        .expect(201);

      const ds = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const orgUser = await ds.manager.findOne(OrganizationUser, { where: { userId: res.body.id } });

      expect(orgUser.status).toBe('invited');
      expect(orgUser.invitationToken).toBeTruthy();
    });

    it('should return an org-invite URL when user is active but workspace status is explicitly set to invited', async () => {
      // user:active (no invitationToken) + workspace:invited (explicit) → org-invite URL only
      const { user: adminUser } = await createUser(app, { email: 'admin-active-ws-invited@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Active User Invited WS',
          email: 'active-user-invited-ws@example.com',
          status: 'active',
          workspaces: [{ id: orgId, status: 'invited' }],
        })
        .expect(201);

      const inviteUrl: string = res.body.workspaces[0].inviteUrl;
      expect(inviteUrl).toBeTruthy();
      expect(inviteUrl).toContain('organization-invitations');
      expect(inviteUrl).not.toContain('/invitations/');
    });

    it('should return null inviteUrl when workspace status is explicitly active regardless of user status', async () => {
      // user:unset (defaults to invited) + workspace:active → workspace active → no invite URL
      const { user: adminUser } = await createUser(app, { email: 'admin-ws-active@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'WS Active Vendor',
          email: 'ws-active-vendor@example.com',
          workspaces: [{ id: orgId, status: 'active' }],
        })
        .expect(201);

      expect(res.body.workspaces[0].inviteUrl).toBeNull();
    });

    it('should return inviteUrl as null when workspace status is active', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin-active-ws@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Active WS Vendor',
          email: 'active-ws-vendor@example.com',
          status: 'active',
          workspaces: [{ id: orgId, status: 'active' }],
        })
        .expect(201);

      expect(res.body.workspaces[0].inviteUrl).toBeNull();
    });

    it('should return a non-null inviteUrl even when user and workspace status are archived', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin-archived@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Archived Vendor',
          email: 'archived-vendor@example.com',
          status: 'archived',
          workspaces: [{ id: orgId, status: 'archived' }],
        })
        .expect(201);

      // Tokens are generated unconditionally at creation time — status does not gate URL generation.
      expect(res.body.workspaces[0].inviteUrl).toBeTruthy();
    });

    it('should add user to multiple custom groups in a workspace', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin9@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const groupA = await createGroupPermission(app, { name: 'Viewer Group A', organizationId: orgId });
      const groupB = await createGroupPermission(app, { name: 'Viewer Group B', organizationId: orgId });

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Multi Group User',
          email: 'multi-group@example.com',
          workspaces: [{ id: orgId, groups: [{ name: groupA.name }, { name: groupB.name }] }],
        })
        .expect(201);

      const groupNames = res.body.userGroups.map((g: { name: string }) => g.name);
      expect(groupNames).toContain('Viewer Group A');
      expect(groupNames).toContain('Viewer Group B');
    });
  });

  describe('POST /api/ext/users — failing conditions', () => {
    it('should return 400 when the email already exists', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin10@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({ name: 'Duplicate Vendor', email: 'duplicate@example.com', workspaces: [{ id: orgId }] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({ name: 'Duplicate Vendor', email: 'duplicate@example.com', workspaces: [{ id: orgId }] })
        .expect(400);

      expect(res.body.message).toContain('already exists');
    });

    it('should return 400 when a workspace id does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Ghost Vendor',
          email: 'ghost@example.com',
          workspaces: [{ id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }],
        })
        .expect(400);

      expect(res.body.message).toContain('do not exist');
    });

    it('should return 400 when a default group name is passed in the groups field', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin11@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Invalid Group Vendor',
          email: 'invalid-group@example.com',
          workspaces: [{ id: orgId, groups: [{ name: 'builder' }] }],
        })
        .expect(400);

      expect(res.body.message).toContain('role field');
    });

    it('should return 400 when a custom group does not exist in the workspace', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin12@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Bad Group Vendor',
          email: 'bad-group@example.com',
          workspaces: [{ id: orgId, groups: [{ name: 'non-existent-custom-group' }] }],
        })
        .expect(400);

      expect(res.body.message).toContain('Group permission id or name not found');
    });

    it('should return 400 when an end-user is added to a builder-level custom group', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin13@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const elevatedGroup = await createGroupPermission(app, {
        name: 'Elevated Builders',
        organizationId: orgId,
        appCreate: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({
          name: 'Conflict Vendor',
          email: 'conflict@example.com',
          workspaces: [{ id: orgId, role: 'end-user', groups: [{ name: elevatedGroup.name }] }],
        })
        .expect(400);

      // This error is thrown as BadRequestException({ message: { error, title } }),
      // so message is an object here — unlike the other failure tests where it's a string.
      expect(res.body.message.title).toBe('Conflicting permissions');
    });
  });

  describe('GET /api/ext/user/:id — backward compat', () => {
    it('should return inviteUrl as null for users without invitation tokens', async () => {
      // Users created via test helper (internal path) never get invitationToken set,
      // so getAllUsers should safely return inviteUrl: null for each of their workspaces.
      const { user: adminUser } = await createUser(app, { email: 'admin3@tooljet.io' });

      const res = await request(app.getHttpServer())
        .get(`/api/ext/user/${adminUser.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);

      res.body.workspaces.forEach((ws: { inviteUrl: string | null }) => {
        expect(ws.inviteUrl).toBeNull();
      });
    });

    it('should return inviteUrl as null after invitation tokens are cleared (post-acceptance)', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin-post-accept@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const createRes = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({ name: 'Acceptance Vendor', email: 'acceptance-vendor@example.com', workspaces: [{ id: orgId }] })
        .expect(201);

      const userId = createRes.body.id;

      // Simulate invite acceptance: both tokens are nulled by the onboarding flow.
      const ds = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      await ds.manager.update(User, { id: userId }, { invitationToken: null });
      await ds.manager.update(OrganizationUser, { userId }, { invitationToken: null });

      const getRes = await request(app.getHttpServer())
        .get(`/api/ext/user/${userId}`)
        .set('Authorization', getExtAuth())
        .expect(200);

      getRes.body.workspaces.forEach((ws: { inviteUrl: string | null }) => {
        expect(ws.inviteUrl).toBeNull();
      });
    });
  });

  describe('POST /api/ext/users — no email dispatch', () => {
    it('should never emit an emailEvent when creating a user', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin-noemail@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const emitter = app.get(EventEmitter2);
      const spy = jest.spyOn(emitter, 'emit');

      await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({ name: 'No Email Vendor', email: 'no-email-vendor@example.com', workspaces: [{ id: orgId }] })
        .expect(201);

      const emailEmits = spy.mock.calls.filter(([event]) => event === 'emailEvent');
      expect(emailEmits).toHaveLength(0);
    });
  });

  describe('GET /api/ext/users — list endpoint', () => {
    it('should return inviteUrl for each workspace entry across all users in the list', async () => {
      const { user: adminUser } = await createUser(app, { email: 'admin-list@tooljet.io' });
      const orgId = adminUser.defaultOrganizationId;

      const createRes = await request(app.getHttpServer())
        .post('/api/ext/users')
        .set('Authorization', getExtAuth())
        .send({ name: 'List Vendor', email: 'list-vendor@example.com', workspaces: [{ id: orgId }] })
        .expect(201);

      const createdUserId = createRes.body.id;

      const listRes = await request(app.getHttpServer())
        .get('/api/ext/users')
        .set('Authorization', getExtAuth())
        .expect(200);

      const found = listRes.body.find((u: { id: string }) => u.id === createdUserId);
      expect(found).toBeDefined();
      expect(found.workspaces).toHaveLength(1);
      expect(found.workspaces[0].inviteUrl).toBeTruthy();
    });
  });

  describe('GET /api/ext/users — status filter', () => {
    it('should return only users matching a single status', async () => {
      const { user: activeUser } = await createUser(app, {
        email: 'status-active@tooljet.io',
        userStatus: 'active',
      });
      const { user: archivedUser } = await createUser(app, {
        email: 'status-archived@tooljet.io',
        userStatus: 'archived',
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: 'archived' })
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toContain(archivedUser.id);
      expect(ids).not.toContain(activeUser.id);
    });

    it('should return the union of users matching a comma-separated status list', async () => {
      const { user: activeUser } = await createUser(app, {
        email: 'status-multi-active@tooljet.io',
        userStatus: 'active',
      });
      const { user: invitedUser } = await createUser(app, {
        email: 'status-multi-invited@tooljet.io',
        userStatus: 'invited',
      });
      const { user: archivedUser } = await createUser(app, {
        email: 'status-multi-archived@tooljet.io',
        userStatus: 'archived',
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: 'active,invited' })
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toEqual(expect.arrayContaining([activeUser.id, invitedUser.id]));
      expect(ids).not.toContain(archivedUser.id);
    });

    it('should return users with verified status when explicitly filtered', async () => {
      const { user: verifiedUser } = await createUser(app, {
        email: 'status-verified@tooljet.io',
        userStatus: 'verified',
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: 'verified' })
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toContain(verifiedUser.id);
    });

    it('should return all users when no status filter is passed', async () => {
      const { user: activeUser } = await createUser(app, {
        email: 'status-noop@tooljet.io',
        userStatus: 'active',
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users')
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toContain(activeUser.id);
    });

    it('should return 400 for an invalid status value', async () => {
      await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: 'bogus' })
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('should return 400 when the status list contains any invalid value', async () => {
      // one good value should not let the whole list slip through
      await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: 'active,bogus' })
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('should return 400 for a status value with incorrect casing', async () => {
      await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: 'Active' })
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('should trim whitespace and drop empty segments from a messy status list', async () => {
      const { user: activeUser } = await createUser(app, {
        email: 'status-messy-active@tooljet.io',
        userStatus: 'active',
      });
      const { user: archivedUser } = await createUser(app, {
        email: 'status-messy-archived@tooljet.io',
        userStatus: 'archived',
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: ' active , ,archived ' })
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toEqual(expect.arrayContaining([activeUser.id, archivedUser.id]));
    });

    it('should treat an empty status param as no filter', async () => {
      const { user: activeUser } = await createUser(app, {
        email: 'status-empty-param@tooljet.io',
        userStatus: 'active',
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: '' })
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toContain(activeUser.id);
    });

    it('should accept status passed as repeated query keys instead of a comma-separated list', async () => {
      const { user: activeUser } = await createUser(app, {
        email: 'status-repeated-active@tooljet.io',
        userStatus: 'active',
      });
      const { user: invitedUser } = await createUser(app, {
        email: 'status-repeated-invited@tooljet.io',
        userStatus: 'invited',
      });
      const { user: archivedUser } = await createUser(app, {
        email: 'status-repeated-archived@tooljet.io',
        userStatus: 'archived',
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users?status=active&status=invited')
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toEqual(expect.arrayContaining([activeUser.id, invitedUser.id]));
      expect(ids).not.toContain(archivedUser.id);
    });

    it("should filter on the user's account-level status, not their workspace membership status", async () => {
      // userStatus sets User.status (account-level); status sets OrganizationUser.status (per-workspace)
      const { user: archivedAccountActiveWorkspace } = await createUser(app, {
        email: 'status-account-vs-workspace@tooljet.io',
        userStatus: 'archived',
        status: 'active',
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: 'archived' })
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toContain(archivedAccountActiveWorkspace.id);
    });

    it('should apply status and group_names filters together with AND semantics', async () => {
      const { user: matchesBoth } = await createUser(app, {
        email: 'status-group-match@tooljet.io',
        userStatus: 'active',
        groups: ['admin'],
      });
      const { user: wrongStatus } = await createUser(app, {
        email: 'status-group-wrong-status@tooljet.io',
        userStatus: 'archived',
        groups: ['admin'],
      });
      const { user: wrongGroup } = await createUser(app, {
        email: 'status-group-wrong-group@tooljet.io',
        userStatus: 'active',
        groups: ['end-user'],
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/users')
        .query({ status: 'active', group_names: 'admin' })
        .set('Authorization', getExtAuth())
        .expect(200);

      const ids = res.body.map((u: { id: string }) => u.id);
      expect(ids).toContain(matchesBoth.id);
      expect(ids).not.toContain(wrongStatus.id);
      expect(ids).not.toContain(wrongGroup.id);
    });
  });
});
