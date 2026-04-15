import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createBuilder,
  createEndUser,
  findEntity,
  updateEntity,
  saveEntity,
  createGroupPermission,
} from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { GroupAdmin } from 'src/entities/group_admin.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { GROUP_PERMISSIONS_TYPE } from 'src/modules/group-permissions/constants';

/**
 * Group Admin API | e2e tests (EE, enterprise plan).
 *
 * Endpoints under test:
 *   POST   /api/v2/group-permissions/:id/admins          | assign group admin
 *   GET    /api/v2/group-permissions/:id/admins          | list group admins
 *   DELETE /api/v2/group-permissions/:id/admins/:adminId | revoke group admin
 *   GET    /api/v2/group-permissions                     | scoped list (group-admin builder)
 *
 * Revocation hooks:
 *   POST /api/organization-users/:orgUserId/archive      | archive triggers revocation
 *   PUT  /api/organization-users/:orgUserId              | downgrade to end-user triggers revocation
 */

/** @group platform */
describe('GroupAdminController', () => {
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

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  /** Create a custom group directly in DB, returning the GroupPermissions row. */
  async function createCustomGroup(orgId: string, name: string): Promise<GroupPermissions> {
    return createGroupPermission(nestApp, {
      organizationId: orgId,
      name,
      type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
    } as any);
  }

  /** POST /api/v2/group-permissions/:groupId/admins */
  async function assignAdminViaApi(cookie: string[], workspaceId: string, groupId: string, userId: string) {
    return request(nestApp.getHttpServer())
      .post(`/api/v2/group-permissions/${groupId}/admins`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', cookie)
      .send({ userId });
  }

  /** DELETE /api/v2/group-permissions/:groupId/admins/:adminId */
  async function revokeAdminViaApi(cookie: string[], workspaceId: string, groupId: string, groupAdminId: string) {
    return request(nestApp.getHttpServer())
      .delete(`/api/v2/group-permissions/${groupId}/admins/${groupAdminId}`)
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', cookie);
  }

  // ---------------------------------------------------------------------------
  // EE enterprise tests
  // ---------------------------------------------------------------------------

  describe('EE (plan: enterprise)', () => {
    // -------------------------------------------------------------------------
    // POST /api/v2/group-permissions/:id/admins | Assign group admin
    // -------------------------------------------------------------------------

    describe('POST /api/v2/group-permissions/:id/admins | Assign group admin', () => {
      it('workspace admin can assign a builder as group admin → 201 + row in group_admins', async () => {
        const admin = await createAdmin(nestApp, 'admin-assign@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-target@tooljet.io', {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const response = await assignAdminViaApi(admin.cookie, admin.workspace.id, group.id, builder.user.id);

        expect(response.statusCode).toBe(201);

        const row = await findEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });
        expect(row).not.toBeNull();
      });

      it('returns 400 when assigning an end-user as group admin', async () => {
        const admin = await createAdmin(nestApp, 'admin-endusercheck@tooljet.io');
        const endUser = await createEndUser(nestApp, 'enduser-target@tooljet.io', {
          workspace: admin.workspace,
        });

        // The service checks OrganizationUser.role. Seed sets it to 'all_users'.
        // We explicitly set it to 'end-user' to match USER_ROLE.END_USER.
        await updateEntity(OrganizationUser, endUser.orgUser.id, { role: 'end-user' } as any);

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const response = await assignAdminViaApi(admin.cookie, admin.workspace.id, group.id, endUser.user.id);

        expect(response.statusCode).toBe(400);
      });

      it('returns 403 when a non-admin builder tries to assign a group admin', async () => {
        const admin = await createAdmin(nestApp, 'admin-forassign@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-actor@tooljet.io', {
          workspace: admin.workspace,
        });
        const anotherBuilder = await createBuilder(nestApp, 'builder-target2@tooljet.io', {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        // builder (no group-admin) tries to assign
        const response = await assignAdminViaApi(builder.cookie, admin.workspace.id, group.id, anotherBuilder.user.id);

        expect(response.statusCode).toBe(403);
      });
    });

    // -------------------------------------------------------------------------
    // Scoped access: group-admin builder on GET /group-permissions
    // -------------------------------------------------------------------------

    describe('GET /api/v2/group-permissions | Scoped list for group-admin builder', () => {
      it('group-admin builder can GET group list (sees administered groups)', async () => {
        const admin = await createAdmin(nestApp, 'admin-scopedlist@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-scopedlist@tooljet.io', {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        // Assign builder as group admin via DB (avoids ability-check on the assign endpoint itself)
        await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        const response = await request(nestApp.getHttpServer())
          .get('/api/v2/group-permissions')
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie);

        expect(response.statusCode).toBe(200);

        const body = response.body;
        const groups: any[] = Array.isArray(body) ? body : (body.groupPermissions ?? body.group_permissions ?? []);
        const names = groups.map((g: any) => g.name ?? g.group);
        expect(names).toContain('avengers');
      });

      it('builder with no group-admin assignments gets 403 on GET group list', async () => {
        const admin = await createAdmin(nestApp, 'admin-noscope@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-noscope@tooljet.io', {
          workspace: admin.workspace,
        });

        const response = await request(nestApp.getHttpServer())
          .get('/api/v2/group-permissions')
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie);

        expect(response.statusCode).toBe(403);
      });
    });

    // -------------------------------------------------------------------------
    // Scoped add-user: group-admin can add users to their group
    // -------------------------------------------------------------------------

    describe('POST /api/v2/group-permissions/:id/users | Scoped add-user for group-admin', () => {
      it('group-admin builder can add users to their administered group → 201', async () => {
        const admin = await createAdmin(nestApp, 'admin-adduser@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-adduser@tooljet.io', {
          workspace: admin.workspace,
        });
        const targetUser = await createEndUser(nestApp, 'enduser-adduser@tooljet.io', {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        // Seed group-admin row directly
        await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/users`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie)
          .send({ userIds: [targetUser.user.id], groupId: group.id });

        expect(response.statusCode).toBe(201);
      });

      it('group-admin builder cannot add users to a group they do NOT administer → 403', async () => {
        const admin = await createAdmin(nestApp, 'admin-noadduser@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-noadduser@tooljet.io', {
          workspace: admin.workspace,
        });
        const targetUser = await createEndUser(nestApp, 'enduser-noadduser@tooljet.io', {
          workspace: admin.workspace,
        });

        const groupA = await createCustomGroup(admin.workspace.id, 'avengers');
        const groupB = await createCustomGroup(admin.workspace.id, 'titans');

        // builder is only admin of groupA — groupB is unrelated
        await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: groupA.id,
          organizationId: admin.workspace.id,
        });

        // Try to add to groupB
        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${groupB.id}/users`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie)
          .send({ userIds: [targetUser.user.id], groupId: groupB.id });

        expect(response.statusCode).toBe(403);
      });
    });

    // -------------------------------------------------------------------------
    // Auto-revocation: archive
    // -------------------------------------------------------------------------

    describe('POST /api/organization-users/:id/archive | Group admin revoked on archive', () => {
      it('group-admin row is deleted when the user is archived', async () => {
        const admin = await createAdmin(nestApp, 'admin-archive@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-archive@tooljet.io', {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const groupAdminRow = await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        // Archive the builder (orgUser.id is the archive target)
        const archiveResponse = await request(nestApp.getHttpServer())
          .post(`/api/organization-users/${builder.orgUser.id}/archive`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', admin.cookie)
          .send({});

        expect(archiveResponse.statusCode).toBe(201);

        const remaining = await findEntity(GroupAdmin, { id: groupAdminRow.id });
        expect(remaining).toBeNull();
      });
    });

    // -------------------------------------------------------------------------
    // Auto-revocation: role downgrade to end-user
    // -------------------------------------------------------------------------

    describe('PUT /api/organization-users/:id | Group admin revoked on downgrade to end-user', () => {
      it('group-admin row is deleted when builder is downgraded to end-user', async () => {
        const admin = await createAdmin(nestApp, 'admin-downgrade@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-downgrade@tooljet.io', {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const groupAdminRow = await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        // Downgrade builder to end-user role
        const updateResponse = await request(nestApp.getHttpServer())
          .put(`/api/organization-users/${builder.orgUser.id}`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', admin.cookie)
          .send({ role: 'end-user' });

        // 200 or 201 depending on impl
        expect([200, 201]).toContain(updateResponse.statusCode);

        const remaining = await findEntity(GroupAdmin, { id: groupAdminRow.id });
        expect(remaining).toBeNull();
      });
    });

    // -------------------------------------------------------------------------
    // DELETE /api/v2/group-permissions/:id/admins/:adminId | Revoke admin
    // -------------------------------------------------------------------------

    describe('DELETE /api/v2/group-permissions/:id/admins/:adminId | Revoke group admin', () => {
      it('workspace admin can revoke a group admin assignment', async () => {
        const admin = await createAdmin(nestApp, 'admin-revoke@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-revoke@tooljet.io', {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const groupAdminRow = await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        const response = await revokeAdminViaApi(admin.cookie, admin.workspace.id, group.id, groupAdminRow.id);

        expect(response.statusCode).toBe(200);

        const remaining = await findEntity(GroupAdmin, { id: groupAdminRow.id });
        expect(remaining).toBeNull();
      });

      it('returns 403 when a plain builder tries to revoke a group admin', async () => {
        const admin = await createAdmin(nestApp, 'admin-revoke-403@tooljet.io');
        const builder = await createBuilder(nestApp, 'builder-revoke-403@tooljet.io', {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const groupAdminRow = await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        // Another builder (plain, no group-admin) tries to revoke
        const anotherBuilder = await createBuilder(nestApp, 'builder-plain-revoke@tooljet.io', {
          workspace: admin.workspace,
        });

        const response = await revokeAdminViaApi(anotherBuilder.cookie, admin.workspace.id, group.id, groupAdminRow.id);

        expect(response.statusCode).toBe(403);

        // Row must still exist
        const row = await findEntity(GroupAdmin, { id: groupAdminRow.id });
        expect(row).not.toBeNull();
      });
    });
  });
});
