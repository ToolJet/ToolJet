/**
 * @group platform
 */

/**
 * External API v2 — Apps (`api-spec-viewer.html` §3)
 *
 * Routes under /api/v2/ext/workspaces/:workspaceIdentifier/apps (all EE, gated by
 * FEATURE_KEY.*_APP_V2, license EXTERNAL_API).
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

  // ---------------------------------------------------------------------------
  // POST /apps — Create
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/apps', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `av2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer()).post(base(user.defaultOrganizationId)).send({ name: 'X' }).expect(403);
    });

    it('returns 403 with an invalid Authorization token', async () => {
      const { user } = await createUser(app, { email: `av2-c2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', 'Basic wrong-token')
        .send({ name: 'X' })
        .expect(403);
    });

    it('returns 404 when the workspace identifier does not resolve to any workspace', async () => {
      // Deviation #2 — a non-UUID identifier is tried as a slug/name, not rejected as malformed.
      await request(app.getHttpServer())
        .post(base('not-a-real-workspace'))
        .set('Authorization', getExtAuth())
        .send({ name: 'X' })
        .expect(404);
    });

    it('returns 400 when name is missing', async () => {
      const { user } = await createUser(app, { email: `av2-c3-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('creates an app and returns {id, name, slug, folder_id}', async () => {
      const { user } = await createUser(app, { email: `av2-c4-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Bug Tracker' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('slug');
      expect(res.body.folder_id).toBeNull();
      expect(res.body.name).toBe('Bug Tracker');
    });

    it('defaults slug to the app id when slug is omitted', async () => {
      const { user } = await createUser(app, { email: `av2-c5-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'No Slug App' })
        .expect(201);

      expect(res.body.slug).toBe(res.body.id);
    });

    it('creates an app with an explicit slug', async () => {
      const { user } = await createUser(app, { email: `av2-c6-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Custom Slug App', slug: `custom-slug-${Date.now()}` })
        .expect(201);

      expect(res.body.slug).toContain('custom-slug-');
    });

    it('returns 422 when folder_id does not reference a valid App Folder', async () => {
      const { user } = await createUser(app, { email: `av2-c7-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Orphan Folder App', folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('creates an app inside a folder when folder_id references a valid folder by id', async () => {
      const { user } = await createUser(app, { email: `av2-c8-${Date.now()}@tooljet.io` });
      const folder = await createFolder(app, {
        name: 'Internal Tools',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });

      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Foldered App', folder_id: folder.id })
        .expect(201);

      expect(res.body.folder_id).toBe(folder.id);
    });

    it('creates an app inside a folder when folder_id references a valid folder by name', async () => {
      const { user } = await createUser(app, { email: `av2-c9-${Date.now()}@tooljet.io` });
      const folder = await createFolder(app, {
        name: 'Named Folder',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });

      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Foldered By Name App', folder_id: 'Named Folder' })
        .expect(201);

      expect(res.body.folder_id).toBe(folder.id);
    });

    it('a Module Folder is not a valid folder_id for an App (type-scoped)', async () => {
      const { user } = await createUser(app, { email: `av2-c10-${Date.now()}@tooljet.io` });
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
    });

    it('rejects a duplicate app name in the workspace (FINDING: 400, not the spec-mandated 409)', async () => {
      // AppsUtilService.create()'s own pre-flight duplicate-name guard throws BadRequestException
      // (server/src/modules/apps/util.service.ts:104) before ever reaching the catchDbException/
      // APP_NAME_UNIQUE path that would produce a 409 Conflict. api-spec-viewer.html doesn't
      // explicitly document Create App's duplicate-name status (only Import App's, at line 920,
      // which does promise 409) but 409 is the natural/expected code for a uniqueness conflict,
      // consistent with Create Module/Workflow's spec text ("Returns 409 Conflict if...").
      const { user } = await createUser(app, { email: `av2-c11-${Date.now()}@tooljet.io` });
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
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `av2-r1-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R', user });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .send({ name: 'Renamed' })
        .expect(403);
    });

    it('returns 404 when the app does not exist', async () => {
      const { user } = await createUser(app, { email: `av2-r2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);
    });

    it('returns 400 when the body has none of name/slug/folder_id', async () => {
      const { user } = await createUser(app, { email: `av2-r3-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R3', user });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('renames the app and reflects the new name in the response', async () => {
      const { user } = await createUser(app, { email: `av2-r4-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user });
      const res = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body).toMatchObject({ id: seeded.id, name: 'New Name' });
    });

    it('moves the app into a folder via folder_id', async () => {
      const { user } = await createUser(app, { email: `av2-r5-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'To Move', user });
      const folder = await createFolder(app, {
        name: 'Destination Folder',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });

      const res = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: folder.id })
        .expect(200);

      expect(res.body.folder_id).toBe(folder.id);
    });

    it('clears the folder when folder_id is set to null', async () => {
      const { user } = await createUser(app, { email: `av2-r6-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'To Unfolder', user });
      const folder = await createFolder(app, {
        name: 'Temp Folder',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: folder.id })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: null })
        .expect(200);

      expect(res.body.folder_id).toBeNull();
    });

    it('returns 422 when folder_id does not reference a valid folder', async () => {
      const { user } = await createUser(app, { email: `av2-r7-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Bad Folder Move', user });
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
      const { user } = await createUser(app, { email: `av2-r8-${Date.now()}@tooljet.io` });
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
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `av2-l1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer()).get(base(user.defaultOrganizationId)).expect(403);
    });

    it('returns an empty list with pagination shape when the workspace has no apps', async () => {
      const { user } = await createUser(app, { email: `av2-l2-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });
    });

    it('lists apps scoped to the workspace, excluding modules and workflows', async () => {
      const { user } = await createUser(app, { email: `av2-l3-${Date.now()}@tooljet.io` });
      await createApplication(app, { name: 'Real App', user, type: APP_TYPES.FRONT_END });
      await createApplication(app, { name: 'A Module', user, type: APP_TYPES.MODULE }, false);
      await createApplication(app, { name: 'A Workflow', user, type: APP_TYPES.WORKFLOW }, false);

      const res = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.pagination.total_count).toBe(1);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('slug');
      expect(res.body.data[0]).toHaveProperty('folder_id');
    });

    it('filters by ?search= against name, seeded via the real API (not the DB helper)', async () => {
      // Seeded via the actual POST endpoint (not the createApplication() DB helper used
      // elsewhere in this file) to exercise the real path a caller would hit — this used to be
      // the exact scenario that exposed listWorkspaceResourcesV2 searching apps.name directly
      // (always null for API-created apps) instead of the app_versions-backed name.
      const { user } = await createUser(app, { email: `av2-l4-${Date.now()}@tooljet.io` });
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

    it('filters by ?folder_id=null to return apps not in any folder', async () => {
      const { user } = await createUser(app, { email: `av2-l5-${Date.now()}@tooljet.io` });
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

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?folder_id=null`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.pagination.total_count).toBe(1);
      expect(res.body.data[0]).toMatchObject({ id: notInFolder.body.id, name: 'Not In Folder' });
    });

    it('paginates with ?page and ?per_page', async () => {
      const { user } = await createUser(app, { email: `av2-l6-${Date.now()}@tooljet.io` });
      for (let i = 0; i < 3; i++) {
        await createApplication(app, { name: `Page App ${i}`, user });
      }

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?page=1&per_page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /apps/:appIdentifier — Detail
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier', () => {
    it('returns 404 when the app does not exist', async () => {
      const { user } = await createUser(app, { email: `av2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('returns 404 when the app belongs to a different workspace', async () => {
      const { user: owner } = await createUser(app, { email: `av2-g2-owner-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `av2-g2-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned By Someone Else', user: owner });

      await request(app.getHttpServer())
        .get(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('resolves by id', async () => {
      const { user } = await createUser(app, { email: `av2-g3-${Date.now()}@tooljet.io` });
      const created = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Resolve By Id' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body).toMatchObject({ id: created.body.id, slug: created.body.slug });
    });

    it('resolves by slug', async () => {
      const { user } = await createUser(app, { email: `av2-g4-${Date.now()}@tooljet.io` });
      const created = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Resolve By Slug', slug: `resolve-slug-${Date.now()}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${created.body.slug}`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('resolves by name', async () => {
      const { user } = await createUser(app, { email: `av2-g5-${Date.now()}@tooljet.io` });
      const uniqueName = `Resolve By Name ${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: uniqueName })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${encodeURIComponent(uniqueName)}`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /apps/:appIdentifier
  // ---------------------------------------------------------------------------

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `av2-d1-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'D1', user });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .expect(403);
    });

    it('returns 404 when the app does not exist', async () => {
      const { user } = await createUser(app, { email: `av2-d2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('deletes the app and it no longer resolves afterward', async () => {
      const { user } = await createUser(app, { email: `av2-d3-${Date.now()}@tooljet.io` });
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
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `av2-i1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .send({ definition: {} })
        .expect(403);
    });

    it('returns 400 when definition is missing', async () => {
      const { user } = await createUser(app, { email: `av2-i2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('imports an exported app and it appears in the workspace listing', async () => {
      const { user } = await createUser(app, { email: `av2-i3-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Source App', user });
      await createApplicationVersion(app, seeded);

      const exportRes = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(exportRes.body).toHaveProperty('definition');

      // Import into a different workspace to avoid the name/slug collision this app already occupies.
      const { organization: otherOrg } = await createUser(app, {
        email: `av2-i3-other-${Date.now()}@tooljet.io`,
      });

      const importRes = await request(app.getHttpServer())
        .post(`${base(otherOrg.id)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: exportRes.body.definition })
        .expect(201);

      expect(importRes.body).toMatchObject({ name: 'Export Source App', folder_id: null });
      expect(importRes.body).toHaveProperty('id');
      expect(importRes.body).toHaveProperty('slug');

      const listRes = await request(app.getHttpServer())
        .get(base(otherOrg.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(listRes.body.pagination.total_count).toBe(1);
    });

    it('rejects a module definition on the app import endpoint', async () => {
      const { user } = await createUser(app, { email: `av2-i4-${Date.now()}@tooljet.io` });
      const seededModule = await createApplication(app, { name: 'Module To Reject', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, seededModule);

      const exportRes = await request(app.getHttpServer())
        .get(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/modules/${seededModule.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);

      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: exportRes.body.definition })
        .expect(400);
    });

    it('rejects a duplicate name/slug on import (FINDING: 400, not the spec-mandated 409)', async () => {
      // Spec business rule (api-spec-viewer.html:920): duplicate name/slug on import -> 409.
      // importExportHelper.import() detects the collision and throws before importAppV2 reaches
      // its generateWorkspaceSlug(newApp.name) line (the 500 in the test above only fires on the
      // *success* path) — but it throws BadRequestException, not ConflictException, so this
      // surfaces as 400 rather than 409.
      const { user } = await createUser(app, { email: `av2-i5-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Reimport Me', user });
      await createApplicationVersion(app, seeded);

      const exportRes = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);

      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: exportRes.body.definition })
        .expect(400);
    });

    it('returns 422 when tooljet_version is newer than the server (FINDING: code field not delivered)', async () => {
      // AllExceptionsFilter (server/src/modules/app/filters/all-exceptions-filter.ts:43) reads
      // `exception.code` (top-level), but UnprocessableEntityException({code, message}) puts
      // `code` on `exception.response.code`, not `exception.code` — so the spec-promised
      // INCOMPATIBLE_EXPORT_VERSION machine code never reaches the actual HTTP response body,
      // only the human-readable message does. Status code (422) is correct.
      const { user } = await createUser(app, { email: `av2-i6-${Date.now()}@tooljet.io` });
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
    it('returns 403 without Authorization header', async () => {
      await request(app.getHttpServer())
        .get(`${base(NONEXISTENT_UUID)}/${NONEXISTENT_UUID}/export`)
        .expect(403);
    });

    it('returns 404 when the app does not exist', async () => {
      const { user } = await createUser(app, { email: `av2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('exports the app as {definition} with no data source credentials', async () => {
      const { user } = await createUser(app, { email: `av2-e2-${Date.now()}@tooljet.io` });
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

// ---------------------------------------------------------------------------
// Plan / feature-gating
// ---------------------------------------------------------------------------

describe('ExternalApisAppsControllerV2 (EE plan: starter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /apps returns 451 — externalApi not included in starter plan', async () => {
    const { user } = await createUser(app, { email: `av2-starter-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .expect(451);
  });
});

describe('ExternalApisAppsControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('POST /apps returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `av2-ce1-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  it('PATCH /apps/:appIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `av2-ce2-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  it('GET /apps returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `av2-ce3-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('GET /apps/:appIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `av2-ce4-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('DELETE /apps/:appIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `av2-ce5-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /apps/import returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `av2-ce6-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(`${base(user.defaultOrganizationId)}/import`)
      .set('Authorization', getExtAuth())
      .send({ definition: {} })
      .expect(404);
  });

  it('GET /apps/:appIdentifier/export returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `av2-ce7-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });
});
