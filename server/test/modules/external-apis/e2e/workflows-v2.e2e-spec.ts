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
 * ModuleViewer-in-use check).
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

  // ---------------------------------------------------------------------------
  // POST /workflows — Create
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/workflows', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `wv2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer()).post(base(user.defaultOrganizationId)).send({ name: 'X' }).expect(403);
    });

    it('returns 403 with an invalid Authorization token', async () => {
      const { user } = await createUser(app, { email: `wv2-c2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', 'Basic wrong-token')
        .send({ name: 'X' })
        .expect(403);
    });

    it('returns 404 when the workspace does not resolve', async () => {
      await request(app.getHttpServer())
        .post(base('not-a-real-workspace'))
        .set('Authorization', getExtAuth())
        .send({ name: 'X' })
        .expect(404);
    });

    it('returns 400 when name is missing', async () => {
      const { user } = await createUser(app, { email: `wv2-c3-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('creates a workflow and returns {id, name, folder_id} with no slug', async () => {
      const { user } = await createUser(app, { email: `wv2-c4-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Nightly Data Sync' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).not.toHaveProperty('slug');
      expect(res.body.folder_id).toBeNull();
      expect(res.body.name).toBe('Nightly Data Sync');
    });

    it('returns 422 when folder_id does not reference a valid Workflow Folder', async () => {
      const { user } = await createUser(app, { email: `wv2-c5-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Orphan Folder Workflow', folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('creates a workflow inside a folder when folder_id references a valid folder by id', async () => {
      const { user } = await createUser(app, { email: `wv2-c6-${Date.now()}@tooljet.io` });
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
    });

    it('an App Folder is not a valid folder_id for a Workflow (type-scoped)', async () => {
      const { user } = await createUser(app, { email: `wv2-c7-${Date.now()}@tooljet.io` });
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
    });

    it('rejects a duplicate workflow name in the workspace (FINDING: 400, not the spec-mandated 409)', async () => {
      const { user } = await createUser(app, { email: `wv2-c8-${Date.now()}@tooljet.io` });
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
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `wv2-r1-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .send({ name: 'Renamed' })
        .expect(403);
    });

    it('returns 404 when the workflow does not exist', async () => {
      const { user } = await createUser(app, { email: `wv2-r2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);
    });

    it('returns 400 when the body has neither name nor folder_id', async () => {
      const { user } = await createUser(app, { email: `wv2-r3-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R3', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('renames the workflow and reflects the new name in the response', async () => {
      const { user } = await createUser(app, { email: `wv2-r4-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.WORKFLOW });
      const res = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body).toMatchObject({ id: seeded.id, name: 'New Name' });
    });

    it('moves the workflow into a folder via folder_id, and clears it via folder_id: null', async () => {
      const { user } = await createUser(app, { email: `wv2-r5-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'To Move', user, type: APP_TYPES.WORKFLOW });
      const folder = await createFolder(app, {
        name: 'Destination Folder',
        type: APP_TYPES.WORKFLOW,
        organizationId: user.defaultOrganizationId,
      });

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
    });

    it('returns 422 when folder_id does not reference a valid folder', async () => {
      const { user } = await createUser(app, { email: `wv2-r6-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Bad Folder Move', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('returns 409 when renaming to a name that already exists in the workspace', async () => {
      const { user } = await createUser(app, { email: `wv2-r7-${Date.now()}@tooljet.io` });
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
    it('returns an empty list with pagination shape', async () => {
      const { user } = await createUser(app, { email: `wv2-l1-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });
    });

    it('lists only workflow-type apps, excluding front-end apps and modules', async () => {
      const { user } = await createUser(app, { email: `wv2-l2-${Date.now()}@tooljet.io` });
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
      expect(res.body.data[0].id).toBe(wf.body.id);
      expect(res.body.data[0]).not.toHaveProperty('slug');
      expect(res.body.data[0]).toHaveProperty('folder_id');
    });

    it('filters by ?search= against name', async () => {
      const { user } = await createUser(app, { email: `wv2-l3-${Date.now()}@tooljet.io` });
      const findable = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Findable Workflow' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?search=findable`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.pagination.total_count).toBe(1);
      expect(res.body.data[0].id).toBe(findable.body.id);
    });

    it('filters by ?folder_id=null to return workflows not in any folder', async () => {
      const { user } = await createUser(app, { email: `wv2-l4-${Date.now()}@tooljet.io` });
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
      expect(res.body.data[0].id).toBe(notInFolder.body.id);
    });

    it('paginates with ?page and ?per_page', async () => {
      const { user } = await createUser(app, { email: `wv2-l5-${Date.now()}@tooljet.io` });
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post(base(user.defaultOrganizationId))
          .set('Authorization', getExtAuth())
          .send({ name: `Page Workflow ${i}` })
          .expect(201);
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
  // GET /workflows/:workflowIdentifier — Detail
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier', () => {
    it('returns 404 when the workflow does not exist', async () => {
      const { user } = await createUser(app, { email: `wv2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('resolves by id', async () => {
      const { user } = await createUser(app, { email: `wv2-g2-${Date.now()}@tooljet.io` });
      const created = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Resolve By Id' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('resolves by name', async () => {
      const { user } = await createUser(app, { email: `wv2-g3-${Date.now()}@tooljet.io` });
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
  // DELETE /workflows/:workflowIdentifier
  // ---------------------------------------------------------------------------

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier', () => {
    it('returns 404 when the workflow does not exist', async () => {
      const { user } = await createUser(app, { email: `wv2-d1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('deletes the workflow and it no longer resolves afterward', async () => {
      const { user } = await createUser(app, { email: `wv2-d2-${Date.now()}@tooljet.io` });
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
      expect(importRes.body).toHaveProperty('id');

      const listRes = await request(app.getHttpServer())
        .get(base(otherOrg.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(listRes.body.pagination.total_count).toBe(1);
    });

    it('rejects a front-end app definition on the workflow import endpoint', async () => {
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
    });

    it('returns 422 when tooljet_version is newer than the server (FINDING: code field not delivered)', async () => {
      const { user } = await createUser(app, { email: `wv2-i4-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: { name: 'Future Workflow', tooljet_version: '9999.0.0' } })
        .expect(422);

      expect(res.body.code).toBeUndefined();
      expect(res.body.message).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // GET /workflows/:workflowIdentifier/export — Export
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier/export', () => {
    it('returns 404 when the workflow does not exist', async () => {
      const { user } = await createUser(app, { email: `wv2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('exports the workflow as {definition}', async () => {
      const { user } = await createUser(app, { email: `wv2-e2-${Date.now()}@tooljet.io` });
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

// ---------------------------------------------------------------------------
// Plan / feature-gating
// ---------------------------------------------------------------------------

describe('ExternalApisWorkflowsControllerV2 (EE plan: starter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /workflows returns 451 — externalApi not included in starter plan', async () => {
    const { user } = await createUser(app, { email: `wv2-starter-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .expect(451);
  });
});

describe('ExternalApisWorkflowsControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('POST /workflows returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `wv2-ce1-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  it('PATCH /workflows/:workflowIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `wv2-ce2-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  it('GET /workflows returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `wv2-ce3-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('GET /workflows/:workflowIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `wv2-ce4-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('DELETE /workflows/:workflowIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `wv2-ce5-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /workflows/import returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `wv2-ce6-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(`${base(user.defaultOrganizationId)}/import`)
      .set('Authorization', getExtAuth())
      .send({ definition: {} })
      .expect(404);
  });

  it('GET /workflows/:workflowIdentifier/export returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `wv2-ce7-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });
});
