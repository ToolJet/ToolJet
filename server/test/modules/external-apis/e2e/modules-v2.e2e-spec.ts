/**
 * @group platform
 */

/**
 * External API v2 — Modules (`api-spec-viewer.html` §4)
 *
 * Routes under /api/v2/ext/workspaces/:workspaceIdentifier/modules (all EE, gated by
 * FEATURE_KEY.*_MODULE_V2, license EXTERNAL_API). Edition/plan gating (CE 404s, starter 451s)
 * is shared guard infrastructure identical across every v2 route, not per-resource behavior,
 * so it isn't covered here — see apps-v2.e2e-spec.ts's header for the full rationale.
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

  it('enforces the ExternalApiSecurityGuard and resolveWorkspaceByIdentifier', async () => {
    const { user } = await createUser(app, { email: `mv2-auth-${Date.now()}@tooljet.io` });
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
  // POST /modules — Create
  // ---------------------------------------------------------------------------

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/modules', () => {
    it('returns 400 when name is missing', async () => {
      const { user } = await createUser(app, { email: `mv2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('creates a module and returns {id, name} with no slug/folder_id', async () => {
      const { user } = await createUser(app, { email: `mv2-c2-${Date.now()}@tooljet.io` });
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

    it('rejects a duplicate module name (FINDING: 400 not 409), but allows sharing a name with an App', async () => {
      // Same as Apps v2 — AppsUtilService.create()'s pre-flight guard throws BadRequestException,
      // never reaching the catchDbException/APP_NAME_UNIQUE path that would 409. Spec explicitly
      // promises 409 here (api-spec-viewer.html:1061).
      const { user } = await createUser(app, { email: `mv2-c3-${Date.now()}@tooljet.io` });
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

      // The apps.name column's own DB-level unique index (app_name_organization_id_unique) is
      // NOT type-scoped, but it's moot: apps.name is always null for API-created resources, so
      // that constraint can never fire (Postgres treats NULL as distinct from NULL under a
      // unique index). The uniqueness check that actually runs, AppsUtilService.create()'s
      // pre-flight AppVersion.app_name query, IS type-scoped
      // (`.andWhere('app.type = :type', {type})`, server/src/modules/apps/util.service.ts:98).
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
    it('returns 404 for a nonexistent module and 400 when name is missing from the body', async () => {
      const { user } = await createUser(app, { email: `mv2-r1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);

      const seeded = await createApplication(app, { name: 'R', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('renames the module and rejects a name that already exists', async () => {
      // renameModuleV2 returns dto.name directly, bypassing the null apps.name read — this is
      // the one Modules v2 response that correctly reflects the name.
      const { user } = await createUser(app, { email: `mv2-r2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.MODULE });
      const res = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'New Name' })
        .expect(200);
      expect(res.body).toMatchObject({ id: seeded.id, name: 'New Name' });

      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Taken Name' })
        .expect(201);
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Taken Name' })
        .expect(409);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /modules — List
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules', () => {
    it('returns an empty list, then lists only module-type apps with correct shape', async () => {
      const { user } = await createUser(app, { email: `mv2-l1-${Date.now()}@tooljet.io` });

      const empty = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(empty.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });

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
      expect(res.body.data[0]).toMatchObject({ id: mod.body.id, name: 'Real Module' });
      expect(res.body.data[0]).not.toHaveProperty('slug');
      expect(res.body.data[0]).not.toHaveProperty('folder_id');
    });

    it('filters by ?search=, seeded via the real API, and paginates', async () => {
      const { user } = await createUser(app, { email: `mv2-l2-${Date.now()}@tooljet.io` });
      const findable = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Findable Widget' })
        .expect(201);
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post(base(user.defaultOrganizationId))
          .set('Authorization', getExtAuth())
          .send({ name: `Other Module ${i}` })
          .expect(201);
      }

      const searched = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?search=findable`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(searched.body.pagination.total_count).toBe(1);
      expect(searched.body.data[0].id).toBe(findable.body.id);

      const paged = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?page=1&per_page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(2);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /modules/:moduleIdentifier — Detail
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier', () => {
    it('returns 404 for a nonexistent module and for an App of the same id (type-scoped)', async () => {
      const { user } = await createUser(app, { email: `mv2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);

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

    it('resolves by id and by name', async () => {
      const { user } = await createUser(app, { email: `mv2-g2-${Date.now()}@tooljet.io` });
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
  // DELETE /modules/:moduleIdentifier
  // ---------------------------------------------------------------------------

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier', () => {
    it('returns 404 for a nonexistent module, and 204 + no-longer-resolvable on delete', async () => {
      const { user } = await createUser(app, { email: `mv2-d1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);

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
      const { user } = await createUser(app, { email: `mv2-d2-${Date.now()}@tooljet.io` });
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
    it('returns 400 when definition is missing', async () => {
      const { user } = await createUser(app, { email: `mv2-i1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('imports an exported module and it appears in the workspace listing', async () => {
      // Unlike Apps v2, importModuleV2 doesn't call generateWorkspaceSlug (no slug on modules).
      const { user } = await createUser(app, { email: `mv2-i2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Source Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, seeded);

      const exportRes = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(exportRes.body).toHaveProperty('definition');

      const { organization: otherOrg } = await createUser(app, { email: `mv2-i2-other-${Date.now()}@tooljet.io` });
      const importRes = await request(app.getHttpServer())
        .post(`${base(otherOrg.id)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: exportRes.body.definition })
        .expect(201);
      expect(importRes.body).toMatchObject({ name: 'Export Source Module' });

      const listRes = await request(app.getHttpServer())
        .get(base(otherOrg.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(listRes.body.pagination.total_count).toBe(1);
    });

    it('rejects a front-end app definition, and 422s on a newer tooljet_version (FINDING: code field not delivered)', async () => {
      const { user } = await createUser(app, { email: `mv2-i3-${Date.now()}@tooljet.io` });
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
        .send({ definition: { name: 'Future Module', tooljet_version: '9999.0.0' } })
        .expect(422);
      expect(versionRes.body.code).toBeUndefined();
      expect(versionRes.body.message).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // GET /modules/:moduleIdentifier/export — Export
  // ---------------------------------------------------------------------------

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier/export', () => {
    it('returns 404 for a nonexistent module, and {definition} with no version-list params', async () => {
      // Export Module v2 has no ?appVersion/?exportAllVersions (unlike Apps/Workflows) — mirrors
      // v1's exportModule signature exactly; not a bug, just an intentional asymmetry.
      const { user } = await createUser(app, { email: `mv2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);

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
