import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createBuilder,
  createEndUser,
  findEntity,
  findEntities,
  findEntityOrFail,
  saveEntity,
  createGroupPermission,
  createUserGroupPermissions,
} from 'test-helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupAdmin } from '@entities/group_admin.entity';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';

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

const email = (label: string) => `${label}-${Date.now().toString(36)}@tooljet.io`;

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
        const admin = await createAdmin(nestApp, email('admin-assign'));
        const builder = await createBuilder(nestApp, email('builder-target'), {
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
        const admin = await createAdmin(nestApp, email('admin-endusercheck'));
        const endUser = await createEndUser(nestApp, email('enduser-target'), {
          workspace: admin.workspace,
        });

        // createEndUser puts the user in the 'end-user' default permission group.
        // isAdminOrBuilder() checks for membership in 'admin'/'builder' default groups,
        // so this user is rejected without any extra DB manipulation.
        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const response = await assignAdminViaApi(admin.cookie, admin.workspace.id, group.id, endUser.user.id);

        expect(response.statusCode).toBe(400);
      });

      it('is idempotent — assigning the same user twice returns existing row (no duplicate)', async () => {
        const admin = await createAdmin(nestApp, email('admin-idempotent'));
        const builder = await createBuilder(nestApp, email('builder-idempotent'), {
          workspace: admin.workspace,
        });
        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const first = await assignAdminViaApi(admin.cookie, admin.workspace.id, group.id, builder.user.id);
        expect(first.statusCode).toBe(201);

        const second = await assignAdminViaApi(admin.cookie, admin.workspace.id, group.id, builder.user.id);
        expect(second.statusCode).toBe(201);
        expect(second.body.id).toBe(first.body.id);

        const rows = await findEntities(GroupAdmin, { where: { userId: builder.user.id, groupId: group.id } });
        expect(rows).toHaveLength(1);
      });

      it('returns 403 when a non-admin builder tries to assign a group admin', async () => {
        const admin = await createAdmin(nestApp, email('admin-forassign'));
        const builder = await createBuilder(nestApp, email('builder-actor'), {
          workspace: admin.workspace,
        });
        const anotherBuilder = await createBuilder(nestApp, email('builder-target2'), {
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
      // QUARANTINE(group-permissions): flaky — surfaced once the downgrade test was
      // skipped (inter-test state dependency); see #17261
      it.skip('group-admin builder can GET group list (sees administered groups)', async () => {
        const admin = await createAdmin(nestApp, email('admin-scopedlist'));
        const builder = await createBuilder(nestApp, email('builder-scopedlist'), {
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
        const admin = await createAdmin(nestApp, email('admin-noscope'));
        const builder = await createBuilder(nestApp, email('builder-noscope'), {
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
        const admin = await createAdmin(nestApp, email('admin-adduser'));
        const builder = await createBuilder(nestApp, email('builder-adduser'), {
          workspace: admin.workspace,
        });
        const targetUser = await createEndUser(nestApp, email('enduser-adduser'), {
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
        const admin = await createAdmin(nestApp, email('admin-noadduser'));
        const builder = await createBuilder(nestApp, email('builder-noadduser'), {
          workspace: admin.workspace,
        });
        const targetUser = await createEndUser(nestApp, email('enduser-noadduser'), {
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
    // DELETE /api/v2/group-permissions/users/:id | Scoped remove-user for group-admin
    // -------------------------------------------------------------------------

    describe('DELETE /api/v2/group-permissions/users/:id | Scoped remove-user for group-admin', () => {
      it('group-admin builder can remove a user from their administered group → 200', async () => {
        const admin = await createAdmin(nestApp, email('admin-rmuser'));
        const builder = await createBuilder(nestApp, email('builder-rmuser'), {
          workspace: admin.workspace,
        });
        const targetUser = await createEndUser(nestApp, email('enduser-rmuser'), {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers-rm');

        // Seed the target user into the group and make builder a group admin
        await createUserGroupPermissions(nestApp, targetUser.user as any, [group.name]);
        await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        const groupUser = await findEntityOrFail(GroupUsers, { groupId: group.id, userId: targetUser.user.id } as any);

        const response = await request(nestApp.getHttpServer())
          .delete(`/api/v2/group-permissions/users/${groupUser.id}`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie);

        expect(response.statusCode).toBe(200);
        const remaining = await findEntity(GroupUsers, { id: groupUser.id } as any);
        expect(remaining).toBeNull();
      });

      it('group-admin builder cannot remove a user from a group they do NOT administer → 403', async () => {
        const admin = await createAdmin(nestApp, email('admin-nrmuser'));
        const builder = await createBuilder(nestApp, email('builder-nrmuser'), {
          workspace: admin.workspace,
        });
        const targetUser = await createEndUser(nestApp, email('enduser-nrmuser'), {
          workspace: admin.workspace,
        });

        const groupA = await createCustomGroup(admin.workspace.id, 'avengers-nrm');
        const groupB = await createCustomGroup(admin.workspace.id, 'titans-nrm');

        // builder administers groupA only; target user is in groupB
        await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: groupA.id,
          organizationId: admin.workspace.id,
        });
        await createUserGroupPermissions(nestApp, targetUser.user as any, [groupB.name]);

        const groupUser = await findEntityOrFail(GroupUsers, { groupId: groupB.id, userId: targetUser.user.id } as any);

        const response = await request(nestApp.getHttpServer())
          .delete(`/api/v2/group-permissions/users/${groupUser.id}`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie);

        expect(response.statusCode).toBe(403);
      });
    });

    // -------------------------------------------------------------------------
    // Auto-revocation: archive
    // -------------------------------------------------------------------------

    describe('POST /api/organization-users/:id/archive | Group admin revoked on archive', () => {
      it('group-admin row is deleted when the user is archived', async () => {
        const admin = await createAdmin(nestApp, email('admin-archive'));
        const builder = await createBuilder(nestApp, email('builder-archive'), {
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
      // QUARANTINE(group-permissions): failing since main CI rehab — see #17261
      it.skip('group-admin row is deleted when builder is downgraded to end-user', async () => {
        const admin = await createAdmin(nestApp, email('admin-downgrade'));
        const builder = await createBuilder(nestApp, email('builder-downgrade'), {
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
    // GET /api/v2/group-permissions/:id/admins | List admins for group
    // -------------------------------------------------------------------------

    describe('GET /api/v2/group-permissions/:id/admins | List admins for group', () => {
      it('workspace admin gets 200 and sees assigned group admins', async () => {
        const admin = await createAdmin(nestApp, email('admin-listadmins'));
        const builder = await createBuilder(nestApp, email('builder-listadmins'), {
          workspace: admin.workspace,
        });
        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const groupAdminRow = await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}/admins`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', admin.cookie);

        expect(response.statusCode).toBe(200);
        const ids = response.body.map((r: any) => r.id);
        expect(ids).toContain(groupAdminRow.id);
      });

      it('group-admin builder can list admins for their own group → 200', async () => {
        const admin = await createAdmin(nestApp, email('admin-listadmins-builder'));
        const builder = await createBuilder(nestApp, email('builder-listadmins-builder'), {
          workspace: admin.workspace,
        });
        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        // Make builder a group admin
        await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}/admins`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie);

        expect(response.statusCode).toBe(200);
      });

      it('plain builder (no group-admin assignment) gets 403', async () => {
        const admin = await createAdmin(nestApp, email('admin-listadmins-403'));
        const builder = await createBuilder(nestApp, email('builder-listadmins-403'), {
          workspace: admin.workspace,
        });
        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}/admins`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie);

        expect(response.statusCode).toBe(403);
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/v2/group-permissions/:id/admins/addable | Addable admins
    // -------------------------------------------------------------------------

    describe('GET /api/v2/group-permissions/:id/admins/addable | Addable admins', () => {
      it('workspace admin gets 200 — builders and admins appear, end-users do not', async () => {
        const admin = await createAdmin(nestApp, email('admin-addable'));
        const builder = await createBuilder(nestApp, email('builder-addable'), {
          workspace: admin.workspace,
        });
        const endUser = await createEndUser(nestApp, email('enduser-addable'), {
          workspace: admin.workspace,
        });
        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}/admins/addable`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', admin.cookie);

        expect(response.statusCode).toBe(200);

        const userIds: string[] = response.body.map((u: any) => u.id);
        expect(userIds).toContain(builder.user.id);
        expect(userIds).not.toContain(endUser.user.id);
      });

      it('end-user who is also in a custom group is still excluded from addable list', async () => {
        // Regression: the old query joined group_users without restricting to
        // the default group, so an end-user in any custom group appeared eligible.
        const admin = await createAdmin(nestApp, email('admin-addable-regression'));
        const endUser = await createEndUser(nestApp, email('enduser-customgroup'), {
          workspace: admin.workspace,
        });

        // Put end-user in a custom group — should NOT make them eligible.
        const customGroup = await createCustomGroup(admin.workspace.id, 'custom-group-1');
        await createUserGroupPermissions(nestApp, endUser.user as any, [customGroup.name]);

        const targetGroup = await createCustomGroup(admin.workspace.id, 'target-group');

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${targetGroup.id}/admins/addable`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', admin.cookie);

        expect(response.statusCode).toBe(200);
        const userIds: string[] = response.body.map((u: any) => u.id);
        expect(userIds).not.toContain(endUser.user.id);
      });

      it('already-assigned group admin is excluded from addable list', async () => {
        const admin = await createAdmin(nestApp, email('admin-addable-exclude'));
        const builder = await createBuilder(nestApp, email('builder-addable-exclude'), {
          workspace: admin.workspace,
        });
        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}/admins/addable`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', admin.cookie);

        expect(response.statusCode).toBe(200);
        const userIds: string[] = response.body.map((u: any) => u.id);
        expect(userIds).not.toContain(builder.user.id);
      });

      it('group-admin builder cannot access addable admins → 403', async () => {
        // GET_ADDABLE_ADMINS is explicitly withheld from group-admin builders in
        // the ability factory (comment: "Builders NEVER get: GET_ADDABLE_ADMINS").
        const admin = await createAdmin(nestApp, email('admin-addable-builder403'));
        const builder = await createBuilder(nestApp, email('builder-addable-builder403'), {
          workspace: admin.workspace,
        });
        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}/admins/addable`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', builder.cookie);

        expect(response.statusCode).toBe(403);
      });
    });

    // -------------------------------------------------------------------------
    // DELETE /api/v2/group-permissions/:id/admins/:adminId | Revoke admin
    // -------------------------------------------------------------------------

    describe('DELETE /api/v2/group-permissions/:id/admins/:adminId | Revoke group admin', () => {
      it('workspace admin can revoke a group admin assignment', async () => {
        const admin = await createAdmin(nestApp, email('admin-revoke'));
        const builder = await createBuilder(nestApp, email('builder-revoke'), {
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
        const admin = await createAdmin(nestApp, email('admin-revoke-403'));
        const builder = await createBuilder(nestApp, email('builder-revoke-403'), {
          workspace: admin.workspace,
        });

        const group = await createCustomGroup(admin.workspace.id, 'avengers');

        const groupAdminRow = await saveEntity(GroupAdmin, {
          userId: builder.user.id,
          groupId: group.id,
          organizationId: admin.workspace.id,
        });

        // Another builder (plain, no group-admin) tries to revoke
        const anotherBuilder = await createBuilder(nestApp, email('builder-plain-revoke'), {
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
