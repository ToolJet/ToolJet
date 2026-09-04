/**
 * @group platform
 */

/**
 * External API v2 — Apps (`api-spec-viewer.html` §3)
 *
 * Routes under /api/v2/ext/workspaces/:workspaceIdentifier/apps (all EE, gated by
 * FEATURE_KEY.*_APP_V2, license EXTERNAL_API). Edition/plan gating (CE 404s, starter 451s) is
 * shared `FeatureAbilityGuard`/`ExternalApiSecurityGuard` infrastructure identical across every
 * v2 route, not per-resource behavior, so it isn't covered by this suite (or any of the other
 * external-apis v2 suites) — it's exercised once in the v1 external-apis specs instead.
 *
 * Known, deliberate spec deviations (do not "fix" these tests to match the spec):
 *   1. Error body shape is NestJS's default AllExceptionsFilter ({statusCode, message, ...}),
 *      not the spec's {error:{code,message,status}}.
 *   2. workspaceIdentifier/appIdentifier are never format-validated (no ParseUUIDPipe) — a
 *      garbage string is simply tried as slug/name and 404s if nothing matches, unlike v1
 *      which 400s on a malformed UUID.
 *
 * Fixed since these tests were first written: Create/Import App v2 used to return/persist
 * name: null (AppsUtilService.create() stores the name only on app_versions.app_name, leaving
 * apps.name null; AppsService.create()'s compensating in-memory patch wasn't replicated here).
 * createAppV2/importAppV2 now apply that same patch. Resolving by name and List's ?search=
 * used to be dead for the same reason (they read apps.name directly); resolveAppByIdentifier's
 * name fallback now reuses AppsUtilService.findByAppName(), and listWorkspaceResourcesV2 now
 * joins app_versions the same way the internal builder's own listings already do. Import App
 * v2's 500-on-every-request crash (generateWorkspaceSlug(null)) is fixed as a side effect.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createUser as createUserBase,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  createFolder,
  ensureAppEnvironments,
  NONEXISTENT_UUID,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/apps`;
}

// createUser() (unlike createApplication()) does not mirror setup-organization's
// createDefaultEnvironments step, so a workspace seeded via createUser alone has no
// AppEnvironment rows. AppsUtilService.create() — the primitive Create App/Module/Workflow
// v2 call directly, bypassing createApplication — needs one to exist (it 500s otherwise:
// EntityNotFoundError on AppEnvironment). Every real workspace has this seeded at creation
// (setup-organization/util.service.ts:44), so this wrapper just keeps tests that hit Create
// directly in sync with that invariant.
async function createUser(app: INestApplication, opts: Parameters<typeof createUserBase>[1]) {
  const result = await createUserBase(app, opts);
  await ensureAppEnvironments(app, result.organization.id);
  return result;
}

describe('ExternalApisAppsControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('enforces the ExternalApiSecurityGuard (missing/invalid Authorization)', async () => {
    const { user } = await createUser(app, { email: `av2-auth-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer()).post(base(user.defaultOrganizationId)).send({ name: 'X' }).expect(403);
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId))
      .set('Authorization', 'Basic wrong-token')
      .send({ name: 'X' })
      .expect(403);
  });

  it('resolveWorkspaceByIdentifier 404s for an identifier that matches no workspace', async () => {
    // Deviation #2 — a non-UUID identifier is tried as a slug/name, not rejected as malformed.
    await request(app.getHttpServer())
      .post(base('not-a-real-workspace'))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  // ---------------------------------------------------------------------------
  // POST /apps — Create
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/apps', () => {
    it('returns 400 when name is missing', async () => {
      const { user } = await createUser(app, { email: `av2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('creates an app, defaults slug to the app id, and accepts an explicit slug', async () => {
      const { user } = await createUser(app, { email: `av2-c2-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Bug Tracker' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Bug Tracker', folder_id: null });
      expect(res.body.slug).toBe(res.body.id);

      const withSlug = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Custom Slug App', slug: `custom-slug-${Date.now()}` })
        .expect(201);
      expect(withSlug.body.slug).toContain('custom-slug-');
    });

    it('creates an app inside a folder, by id or by name, but not across folder types', async () => {
      const { user } = await createUser(app, { email: `av2-c3-${Date.now()}@tooljet.io` });
      const folder = await createFolder(app, {
        name: 'Internal Tools',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });

      const byId = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Foldered App', folder_id: folder.id })
        .expect(201);
      expect(byId.body.folder_id).toBe(folder.id);

      const byName = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Foldered By Name App', folder_id: folder.name })
        .expect(201);
      expect(byName.body.folder_id).toBe(folder.id);

      const moduleFolder = await createFolder(app, {
        name: 'Module Folder Only',
        type: APP_TYPES.MODULE,
        organizationId: user.defaultOrganizationId,
      });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Cross Type App', folder_id: moduleFolder.id })
        .expect(422);
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Missing Folder App', folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('rejects a duplicate app name in the workspace (FINDING: 400, not the spec-mandated 409)', async () => {
      // AppsUtilService.create()'s own pre-flight duplicate-name guard throws BadRequestException
      // (server/src/modules/apps/util.service.ts:104) before ever reaching the catchDbException/
      // APP_NAME_UNIQUE path that would produce a 409 Conflict. api-spec-viewer.html doesn't
      // explicitly document Create App's duplicate-name status (only Import App's, at line 920,
      // which does promise 409) but 409 is the natural/expected code for a uniqueness conflict,
      // consistent with Create Module/Workflow's spec text ("Returns 409 Conflict if...").
      const { user } = await createUser(app, { email: `av2-c4-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Dup App' })
        .expect(201);

      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Dup App' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /apps/:appIdentifier — Rename / move
  // ---------------------------------------------------------------------------

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier', () => {
    it('returns 404 for a nonexistent app and 400 for an empty body', async () => {
      const { user } = await createUser(app, { email: `av2-r1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);

      const seeded = await createApplication(app, { name: 'R', user });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('renames the app, moves it into a folder, and clears the folder', async () => {
      const { user } = await createUser(app, { email: `av2-r2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user });
      const folder = await createFolder(app, {
        name: 'Destination Folder',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });

      const renamed = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'New Name' })
        .expect(200);
      expect(renamed.body).toMatchObject({ id: seeded.id, name: 'New Name' });

      const moved = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: folder.id })
        .expect(200);
      expect(moved.body.folder_id).toBe(folder.id);

      const cleared = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: null })
        .expect(200);
      expect(cleared.body.folder_id).toBeNull();

      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('returns 409 when renaming to a name that already exists in the workspace', async () => {
      // The uniqueness check (AppsUtilService.update) queries app_versions.app_name, so the
      // "existing" app must be seeded through the real create path (which populates it) rather
      // than the raw createApplication() DB helper (which leaves app_versions unseeded and would
      // make this check a no-op).
      const { user } = await createUser(app, { email: `av2-r3-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Taken Name' })
        .expect(201);
      const seeded = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Renameable' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Taken Name' })
        .expect(409);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /apps — List
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps', () => {
    it('returns an empty list, then lists apps scoped to the workspace excluding modules/workflows', async () => {
      const { user } = await createUser(app, { email: `av2-l1-${Date.now()}@tooljet.io` });

      const empty = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(empty.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });

      await createApplication(app, { name: 'Real App', user, type: APP_TYPES.FRONT_END });
      await createApplication(app, { name: 'A Module', user, type: APP_TYPES.MODULE }, false);
      await createApplication(app, { name: 'A Workflow', user, type: APP_TYPES.WORKFLOW }, false);

      const res = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body.pagination.total_count).toBe(1);
      expect(res.body.data[0]).toMatchObject({ name: 'Real App' });
      expect(res.body.data[0]).toHaveProperty('slug');
      expect(res.body.data[0]).toHaveProperty('folder_id');
    });

    it('filters by ?search= against name, seeded via the real API (not the DB helper)', async () => {
      // Seeded via the actual POST endpoint (not the createApplication() DB helper used
      // elsewhere in this file) to exercise the real path a caller would hit — this used to be
      // the exact scenario that exposed listWorkspaceResourcesV2 searching apps.name directly
      // (always null for API-created apps) instead of the app_versions-backed name.
      const { user } = await createUser(app, { email: `av2-l2-${Date.now()}@tooljet.io` });
      const findable = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Findable Widget' })
        .expect(201);
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Something Else' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?search=findable`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.pagination.total_count).toBe(1);
      expect(res.body.data[0].id).toBe(findable.body.id);
    });

    it('filters by ?folder_id=null and paginates with ?page/?per_page', async () => {
      const { user } = await createUser(app, { email: `av2-l3-${Date.now()}@tooljet.io` });
      const folder = await createFolder(app, {
        name: 'Filter Folder',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'In Folder', folder_id: folder.id })
        .expect(201);
      const notInFolder = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Not In Folder' })
        .expect(201);
      await createApplication(app, { name: 'Third App', user });

      const unfoldered = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?folder_id=null`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(unfoldered.body.pagination.total_count).toBe(2);
      expect(unfoldered.body.data.map((a: { id: string }) => a.id)).toContain(notInFolder.body.id);

      const paged = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?page=1&per_page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(2);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /apps/:appIdentifier — Detail
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier', () => {
    it('returns 404 for a nonexistent app and for an app in a different workspace', async () => {
      const { user } = await createUser(app, { email: `av2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);

      const { organization: otherOrg } = await createUser(app, { email: `av2-g1-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned By Someone Else', user });
      await request(app.getHttpServer())
        .get(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('resolves by id, by slug, and by name', async () => {
      const { user } = await createUser(app, { email: `av2-g2-${Date.now()}@tooljet.io` });
      const uniqueName = `Resolve Me ${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: uniqueName, slug: `resolve-slug-${Date.now()}` })
        .expect(201);

      const byId = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byId.body).toMatchObject({ id: created.body.id, slug: created.body.slug });

      const bySlug = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${created.body.slug}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(bySlug.body.id).toBe(created.body.id);

      const byName = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${encodeURIComponent(uniqueName)}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byName.body.id).toBe(created.body.id);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /apps/:appIdentifier
  // ---------------------------------------------------------------------------

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier', () => {
    it('returns 404 for a nonexistent app, and 204 + no-longer-resolvable on delete', async () => {
      const { user } = await createUser(app, { email: `av2-d1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);

      const seeded = await createApplication(app, { name: 'To Delete', user });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(204);

      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /apps/import — Import
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/apps/import', () => {
    it('returns 400 when definition is missing', async () => {
      const { user } = await createUser(app, { email: `av2-i1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('imports an exported app and it appears in the workspace listing', async () => {
      const { user } = await createUser(app, { email: `av2-i2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Source App', user });
      await createApplicationVersion(app, seeded);

      const exportRes = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(exportRes.body).toHaveProperty('definition');

      // Import into a different workspace to avoid the name/slug collision this app already occupies.
      const { organization: otherOrg } = await createUser(app, {
        email: `av2-i2-other-${Date.now()}@tooljet.io`,
      });

      const importRes = await request(app.getHttpServer())
        .post(`${base(otherOrg.id)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: exportRes.body.definition })
        .expect(201);
      expect(importRes.body).toMatchObject({ name: 'Export Source App', folder_id: null });
      expect(importRes.body).toHaveProperty('slug');

      const listRes = await request(app.getHttpServer())
        .get(base(otherOrg.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(listRes.body.pagination.total_count).toBe(1);
    });

    it('rejects a module definition and a duplicate name/slug (FINDING: 400, not the spec-mandated 409)', async () => {
      const { user } = await createUser(app, { email: `av2-i3-${Date.now()}@tooljet.io` });

      const seededModule = await createApplication(app, { name: 'Module To Reject', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, seededModule);
      const moduleExport = await request(app.getHttpServer())
        .get(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/modules/${seededModule.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: moduleExport.body.definition })
        .expect(400);

      // Spec business rule (api-spec-viewer.html:920): duplicate name/slug on import -> 409.
      // importExportHelper.import() detects the collision and throws BadRequestException (not
      // ConflictException), so this surfaces as 400 rather than 409.
      const seeded = await createApplication(app, { name: 'Reimport Me', user });
      await createApplicationVersion(app, seeded);
      const selfExport = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: selfExport.body.definition })
        .expect(400);
    });

    it('returns 422 when tooljet_version is newer than the server (FINDING: code field not delivered)', async () => {
      // AllExceptionsFilter (server/src/modules/app/filters/all-exceptions-filter.ts:43) reads
      // `exception.code` (top-level), but UnprocessableEntityException({code, message}) puts
      // `code` on `exception.response.code`, not `exception.code` — so the spec-promised
      // INCOMPATIBLE_EXPORT_VERSION machine code never reaches the actual HTTP response body,
      // only the human-readable message does. Status code (422) is correct.
      const { user } = await createUser(app, { email: `av2-i4-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: { name: 'Future App', tooljet_version: '9999.0.0' } })
        .expect(422);

      expect(res.body.code).toBeUndefined();
      expect(res.body.message).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // GET /apps/:appIdentifier/export — Export
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier/export', () => {
    it('returns 404 for a nonexistent app, and {definition} with no credentials on success', async () => {
      const { user } = await createUser(app, { email: `av2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);

      const seeded = await createApplication(app, { name: 'Export Shape App', user });
      await createApplicationVersion(app, seeded);
      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(Object.keys(res.body)).toEqual(['definition']);
      expect(res.body.definition).toHaveProperty('tooljet_version');
    });
  });
});
