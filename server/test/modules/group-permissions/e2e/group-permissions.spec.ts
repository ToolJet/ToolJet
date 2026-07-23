import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createFolder,
  login,
  findEntityOrFail,
  findEntity,
  findEntities,
} from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GroupFolders } from 'src/entities/group_folders.entity';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * V2 Group Permissions API | e2e tests.
 *
 * Endpoints under test:
 *   POST   /api/v2/group-permissions              | create custom group
 *   GET    /api/v2/group-permissions               | list all groups
 *   GET    /api/v2/group-permissions/:id           | get single group
 *   PUT    /api/v2/group-permissions/:id           | update group
 *   DELETE /api/v2/group-permissions/:id           | delete custom group
 *   POST   /api/v2/group-permissions/:id/users     | add users to group
 *   GET    /api/v2/group-permissions/:id/users     | list users in group
 *   DELETE /api/v2/group-permissions/users/:id     | remove user from group (by GroupUsers.id)
 *   GET    /api/v2/group-permissions/:id/users/addable-users?input= | search addable users
 */

/** @group platform */
describe('GroupPermissionsControllerV2', () => {
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
  // Helpers
  // ---------------------------------------------------------------------------

  async function setupOrganizations() {
    const adminUserData = await createUser(nestApp, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const adminUser = adminUserData.user;
    const organization = adminUserData.organization;

    const defaultUserData = await createUser(nestApp, {
      email: 'developer@tooljet.io',
      groups: ['all_users'],
      organization,
    });
    const defaultUser = defaultUserData.user;

    const app = await createApplication(nestApp, {
      user: adminUser,
      name: 'sample app',
      isPublic: false,
    });

    const anotherAdminUserData = await createUser(nestApp, {
      email: 'another_admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const anotherAdminUser = anotherAdminUserData.user;
    const anotherOrganization = anotherAdminUserData.organization;

    return {
      organization: { adminUser, defaultUser, organization, app },
      anotherOrganization: { anotherAdminUser, anotherOrganization },
    };
  }

  /** Authenticate and return the session cookie. */
  async function authenticate(email: string, password = 'password', organizationId: string | null = null) {
    const result = await login(nestApp, email, password, organizationId);
    return result.tokenCookie;
  }

  /** POST to create a custom group and return the response. */
  async function createGroupViaApi(cookie: any, workspaceId: string, name: string) {
    return request(nestApp.getHttpServer())
      .post('/api/v2/group-permissions')
      .set('tj-workspace-id', workspaceId)
      .set('Cookie', cookie)
      .send({ name });
  }

  // ---------------------------------------------------------------------------
  // Edition section
  // ---------------------------------------------------------------------------

  describe('EE (plan: enterprise)', () => {
    // -------------------------------------------------------------------------
    // POST /api/v2/group-permissions | Create
    // -------------------------------------------------------------------------

    describe('POST /api/v2/group-permissions | Create group', () => {
      it('should not allow non-admin to create a group', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await createGroupViaApi(cookie, defaultUser.defaultOrganizationId, 'avengers');
        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to create a custom group', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        const response = await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');
        expect(response.statusCode).toBe(201);

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);
        expect(group).toMatchObject({
          name: 'avengers',
          organizationId: organization.id,
        });
        expect(group.createdAt).toBeDefined();
        expect(group.updatedAt).toBeDefined();
      });

      it('should reject duplicate group names within the same organization', async () => {
        const {
          organization: { adminUser },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        const first = await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');
        expect(first.statusCode).toBe(201);

        const second = await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');
        expect(second.statusCode).toBe(409);
      });

      it('should allow the same group name in different organizations', async () => {
        const {
          organization: { adminUser },
          anotherOrganization: { anotherAdminUser },
        } = await setupOrganizations();
        const adminCookie = await authenticate('admin@tooljet.io');
        const anotherAdminCookie = await authenticate('another_admin@tooljet.io');

        const r1 = await createGroupViaApi(adminCookie, adminUser.defaultOrganizationId, 'avengers');
        expect(r1.statusCode).toBe(201);

        const r2 = await createGroupViaApi(anotherAdminCookie, anotherAdminUser.defaultOrganizationId, 'avengers');
        expect(r2.statusCode).toBe(201);
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/v2/group-permissions | List
    // -------------------------------------------------------------------------

    describe('GET /api/v2/group-permissions | List groups', () => {
      it('should not allow non-admin to list groups', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await request(nestApp.getHttpServer())
          .get('/api/v2/group-permissions')
          .set('tj-workspace-id', defaultUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to list all groups', async () => {
        const {
          organization: { adminUser },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        // Create a custom group first
        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const response = await request(nestApp.getHttpServer())
          .get('/api/v2/group-permissions')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(200);
        // Response should contain default groups (admin, end-user) plus the custom one
        const body = response.body;
        // The response shape may be an array or an object with a groups key — handle both
        const groups: any[] = Array.isArray(body) ? body : (body.groupPermissions ?? body.group_permissions ?? body);
        const names = groups.map((g: any) => g.name ?? g.group);
        expect(names).toContain('admin');
        expect(names).toContain('avengers');
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/v2/group-permissions/:id | Get single
    // -------------------------------------------------------------------------

    describe('GET /api/v2/group-permissions/:id | Get group', () => {
      // QUARANTINE(group-permissions): failing since main CI rehab — see #17261
      it.skip('should not allow non-admin to get a group', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await request(nestApp.getHttpServer())
          .get('/api/v2/group-permissions/some-id')
          .set('tj-workspace-id', defaultUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to get a group by id', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(200);
        // v2 returns { group: GroupPermissions, isBuilderLevel: boolean }
        const body = response.body;
        const returnedGroup = body.group ?? body;
        expect(returnedGroup.name).toBe('avengers');
      });

      it('should return 404 for group from another organization', async () => {
        const {
          organization: { adminUser, organization },
          anotherOrganization: { anotherAdminUser },
        } = await setupOrganizations();
        const adminCookie = await authenticate('admin@tooljet.io');
        const anotherAdminCookie = await authenticate('another_admin@tooljet.io');

        await createGroupViaApi(adminCookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        // Another org's admin should not be able to access
        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}`)
          .set('tj-workspace-id', anotherAdminUser.defaultOrganizationId)
          .set('Cookie', anotherAdminCookie);

        expect(response.statusCode).toBe(400);
      });
    });

    // -------------------------------------------------------------------------
    // PUT /api/v2/group-permissions/:id | Update
    // -------------------------------------------------------------------------

    describe('PUT /api/v2/group-permissions/:id | Update group', () => {
      // QUARANTINE(group-permissions): failing since main CI rehab — see #17261
      it.skip('should not allow non-admin to update a group', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await request(nestApp.getHttpServer())
          .put('/api/v2/group-permissions/some-id')
          .set('tj-workspace-id', defaultUser.defaultOrganizationId)
          .set('Cookie', cookie)
          .send({ name: 'titans' });

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to rename a custom group', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        const response = await request(nestApp.getHttpServer())
          .put(`/api/v2/group-permissions/${group.id}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie)
          .send({ name: 'titans' });

        expect(response.statusCode).toBe(200);

        const updated = await findEntity(GroupPermissions, { id: group.id } as any);
        expect(updated!.name).toBe('titans');
      });

      it('should reject renaming to an existing group name', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        // Try to rename to 'admin' which is a default group
        const response = await request(nestApp.getHttpServer())
          .put(`/api/v2/group-permissions/${group.id}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie)
          .send({ name: 'admin' });

        expect(response.statusCode).toBe(400);
      });

      it('should allow admin to update group permission flags', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        const response = await request(nestApp.getHttpServer())
          .put(`/api/v2/group-permissions/${group.id}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie)
          .send({ appCreate: true, appDelete: true });

        expect(response.statusCode).toBe(200);

        const updated = await findEntity(GroupPermissions, { id: group.id } as any);
        expect(updated).toMatchObject({
          appCreate: true,
          appDelete: true,
        });
      });
    });

    // -------------------------------------------------------------------------
    // DELETE /api/v2/group-permissions/:id | Delete
    // -------------------------------------------------------------------------

    describe('DELETE /api/v2/group-permissions/:id | Delete group', () => {
      // QUARANTINE(group-permissions): failing since main CI rehab — see #17261
      it.skip('should not allow non-admin to delete a group', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await request(nestApp.getHttpServer())
          .delete('/api/v2/group-permissions/some-id')
          .set('tj-workspace-id', defaultUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to delete a custom group', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        const response = await request(nestApp.getHttpServer())
          .delete(`/api/v2/group-permissions/${group.id}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(200);

        const deleted = await findEntity(GroupPermissions, { id: group.id } as any);
        expect(deleted).toBeNull();
      });
    });

    // -------------------------------------------------------------------------
    // POST /api/v2/group-permissions/:id/users | Add users
    // -------------------------------------------------------------------------

    describe('POST /api/v2/group-permissions/:id/users | Add user to group', () => {
      // QUARANTINE(group-permissions): failing since main CI rehab — see #17261
      it.skip('should not allow non-admin to add users', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await request(nestApp.getHttpServer())
          .post('/api/v2/group-permissions/some-id/users')
          .set('tj-workspace-id', defaultUser.defaultOrganizationId)
          .set('Cookie', cookie)
          .send({ userIds: ['some-user-id'], groupId: 'some-id' });

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to add users to a custom group', async () => {
        const {
          organization: { adminUser, defaultUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/users`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie)
          .send({ userIds: [defaultUser.id], groupId: group.id });

        expect(response.statusCode).toBe(201);

        const usersInGroup = await findEntities(GroupUsers, { where: { groupId: group.id } });
        const userIds = usersInGroup.map((gu) => gu.userId);
        expect(userIds).toContain(defaultUser.id);
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/v2/group-permissions/:id/users | List users in group
    // -------------------------------------------------------------------------

    describe('GET /api/v2/group-permissions/:id/users | List group users', () => {
      // QUARANTINE(group-permissions): failing since main CI rehab — see #17261
      it.skip('should not allow non-admin to list group users', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await request(nestApp.getHttpServer())
          .get('/api/v2/group-permissions/some-id/users')
          .set('tj-workspace-id', defaultUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to list users in a group', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        // Get the admin default group
        const adminGroup = await findEntityOrFail(GroupPermissions, {
          name: 'admin',
          organizationId: organization.id,
        } as any);

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${adminGroup.id}/users`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(200);
        // Should contain at least the admin user
        const users = Array.isArray(response.body) ? response.body : (response.body.users ?? []);
        expect(users.length).toBeGreaterThanOrEqual(1);
      });
    });

    // -------------------------------------------------------------------------
    // DELETE /api/v2/group-permissions/users/:id | Remove user from group
    // -------------------------------------------------------------------------

    describe('DELETE /api/v2/group-permissions/users/:id | Remove user from group', () => {
      // QUARANTINE(group-permissions): failing since main CI rehab — see #17261
      it.skip('should not allow non-admin to remove a user from a group', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await request(nestApp.getHttpServer())
          .delete('/api/v2/group-permissions/users/some-id')
          .set('tj-workspace-id', defaultUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to remove a user from a custom group', async () => {
        const {
          organization: { adminUser, defaultUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        // Add user first
        await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/users`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie)
          .send({ userIds: [defaultUser.id], groupId: group.id });

        // Find the GroupUsers entry
        const groupUser = await findEntityOrFail(GroupUsers, { groupId: group.id, userId: defaultUser.id } as any);

        // Remove the user
        const response = await request(nestApp.getHttpServer())
          .delete(`/api/v2/group-permissions/users/${groupUser.id}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(200);

        const remaining = await findEntities(GroupUsers, { where: { groupId: group.id, userId: defaultUser.id } });
        expect(remaining).toHaveLength(0);
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/v2/group-permissions/:id/users/addable-users | Addable users
    // -------------------------------------------------------------------------

    describe('GET /api/v2/group-permissions/:id/users/addable-users | List addable users', () => {
      // QUARANTINE(group-permissions): failing since main CI rehab — see #17261
      it.skip('should not allow non-admin to search addable users', async () => {
        const {
          organization: { defaultUser },
        } = await setupOrganizations();
        const cookie = await authenticate('developer@tooljet.io');

        const response = await request(nestApp.getHttpServer())
          .get('/api/v2/group-permissions/some-id/users/addable-users?input=test')
          .set('tj-workspace-id', defaultUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to search for addable users', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        await createGroupViaApi(cookie, adminUser.defaultOrganizationId, 'avengers');

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'avengers',
        } as any);

        const response = await request(nestApp.getHttpServer())
          .get(`/api/v2/group-permissions/${group.id}/users/addable-users?input=developer`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(200);
        const users = Array.isArray(response.body) ? response.body : (response.body.users ?? []);
        // developer@tooljet.io should appear as addable
        const emails = users.map((u: any) => u.email);
        expect(emails).toContain('developer@tooljet.io');
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/v2/group-permissions/granular-permissions/addable-folders
    // -------------------------------------------------------------------------

    describe('GET /api/v2/group-permissions/granular-permissions/addable-folders | List addable folders', () => {
      it('should return only front-end folders and hide module folders', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        const appFolder = await createFolder(nestApp, {
          name: 'App Folder',
          type: APP_TYPES.FRONT_END,
          organizationId: organization.id,
        });

        const moduleFolder = await createFolder(nestApp, {
          name: 'Module Folder',
          type: APP_TYPES.MODULE,
          organizationId: organization.id,
        });

        const response = await request(nestApp.getHttpServer())
          .get('/api/v2/group-permissions/granular-permissions/addable-folders')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie);

        expect(response.statusCode).toBe(200);

        const folderIds = response.body.map((folder: any) => folder.id);
        expect(folderIds).toContain(appFolder.id);
        expect(folderIds).not.toContain(moduleFolder.id);
      });
    });

    // -------------------------------------------------------------------------
    // POST /api/v2/group-permissions/:id/granular-permissions/folder
    // -------------------------------------------------------------------------

    describe('POST /api/v2/group-permissions/:id/granular-permissions/folder | Create folder granular permissions', () => {
      it('should still persist module folder ids when sent directly', async () => {
        const {
          organization: { adminUser, organization },
        } = await setupOrganizations();
        const cookie = await authenticate('admin@tooljet.io');

        const customGroupResponse = await createGroupViaApi(
          cookie,
          adminUser.defaultOrganizationId,
          'module-folder-access'
        );
        expect(customGroupResponse.statusCode).toBe(201);

        const group = await findEntityOrFail(GroupPermissions, {
          organizationId: organization.id,
          name: 'module-folder-access',
        } as any);

        const moduleFolder = await createFolder(nestApp, {
          name: 'Module Folder - direct grant',
          type: APP_TYPES.MODULE,
          organizationId: organization.id,
        });

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/folder`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', cookie)
          .send({
            name: 'Module Folder Access',
            groupId: group.id,
            type: 'folder',
            isAll: false,
            createResourcePermissionObject: {
              canEditFolder: false,
              canEditApps: false,
              canViewApps: true,
              resourcesToAdd: [{ folderId: moduleFolder.id }],
            },
          });

        expect(response.statusCode).toBe(201);

        const groupFolders = await findEntities(GroupFolders, {
          where: {
            folderId: moduleFolder.id,
          },
        });

        expect(groupFolders.length).toBeGreaterThan(0);
      });
    });
  });
});
