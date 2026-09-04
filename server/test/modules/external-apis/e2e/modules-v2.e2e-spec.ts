/**
 * @group platform
 */

/**
 * External API v2 — Modules (`api-spec-viewer.html` §4)
 *
 * Routes under /api/v2/ext/workspaces/:workspaceIdentifier/modules (all EE, gated by
 * FEATURE_KEY.*_MODULE_V2, license EXTERNAL_API).
 *
 * Known, deliberate spec deviations (do not "fix" these tests to match the spec):
 *   1. Error body shape is NestJS's default AllExceptionsFilter ({statusCode, message, ...}),
 *      not the spec's {error:{code,message,status}}.
 *   2. workspaceIdentifier/moduleIdentifier are never format-validated — a garbage string is
 *      tried as a name and 404s if nothing matches, rather than 400ing on a malformed UUID.
 *   3. Modules v2 has NO folder_id anywhere (request or response), despite the spec (§4 schema,
 *      create/list/get/update) defining one. This was an explicit product decision made earlier
 *      in this project, not an oversight.
 *
 * Fixed since these tests were first written (see apps-v2.e2e-spec.ts for full root-cause
 * notes — same shared code paths): Create/Import Module v2 used to return/persist name: null,
 * resolving by name used to 404, and List's ?search= used to be dead. All fixed the same way
 * as Apps v2 — createModuleV2/importModuleV2 now patch the in-memory name, and
 * resolveAppByIdentifier/listWorkspaceResourcesV2 are shared with Apps v2, so their fixes
 * apply here automatically.
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
  ensureAppEnvironments,
  NONEXISTENT_UUID,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/modules`;
}

// See apps-v2.e2e-spec.ts — createUser() doesn't seed AppEnvironment rows the way real
// workspace onboarding does, which AppsUtilService.create() (the primitive behind Create
// Module v2) requires.
async function createUser(app: INestApplication, opts: Parameters<typeof createUserBase>[1]) {
  const result = await createUserBase(app, opts);
  await ensureAppEnvironments(app, result.organization.id);
  return result;
}

describe('ExternalApisModulesControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  // ---------------------------------------------------------------------------
  // POST /modules — Create
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/modules', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `mv2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer()).post(base(user.defaultOrganizationId)).send({ name: 'X' }).expect(403);
    });

    it('returns 403 with an invalid Authorization token', async () => {
      const { user } = await createUser(app, { email: `mv2-c2-${Date.now()}@tooljet.io` });
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
      const { user } = await createUser(app, { email: `mv2-c3-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('creates a module and returns {id, name} with no slug/folder_id', async () => {
      const { user } = await createUser(app, { email: `mv2-c4-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Audit Log Panel' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).not.toHaveProperty('slug');
      expect(res.body).not.toHaveProperty('folder_id');
      expect(res.body.name).toBe('Audit Log Panel');
    });

    it('rejects a duplicate module name in the workspace (FINDING: 400, not the spec-mandated 409)', async () => {
      // Same as Apps v2 — AppsUtilService.create()'s pre-flight guard throws BadRequestException,
      // never reaching the catchDbException/APP_NAME_UNIQUE path that would 409. Spec explicitly
      // promises 409 here (api-spec-viewer.html:1061).
      const { user } = await createUser(app, { email: `mv2-c5-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Dup Module' })
        .expect(201);

      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Dup Module' })
        .expect(400);
    });

    it('a Module can share a name with an existing App in the same workspace (no cross-type collision)', async () => {
      // The apps.name column's own DB-level unique index (app_name_organization_id_unique) is
      // NOT type-scoped, but it's moot: apps.name is always null for API-created resources (see
      // the Create Module FINDING above), so that constraint can never fire — Postgres treats
      // NULL as distinct from NULL under a unique index. The uniqueness check that actually runs,
      // AppsUtilService.create()'s pre-flight AppVersion.app_name query, IS type-scoped
      // (`.andWhere('app.type = :type', {type})`, server/src/modules/apps/util.service.ts:98) —
      // confirmed here, correcting an earlier hypothesis that this would collide.
      const { user } = await createUser(app, { email: `mv2-c6-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/apps`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Shared Name' })
        .expect(201);

      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Shared Name' })
        .expect(201);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /modules/:moduleIdentifier — Rename
  // ---------------------------------------------------------------------------

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `mv2-r1-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .send({ name: 'Renamed' })
        .expect(403);
    });

    it('returns 404 when the module does not exist', async () => {
      const { user } = await createUser(app, { email: `mv2-r2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);
    });

    it('returns 400 when name is missing from the body', async () => {
      const { user } = await createUser(app, { email: `mv2-r3-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R3', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('renames the module and reflects the new name in the response', async () => {
      // renameModuleV2 returns dto.name directly, bypassing the null apps.name read — this is
      // the one Modules v2 response that correctly reflects the name.
      const { user } = await createUser(app, { email: `mv2-r4-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.MODULE });
      const res = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body).toMatchObject({ id: seeded.id, name: 'New Name' });
    });

    it('returns 409 when renaming to a name that already exists in the workspace', async () => {
      const { user } = await createUser(app, { email: `mv2-r5-${Date.now()}@tooljet.io` });
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
  // GET /modules — List
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `mv2-l1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer()).get(base(user.defaultOrganizationId)).expect(403);
    });

    it('returns an empty list with pagination shape', async () => {
      const { user } = await createUser(app, { email: `mv2-l2-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });
    });

    it('lists only module-type apps, excluding front-end apps and workflows', async () => {
      const { user } = await createUser(app, { email: `mv2-l3-${Date.now()}@tooljet.io` });
      await createApplication(app, { name: 'A Front-end App', user, type: APP_TYPES.FRONT_END });
      await createApplication(app, { name: 'A Workflow', user, type: APP_TYPES.WORKFLOW }, false);
      const mod = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Real Module' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.pagination.total_count).toBe(1);
      expect(res.body.data[0].id).toBe(mod.body.id);
      expect(res.body.data[0]).not.toHaveProperty('slug');
      expect(res.body.data[0]).not.toHaveProperty('folder_id');
    });

    it('filters by ?search= against name, seeded via the real API', async () => {
      const { user } = await createUser(app, { email: `mv2-l4-${Date.now()}@tooljet.io` });
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

    it('paginates with ?page and ?per_page', async () => {
      const { user } = await createUser(app, { email: `mv2-l5-${Date.now()}@tooljet.io` });
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post(base(user.defaultOrganizationId))
          .set('Authorization', getExtAuth())
          .send({ name: `Page Module ${i}` })
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
  // GET /modules/:moduleIdentifier — Detail
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier', () => {
    it('returns 404 when the module does not exist', async () => {
      const { user } = await createUser(app, { email: `mv2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('returns 404 when a front-end App with that id/name exists but no Module does (type-scoped)', async () => {
      const { user } = await createUser(app, { email: `mv2-g2-${Date.now()}@tooljet.io` });
      const seededApp = await request(app.getHttpServer())
        .post(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/apps`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Only An App' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seededApp.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('resolves by id', async () => {
      const { user } = await createUser(app, { email: `mv2-g3-${Date.now()}@tooljet.io` });
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
      const { user } = await createUser(app, { email: `mv2-g4-${Date.now()}@tooljet.io` });
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
  // DELETE /modules/:moduleIdentifier
  // ---------------------------------------------------------------------------

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `mv2-d1-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'D1', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .expect(403);
    });

    it('returns 404 when the module does not exist', async () => {
      const { user } = await createUser(app, { email: `mv2-d2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('deletes the module and it no longer resolves afterward', async () => {
      const { user } = await createUser(app, { email: `mv2-d3-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'To Delete', user, type: APP_TYPES.MODULE });

      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(204);

      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('returns 400 when the module is referenced by a ModuleViewer component in another app', async () => {
      // Delete-time guard unique to Modules (service.ts:1197-1209) — not present for Apps/Workflows.
      const { user } = await createUser(app, { email: `mv2-d4-${Date.now()}@tooljet.io` });
      const seededModule = await createApplication(app, { name: 'In Use Module', user, type: APP_TYPES.MODULE });
      const referencingApp = await createApplication(app, { name: 'Referencing App', user, type: APP_TYPES.FRONT_END });
      const version = await createApplicationVersion(app, referencingApp);

      const { getDefaultDataSource } = await import('test-helper');
      const { Page } = await import('src/entities/page.entity');
      const { Component } = await import('src/entities/component.entity');
      const pageRepo = getDefaultDataSource().getRepository(Page);
      const componentRepo = getDefaultDataSource().getRepository(Component);
      const page = await pageRepo.save(
        pageRepo.create({ name: 'Home', handle: 'home', appVersionId: version.id, index: 1, appId: referencingApp.id })
      );
      await componentRepo.save(
        componentRepo.create({
          name: 'ModuleViewer1',
          type: 'ModuleViewer',
          pageId: page.id,
          properties: { moduleAppId: { value: seededModule.id } },
          general: {},
          styles: {},
          generalStyles: {},
          displayPreferences: {},
          validation: {},
        })
      );

      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${seededModule.id}`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /modules/import — Import
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/modules/import', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: `mv2-i1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .send({ definition: {} })
        .expect(403);
    });

    it('returns 400 when definition is missing', async () => {
      const { user } = await createUser(app, { email: `mv2-i2-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('imports an exported module and it appears in the workspace listing', async () => {
      // Unlike Apps v2, importModuleV2 doesn't call generateWorkspaceSlug (no slug on modules).
      const { user } = await createUser(app, { email: `mv2-i3-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Source Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, seeded);

      const exportRes = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(exportRes.body).toHaveProperty('definition');

      const { organization: otherOrg } = await createUser(app, { email: `mv2-i3-other-${Date.now()}@tooljet.io` });

      const importRes = await request(app.getHttpServer())
        .post(`${base(otherOrg.id)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: exportRes.body.definition })
        .expect(201);

      expect(importRes.body).toHaveProperty('id');
      expect(importRes.body.name).toBe('Export Source Module');

      const listRes = await request(app.getHttpServer())
        .get(base(otherOrg.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(listRes.body.pagination.total_count).toBe(1);
    });

    it('rejects a front-end app definition on the module import endpoint', async () => {
      const { user } = await createUser(app, { email: `mv2-i4-${Date.now()}@tooljet.io` });
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
      const { user } = await createUser(app, { email: `mv2-i5-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: { name: 'Future Module', tooljet_version: '9999.0.0' } })
        .expect(422);

      expect(res.body.code).toBeUndefined();
      expect(res.body.message).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // GET /modules/:moduleIdentifier/export — Export
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier/export', () => {
    it('returns 404 when the module does not exist', async () => {
      const { user } = await createUser(app, { email: `mv2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('exports the module as {definition}, with no appVersion/exportAllVersions params', async () => {
      // Export Module v2 has no ?appVersion/?exportAllVersions (unlike Apps/Workflows) — mirrors
      // v1's exportModule signature exactly; not a bug, just an intentional asymmetry.
      const { user } = await createUser(app, { email: `mv2-e2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Shape Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, seeded);

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export?appVersion=ignored&exportAllVersions=true`)
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

describe('ExternalApisModulesControllerV2 (EE plan: starter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /modules returns 451 — externalApi not included in starter plan', async () => {
    const { user } = await createUser(app, { email: `mv2-starter-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .expect(451);
  });
});

describe('ExternalApisModulesControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('POST /modules returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `mv2-ce1-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  it('PATCH /modules/:moduleIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `mv2-ce2-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  it('GET /modules returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `mv2-ce3-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('GET /modules/:moduleIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `mv2-ce4-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('DELETE /modules/:moduleIdentifier returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `mv2-ce5-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /modules/import returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `mv2-ce6-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(`${base(user.defaultOrganizationId)}/import`)
      .set('Authorization', getExtAuth())
      .send({ definition: {} })
      .expect(404);
  });

  it('GET /modules/:moduleIdentifier/export returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: `mv2-ce7-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });
});
