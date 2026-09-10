/**
 * @group platform
 */

/**
 * External API v2 — Workflows (`api-spec-viewer.html` §5)
 *
 * Routes under /api/v2/ext/workspaces/:workspaceIdentifier/workflows (all EE, gated by
 * FEATURE_KEY.*_WORKFLOW_V2, license EXTERNAL_API). Structurally = Apps v2 minus `slug`
 * (no slug in request or response anywhere), otherwise identical: folder_id support, same
 * 422/404/409 semantics, same import/export shape. Delete has no extra guard (unlike Modules'
 * ModuleViewer-in-use check). Edition/plan gating (CE 404s, starter 451s) is shared guard
 * infrastructure identical across every v2 route, not per-resource behavior, so it isn't
 * covered here — see apps-v2.e2e-spec.ts's header for the full rationale.
 *
 * Known, deliberate spec deviations — same as apps-v2.e2e-spec.ts:
 *   1. Error body shape is NestJS's default AllExceptionsFilter, not the spec's {error:{...}}.
 *   2. workspaceIdentifier/workflowIdentifier are never format-validated.
 *
 * Fixed since these tests were first written (see apps-v2.e2e-spec.ts for full root-cause
 * notes — same shared code paths): Create/Import Workflow v2 used to return/persist name: null,
 * resolving by name used to 404, and List's ?search= used to be dead. createWorkflowV2/
 * importWorkflowV2 now patch the in-memory name; resolveAppByIdentifier/
 * listWorkspaceResourcesV2 are shared with Apps v2, so their fixes apply here automatically.
 * Create with duplicate name -> 400 not 409; rename to duplicate -> 409 (correct) is unchanged.
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
  return `/api/v2/ext/workspaces/${workspaceId}/workflows`;
}

async function createUser(app: INestApplication, opts: Parameters<typeof createUserBase>[1]) {
  const result = await createUserBase(app, opts);
  await ensureAppEnvironments(app, result.organization.id);
  return result;
}

describe('ExternalApisWorkflowsControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('enforces the ExternalApiSecurityGuard and resolveWorkspaceByIdentifier', async () => {
    const { user } = await createUser(app, { email: `wv2-auth-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer()).post(base(user.defaultOrganizationId)).send({ name: 'X' }).expect(403);
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId))
      .set('Authorization', 'Basic wrong-token')
      .send({ name: 'X' })
      .expect(403);
    await request(app.getHttpServer())
      .post(base('not-a-real-workspace'))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  // ---------------------------------------------------------------------------
  // POST /workflows — Create
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/workflows', () => {
    it('returns 400 when name is missing', async () => {
      const { user } = await createUser(app, { email: `wv2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('creates a workflow and returns {id, name, folder_id} with no slug', async () => {
      const { user } = await createUser(app, { email: `wv2-c2-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Nightly Data Sync' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Nightly Data Sync', folder_id: null });
      expect(res.body).not.toHaveProperty('slug');
    });

    it('creates a workflow inside a folder by id, but not across folder types', async () => {
      const { user } = await createUser(app, { email: `wv2-c3-${Date.now()}@tooljet.io` });
      const folder = await createFolder(app, {
        name: 'Sync Jobs',
        type: APP_TYPES.WORKFLOW,
        organizationId: user.defaultOrganizationId,
      });

      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Foldered Workflow', folder_id: folder.id })
        .expect(201);
      expect(res.body.folder_id).toBe(folder.id);

      const appFolder = await createFolder(app, {
        name: 'App Folder Only',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Cross Type Workflow', folder_id: appFolder.id })
        .expect(422);
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Missing Folder Workflow', folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('rejects a duplicate workflow name in the workspace (FINDING: 400, not the spec-mandated 409)', async () => {
      const { user } = await createUser(app, { email: `wv2-c4-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Dup Workflow' })
        .expect(201);
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Dup Workflow' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /workflows/:workflowIdentifier — Rename / move
  // ---------------------------------------------------------------------------

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier', () => {
    it('returns 404 for a nonexistent workflow and 400 when the body has neither name nor folder_id', async () => {
      const { user } = await createUser(app, { email: `wv2-r1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);

      const seeded = await createApplication(app, { name: 'R3', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('renames the workflow, moves it into a folder, and clears the folder', async () => {
      const { user } = await createUser(app, { email: `wv2-r2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.WORKFLOW });
      const folder = await createFolder(app, {
        name: 'Destination Folder',
        type: APP_TYPES.WORKFLOW,
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
      const { user } = await createUser(app, { email: `wv2-r3-${Date.now()}@tooljet.io` });
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
  // GET /workflows — List
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/workflows', () => {
    it('returns an empty list, then lists only workflow-type apps with correct shape', async () => {
      const { user } = await createUser(app, { email: `wv2-l1-${Date.now()}@tooljet.io` });

      const empty = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(empty.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });

      await createApplication(app, { name: 'A Front-end App', user, type: APP_TYPES.FRONT_END });
      await createApplication(app, { name: 'A Module', user, type: APP_TYPES.MODULE }, false);
      const wf = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Real Workflow' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body.pagination.total_count).toBe(1);
      expect(res.body.data[0]).toMatchObject({ id: wf.body.id, name: 'Real Workflow' });
      expect(res.body.data[0]).not.toHaveProperty('slug');
      expect(res.body.data[0]).toHaveProperty('folder_id');
    });

    it('filters by ?search= and ?folder_id=null, and paginates', async () => {
      const { user } = await createUser(app, { email: `wv2-l2-${Date.now()}@tooljet.io` });
      const findable = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Findable Workflow' })
        .expect(201);

      const searched = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?search=findable`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(searched.body.pagination.total_count).toBe(1);
      expect(searched.body.data[0].id).toBe(findable.body.id);

      const folder = await createFolder(app, {
        name: 'Filter Folder',
        type: APP_TYPES.WORKFLOW,
        organizationId: user.defaultOrganizationId,
      });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'In Folder', folder_id: folder.id })
        .expect(201);
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post(base(user.defaultOrganizationId))
          .set('Authorization', getExtAuth())
          .send({ name: `Page Workflow ${i}` })
          .expect(201);
      }

      const unfoldered = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?folder_id=null`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(unfoldered.body.pagination.total_count).toBe(3); // findable + 2 page workflows

      const paged = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?page=1&per_page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(2);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 4 });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /workflows/:workflowIdentifier — Detail
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier', () => {
    it('returns 404 for a nonexistent workflow, and resolves by id and by name', async () => {
      const { user } = await createUser(app, { email: `wv2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);

      const uniqueName = `Resolve Me ${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: uniqueName })
        .expect(201);

      const byId = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byId.body.id).toBe(created.body.id);

      const byName = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${encodeURIComponent(uniqueName)}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byName.body.id).toBe(created.body.id);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /workflows/:workflowIdentifier
  // ---------------------------------------------------------------------------

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier', () => {
    it('returns 404 for a nonexistent workflow, and 204 + no-longer-resolvable on delete', async () => {
      const { user } = await createUser(app, { email: `wv2-d1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);

      const seeded = await createApplication(app, { name: 'To Delete', user, type: APP_TYPES.WORKFLOW });
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
  // POST /workflows/import — Import
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/workflows/import', () => {
    it('returns 400 when definition is missing', async () => {
      const { user } = await createUser(app, { email: `wv2-i1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('imports an exported workflow and it appears in the workspace listing', async () => {
      // Unlike Apps v2, importWorkflowV2 doesn't call generateWorkspaceSlug (no slug on workflows).
      const { user } = await createUser(app, { email: `wv2-i2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Source Workflow', user, type: APP_TYPES.WORKFLOW });
      await createApplicationVersion(app, seeded);

      const exportRes = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(exportRes.body).toHaveProperty('definition');

      const { organization: otherOrg } = await createUser(app, { email: `wv2-i2-other-${Date.now()}@tooljet.io` });
      const importRes = await request(app.getHttpServer())
        .post(`${base(otherOrg.id)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: exportRes.body.definition })
        .expect(201);
      expect(importRes.body).toMatchObject({ name: 'Export Source Workflow', folder_id: null });

      const listRes = await request(app.getHttpServer())
        .get(base(otherOrg.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(listRes.body.pagination.total_count).toBe(1);
    });

    it('rejects a front-end app definition, and 422s on a newer tooljet_version (FINDING: code field not delivered)', async () => {
      const { user } = await createUser(app, { email: `wv2-i3-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'App To Reject', user, type: APP_TYPES.FRONT_END });
      await createApplicationVersion(app, seededApp);
      const exportRes = await request(app.getHttpServer())
        .get(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/apps/${seededApp.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: exportRes.body.definition })
        .expect(400);

      const versionRes = await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: { name: 'Future Workflow', tooljet_version: '9999.0.0' } })
        .expect(422);
      expect(versionRes.body.code).toBeUndefined();
      expect(versionRes.body.message).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // GET /workflows/:workflowIdentifier/export — Export
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier/export', () => {
    it('returns 404 for a nonexistent workflow, and {definition} on success', async () => {
      const { user } = await createUser(app, { email: `wv2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);

      const seeded = await createApplication(app, { name: 'Export Shape Workflow', user, type: APP_TYPES.WORKFLOW });
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
