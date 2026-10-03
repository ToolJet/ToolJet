/**
 * @group platform
 */

/**
 * Gating and spec deviations: see apps-v2.e2e-spec.ts.
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
  createFolder,
  NONEXISTENT_UUID,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/workflows`;
}

describe('ExternalApisWorkflowsControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('should reject a request with no token', async () => {
    const { user } = await createUser(app, { email: `wv2-auth-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer()).post(base(user.defaultOrganizationId)).send({ name: 'X' }).expect(403);
  });

  it('should reject a request with an invalid token', async () => {
    const { user } = await createUser(app, { email: `wv2-auth2-${Date.now()}@tooljet.io` });
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

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/workflows', () => {
    it('should return 400 when name is missing', async () => {
      const { user } = await createUser(app, { email: `wv2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should create a workflow and return {id, name, folder_id} with no slug', async () => {
      const { user } = await createUser(app, { email: `wv2-c2-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Nightly Data Sync' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Nightly Data Sync', folder_id: null });
      expect(res.body).not.toHaveProperty('slug');
    });

    it('should create a workflow inside a folder by id', async () => {
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
    });

    it('should reject a folder_id belonging to a folder of a different resource type', async () => {
      const { user } = await createUser(app, { email: `wv2-c3b-${Date.now()}@tooljet.io` });
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

    it('should reject a nonexistent folder_id', async () => {
      const { user } = await createUser(app, { email: `wv2-c3c-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Missing Folder Workflow', folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('should 409 on a duplicate workflow name in the workspace', async () => {
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
        .expect(409);
    });
  });

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier', () => {
    it('should 404 for a nonexistent workflow', async () => {
      const { user } = await createUser(app, { email: `wv2-r1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);
    });

    it('should 400 when the body has neither name nor folder_id', async () => {
      const { user } = await createUser(app, { email: `wv2-r1b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R3', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should rename the workflow', async () => {
      const { user } = await createUser(app, { email: `wv2-r2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.WORKFLOW });
      const renamed = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'New Name' })
        .expect(200);
      expect(renamed.body).toMatchObject({ id: seeded.id, name: 'New Name' });
    });

    it('should move the workflow into a folder and clear it', async () => {
      const { user } = await createUser(app, { email: `wv2-r2b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.WORKFLOW });
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

    it('should move the workflow from one folder to another', async () => {
      const { user } = await createUser(app, { email: `wv2-r2c-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.WORKFLOW });
      const folderA = await createFolder(app, {
        name: 'Folder A',
        type: APP_TYPES.WORKFLOW,
        organizationId: user.defaultOrganizationId,
      });
      const folderB = await createFolder(app, {
        name: 'Folder B',
        type: APP_TYPES.WORKFLOW,
        organizationId: user.defaultOrganizationId,
      });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: folderA.id })
        .expect(200);

      const moved = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: folderB.id })
        .expect(200);
      expect(moved.body.folder_id).toBe(folderB.id);
    });

    it('should reject a nonexistent folder_id', async () => {
      const { user } = await createUser(app, { email: `wv2-r2d-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('should 409 when renaming to a name that already exists in the workspace', async () => {
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

    it('should 404 for a workflow in another workspace', async () => {
      const { user } = await createUser(app, { email: `wv2-r4-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `wv2-r4-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .patch(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/workflows', () => {
    it('should return an empty list for a workspace with no workflows', async () => {
      const { user } = await createUser(app, { email: `wv2-l1-${Date.now()}@tooljet.io` });
      const empty = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(empty.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });
    });

    it('should list only workflow-type apps with the correct shape', async () => {
      const { user } = await createUser(app, { email: `wv2-l1b-${Date.now()}@tooljet.io` });
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

    it('should match workflows by name when search is given', async () => {
      const { user } = await createUser(app, { email: `wv2-l2-${Date.now()}@tooljet.io` });
      const findable = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Findable Workflow' })
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

    it('should list only workflows outside any folder when folder_id is null', async () => {
      const { user } = await createUser(app, { email: `wv2-l3-${Date.now()}@tooljet.io` });
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

      const unfoldered = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?folder_id=null`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(unfoldered.body.pagination.total_count).toBe(1);
      expect(unfoldered.body.data.map((w: { id: string }) => w.id)).toContain(notInFolder.body.id);
    });

    it('should list only workflows in the named folder', async () => {
      const { user } = await createUser(app, { email: `wv2-l3b-${Date.now()}@tooljet.io` });
      const folder = await createFolder(app, {
        name: 'Filter Folder',
        type: APP_TYPES.WORKFLOW,
        organizationId: user.defaultOrganizationId,
      });
      const inFolder = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'In Folder', folder_id: folder.id })
        .expect(201);
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Not In Folder' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?folder_id=${folder.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body.pagination.total_count).toBe(1);
      expect(res.body.data[0].id).toBe(inFolder.body.id);
    });

    it('should page results with page and per_page', async () => {
      const { user } = await createUser(app, { email: `wv2-l3c-${Date.now()}@tooljet.io` });
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post(base(user.defaultOrganizationId))
          .set('Authorization', getExtAuth())
          .send({ name: `Page Workflow ${i}` })
          .expect(201);
      }

      const paged = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?page=1&per_page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(2);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
    });

    it('should reject a per_page above 100', async () => {
      const { user } = await createUser(app, { email: `wv2-l3d-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?per_page=101`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('should 404 for a workflow in another workspace', async () => {
      const { user } = await createUser(app, { email: `wv2-l4-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `wv2-l4-other-${Date.now()}@tooljet.io` });
      await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.WORKFLOW });
      const res = await request(app.getHttpServer())
        .get(base(otherOrg.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body.pagination.total_count).toBe(0);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier', () => {
    it('should 404 for a nonexistent workflow', async () => {
      const { user } = await createUser(app, { email: `wv2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should resolve by id and by name', async () => {
      const { user } = await createUser(app, { email: `wv2-g2-${Date.now()}@tooljet.io` });
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

    it('should 404 for a workflow in another workspace', async () => {
      const { user } = await createUser(app, { email: `wv2-g3-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `wv2-g3-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .get(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier', () => {
    it('should 404 for a nonexistent workflow', async () => {
      const { user } = await createUser(app, { email: `wv2-d1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should delete the workflow', async () => {
      const { user } = await createUser(app, { email: `wv2-d1b-${Date.now()}@tooljet.io` });
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

    it('should 404 for a workflow in another workspace', async () => {
      const { user } = await createUser(app, { email: `wv2-d2-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `wv2-d2-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .delete(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/workflows/import', () => {
    it('should return 400 when definition is missing', async () => {
      const { user } = await createUser(app, { email: `wv2-i1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should import an exported workflow and have it appear in the workspace listing', async () => {
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

    it('should reject a front-end app definition', async () => {
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

    it('should 409 on a duplicate name/slug on import', async () => {
      const { user } = await createUser(app, { email: `wv2-i3b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Reimport Me', user, type: APP_TYPES.WORKFLOW });
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
      const { user } = await createUser(app, { email: `wv2-i4-${Date.now()}@tooljet.io` });
      const versionRes = await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({ definition: { name: 'Future Workflow', tooljet_version: '9999.0.0' } })
        .expect(422);
      expect(versionRes.body.code).toBeUndefined();
      expect(versionRes.body.message).toBeTruthy();
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/workflows/:workflowIdentifier/export', () => {
    it('should 404 for a nonexistent workflow', async () => {
      const { user } = await createUser(app, { email: `wv2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should return {definition} on success', async () => {
      const { user } = await createUser(app, { email: `wv2-e1b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Shape Workflow', user, type: APP_TYPES.WORKFLOW });
      await createApplicationVersion(app, seeded);
      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(Object.keys(res.body)).toEqual(['definition']);
      expect(res.body.definition).toHaveProperty('tooljet_version');
    });

    it('should 404 for a workflow in another workspace', async () => {
      const { user } = await createUser(app, { email: `wv2-e2-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `wv2-e2-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned Elsewhere', user, type: APP_TYPES.WORKFLOW });
      await request(app.getHttpServer())
        .get(`${base(otherOrg.id)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });
});
