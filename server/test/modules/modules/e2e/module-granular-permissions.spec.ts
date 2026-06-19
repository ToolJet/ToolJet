import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createUser, initTestApp, closeTestApp, createApplication, login, findEntityOrFail } from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';

/**
 * Module Granular Permissions — Phase 1 / Horizon H1 (DEV-62).
 *
 * A module = `apps` row with type='module'. Module access is resolved via its OWN
 * granular permission (ResourceType.MODULE → apps_group_permissions.app_type='module'),
 * NOT the app bucket. Edit → can_edit, Build-with → can_view.
 *
 * Endpoints under test:
 *   POST /api/v2/group-permissions/:id/granular-permissions/app   | assign module perm (type='module')
 *   GET  /api/apps?type=module                                    | module dashboard list
 *
 * Acceptance (DEV-62):
 *   - Custom group + Edit on module M → user sees M on the module dashboard.
 *   - Build-with only → M appears (read-only treatment lands in H2).
 *   - Neither → M absent from dashboard + search.
 *   - Creator always sees own modules regardless of group.
 *   - Assigning a module perm to a group containing end-users is rejected.
 */

/** @group platform */
describe('ModuleGranularPermissions (H1)', () => {
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

  /** Lists modules visible to a user on the dashboard. Returns the array of module names. */
  async function listModuleNames(orgId: string, cookie: string[]): Promise<string[]> {
    const res = await request(nestApp.getHttpServer())
      .get('/api/apps?type=module')
      .set('tj-workspace-id', orgId)
      .set('Cookie', cookie);
    expect(res.statusCode).toBe(200);
    return (res.body.apps || []).map((a) => a.name);
  }

  /** Assigns a module granular permission to a group via the public CRUD endpoint. */
  async function assignModulePermission(
    groupId: string,
    orgId: string,
    cookie: string[],
    body: { isAll: boolean; canEdit: boolean; canView: boolean; appIds?: string[] }
  ) {
    return request(nestApp.getHttpServer())
      .post(`/api/v2/group-permissions/${groupId}/granular-permissions/app`)
      .set('tj-workspace-id', orgId)
      .set('Cookie', cookie)
      .send({
        name: 'Modules',
        isAll: body.isAll,
        type: 'module',
        createResourcePermissionObject: {
          canEdit: body.canEdit,
          canView: body.canView,
          hideFromDashboard: false,
          resourcesToAdd: (body.appIds || []).map((appId) => ({ appId })),
        },
      });
  }

  async function groupId(name: string, orgId: string): Promise<string> {
    const group = await findEntityOrFail(GroupPermissions, { name, organizationId: orgId } as any);
    return group.id;
  }

  describe('GET /api/apps?type=module | module dashboard filtering', () => {
    it('shows modules a custom group has Edit or Build-with on, hides the rest, and always shows owned modules; rejects end-user assignment', async () => {
      // --- workspace + users (shared org) -----------------------------------
      const adminData = await createUser(nestApp, { email: 'mgp-admin@tooljet.io', groups: ['all_users', 'admin'] });
      const org = adminData.organization;
      const adminCookie = (await login(nestApp, 'mgp-admin@tooljet.io')).tokenCookie;

      // viewer: builder role + a custom group that will receive module grants
      const viewerData = await createUser(nestApp, {
        email: 'mgp-viewer@tooljet.io',
        groups: ['builder', 'module-team'],
        organization: org,
      });
      const viewerCookie = (await login(nestApp, 'mgp-viewer@tooljet.io')).tokenCookie;

      // --- modules (all owned by admin) -------------------------------------
      const mEdit = await createApplication(nestApp, { name: 'M-Edit', user: adminData.user, type: 'module' });
      const mBuild = await createApplication(nestApp, { name: 'M-Build', user: adminData.user, type: 'module' });
      await createApplication(nestApp, { name: 'M-None', user: adminData.user, type: 'module' });

      // a module OWNED by the viewer, with no group grant
      const mOwned = await createApplication(nestApp, { name: 'M-Owned', user: viewerData.user, type: 'module' });

      // --- assign module perms to the custom group --------------------------
      const teamId = await groupId('module-team', org.id);
      const editRes = await assignModulePermission(teamId, org.id, adminCookie, {
        isAll: false,
        canEdit: true,
        canView: false,
        appIds: [mEdit.id],
      });
      expect(editRes.statusCode).toBe(201);
      const buildRes = await assignModulePermission(teamId, org.id, adminCookie, {
        isAll: false,
        canEdit: false,
        canView: true,
        appIds: [mBuild.id],
      });
      expect(buildRes.statusCode).toBe(201);

      // --- assertions: dashboard reflects grants + ownership ----------------
      const visible = await listModuleNames(org.id, viewerCookie);
      expect(new Set(visible)).toEqual(new Set(['M-Edit', 'M-Build', 'M-Owned']));
      expect(visible).not.toContain('M-None');

      // search also excludes the ungranted module
      const searchRes = await request(nestApp.getHttpServer())
        .get('/api/apps?type=module&searchKey=M-None')
        .set('tj-workspace-id', org.id)
        .set('Cookie', viewerCookie);
      expect(searchRes.statusCode).toBe(200);
      expect(searchRes.body.apps).toEqual([]);
    });

    it('rejects assigning a module permission to a group that contains an end-user', async () => {
      const adminData = await createUser(nestApp, { email: 'mgp-admin2@tooljet.io', groups: ['all_users', 'admin'] });
      const org = adminData.organization;
      const adminCookie = (await login(nestApp, 'mgp-admin2@tooljet.io')).tokenCookie;

      // end-user-role member placed into a custom group
      await createUser(nestApp, { email: 'mgp-eu@tooljet.io', groups: ['all_users', 'eu-team'], organization: org });
      const euTeamId = await groupId('eu-team', org.id);

      const module = await createApplication(nestApp, { name: 'M-Guarded', user: adminData.user, type: 'module' });

      // Build-with (canView only) must ALSO be rejected for end-user groups
      const res = await assignModulePermission(euTeamId, org.id, adminCookie, {
        isAll: false,
        canEdit: false,
        canView: true,
        appIds: [module.id],
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
