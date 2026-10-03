/**
 * @group platform
 */

/**
 * Gating and spec deviations: see apps-v2.e2e-spec.ts.
 * Modules have no folder_id in v2, unlike the spec.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
  NONEXISTENT_UUID,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/modules`;
}

describe('ExternalApisModulesControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('should reject a request with no token', async () => {
    const { user } = await createUser(app, { email: `mv2-auth-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer()).post(base(user.defaultOrganizationId)).send({ name: 'X' }).expect(403);
  });

  it('should reject a request with an invalid token', async () => {
    const { user } = await createUser(app, { email: `mv2-auth2-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId))
      .set('Authorization', 'Basic wrong-token')
      .send({ name: 'X' })
      .expect(403);
  });

  it('should 404 when the workspace identifier matches nothing', async () => {
    await request(app.getHttpServer())
      .post(base('not-a-real-workspace'))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/modules', () => {
    it('should return 400 when name is missing', async () => {
      const { user } = await createUser(app, { email: `mv2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should create a module and return {id, name} with no slug/folder_id', async () => {
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

    it('should 409 on a duplicate module name', async () => {
      // create()'s pre-flight check throws BadRequestException before the path that would 409.
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
        .expect(409);
    });

    it('should allow a module to share a name with an App', async () => {
      const { user } = await createUser(app, { email: `mv2-c3b-${Date.now()}@tooljet.io` });
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

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier', () => {
    it('should 404 for a nonexistent module', async () => {
      const { user } = await createUser(app, { email: `mv2-r1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);
    });

    it('should 400 when name is missing from the body', async () => {
      const { user } = await createUser(app, { email: `mv2-r1b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should rename the module', async () => {
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
    });

    it('should 409 when renaming to a name that already exists', async () => {
      const { user } = await createUser(app, { email: `mv2-r2b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.MODULE });
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

    it('should 404 for a module in another workspace', async () => {
      const { user } = await createUser(app, { email: `mv2-r3-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `mv2-r3-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .patch(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules', () => {
    it('should return an empty list for a workspace with no modules', async () => {
      const { user } = await createUser(app, { email: `mv2-l1-${Date.now()}@tooljet.io` });
      const empty = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(empty.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });
    });

    it('should list only module-type apps with the correct shape', async () => {
      const { user } = await createUser(app, { email: `mv2-l1b-${Date.now()}@tooljet.io` });
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

    it('should match modules by name when search is given', async () => {
      const { user } = await createUser(app, { email: `mv2-l2-${Date.now()}@tooljet.io` });
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

      const searched = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?search=findable`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(searched.body.pagination.total_count).toBe(1);
      expect(searched.body.data[0].id).toBe(findable.body.id);
    });

    it('should page results with page and per_page', async () => {
      const { user } = await createUser(app, { email: `mv2-l2b-${Date.now()}@tooljet.io` });
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post(base(user.defaultOrganizationId))
          .set('Authorization', getExtAuth())
          .send({ name: `Module ${i}` })
          .expect(201);
      }

      const paged = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?page=1&per_page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(2);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
    });

    it('should 404 for a module in another workspace', async () => {
      const { user } = await createUser(app, { email: `mv2-l3-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `mv2-l3-other-${Date.now()}@tooljet.io` });
      await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.MODULE });
      const res = await request(app.getHttpServer())
        .get(base(otherOrg.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body.pagination.total_count).toBe(0);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier', () => {
    it('should 404 for a nonexistent module', async () => {
      const { user } = await createUser(app, { email: `mv2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should 404 for an App of the same id (type-scoped)', async () => {
      const { user } = await createUser(app, { email: `mv2-g1b-${Date.now()}@tooljet.io` });
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

    it('should resolve by id and by name', async () => {
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

    it('should 404 for a module in another workspace', async () => {
      const { user } = await createUser(app, { email: `mv2-g3-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `mv2-g3-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .get(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier', () => {
    it('should 404 for a nonexistent module', async () => {
      const { user } = await createUser(app, { email: `mv2-d1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should delete the module', async () => {
      const { user } = await createUser(app, { email: `mv2-d1b-${Date.now()}@tooljet.io` });
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

    it('should 400 when the module is referenced by a ModuleViewer component in another app', async () => {
      // Delete-time guard unique to Modules (service.ts:1197-1209) — not present for Apps/Workflows.
      const { user } = await createUser(app, { email: `mv2-d2-${Date.now()}@tooljet.io` });
      const seededModule = await createApplication(app, { name: 'In Use Module', user, type: APP_TYPES.MODULE });
      const referencingApp = await createApplication(app, { name: 'Referencing App', user, type: APP_TYPES.FRONT_END });
      const version = await createApplicationVersion(app, referencingApp);

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

    it('should 404 for a module in another workspace', async () => {
      const { user } = await createUser(app, { email: `mv2-d3-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `mv2-d3-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .delete(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/modules/import', () => {
    it('should return 400 when definition is missing', async () => {
      const { user } = await createUser(app, { email: `mv2-i1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should import an exported module and have it appear in the workspace listing', async () => {
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

    it('should reject a front-end app definition', async () => {
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
    });

    it('should 409 on a duplicate name/slug on import', async () => {
      const { user } = await createUser(app, { email: `mv2-i3b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Reimport Me', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, seeded);
      const selfExport = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: selfExport.body.definition })
        .expect(409);
    });

    it('should return 422 (without a machine-readable code) when tooljet_version is newer than the server', async () => {
      const { user } = await createUser(app, { email: `mv2-i4-${Date.now()}@tooljet.io` });
      const versionRes = await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: { name: 'Future Module', tooljet_version: '9999.0.0' } })
        .expect(422);
      expect(versionRes.body.code).toBeUndefined();
      expect(versionRes.body.message).toBeTruthy();
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/modules/:moduleIdentifier/export', () => {
    it('should 404 for a nonexistent module', async () => {
      const { user } = await createUser(app, { email: `mv2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should return {definition} with no version-list params', async () => {
      // Module export takes no appVersion/exportAllVersions, matching v1.
      const { user } = await createUser(app, { email: `mv2-e1b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Shape Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, seeded);
      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export?appVersion=ignored&exportAllVersions=true`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(Object.keys(res.body)).toEqual(['definition']);
      expect(res.body.definition).toHaveProperty('tooljet_version');
    });

    it('should 404 for a module in another workspace', async () => {
      const { user } = await createUser(app, { email: `mv2-e2-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `mv2-e2-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .get(`${base(otherOrg.id)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });
});
