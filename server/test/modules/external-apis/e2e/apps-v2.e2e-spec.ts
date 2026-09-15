/**
 * @group platform
 */

/**
 * External API v2 — Apps (`api-spec-viewer.html` §3)
 *
 * Routes under /api/v2/ext/workspaces/:workspaceIdentifier/apps (all EE, gated by
 * FEATURE_KEY.*_APP_V2, license EXTERNAL_API). CE/starter edition-and-plan gating is exercised
 * once below (shared FeatureAbilityGuard/ExternalApiSecurityGuard infrastructure, identical
 * across every v2 resource) — the other three v2 suites don't repeat it.
 *
 * Known, deliberate spec deviations (do not "fix" these tests to match the spec):
 *   1. Error body shape is NestJS's default AllExceptionsFilter ({statusCode, message, ...}),
 *      not the spec's {error:{code,message,status}}.
 *   2. workspaceIdentifier/appIdentifier are never format-validated (no ParseUUIDPipe) — a
 *      garbage string is simply tried as slug/name and 404s if nothing matches, unlike v1
 *      which 400s on a malformed UUID.
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
  findEntity,
  saveEntity,
  NONEXISTENT_UUID,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { AppsUtilService } from '@ee/apps/util.service';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/apps`;
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

  it('should reject a request with no token', async () => {
    const { user } = await createUser(app, { email: `av2-auth-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer()).post(base(user.defaultOrganizationId)).send({ name: 'X' }).expect(403);
  });

  it('should reject a request with an invalid token', async () => {
    const { user } = await createUser(app, { email: `av2-auth2-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId))
      .set('Authorization', 'Basic wrong-token')
      .send({ name: 'X' })
      .expect(403);
  });

  it('should 404 when the workspace identifier matches nothing', async () => {
    // Deviation #2 — a non-UUID identifier is tried as a slug/name, not rejected as malformed.
    await request(app.getHttpServer())
      .post(base('not-a-real-workspace'))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/apps', () => {
    it('should return 400 when name is missing', async () => {
      const { user } = await createUser(app, { email: `av2-c1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should reject a name containing a slash', async () => {
      const { user } = await createUser(app, { email: `av2-c1b-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Bad/Name' })
        .expect(400);
    });

    it('should create an app', async () => {
      const { user } = await createUser(app, { email: `av2-c2-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Bug Tracker' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Bug Tracker', folder_id: null });
    });

    it('should default the slug to the app id when none is given', async () => {
      const { user } = await createUser(app, { email: `av2-c2b-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Bug Tracker' })
        .expect(201);

      expect(res.body.slug).toBe(res.body.id);
    });

    it('should accept a custom slug', async () => {
      const { user } = await createUser(app, { email: `av2-c2c-${Date.now()}@tooljet.io` });
      const res = await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Custom Slug App', slug: `custom-slug-${Date.now()}` })
        .expect(201);
      expect(res.body.slug).toContain('custom-slug-');
    });

    it('should create an app inside a folder, by id or by name', async () => {
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
    });

    it('should reject a folder_id belonging to a folder of a different resource type', async () => {
      const { user } = await createUser(app, { email: `av2-c3b-${Date.now()}@tooljet.io` });
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

    it('should reject a nonexistent folder_id', async () => {
      const { user } = await createUser(app, { email: `av2-c3c-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .send({ name: 'Missing Folder App', folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('should 409 on a duplicate app name in the workspace', async () => {
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
        .expect(409);
    });
  });

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier', () => {
    it('should 404 for a nonexistent app', async () => {
      const { user } = await createUser(app, { email: `av2-r1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'Renamed' })
        .expect(404);
    });

    it('should 400 on an empty body', async () => {
      const { user } = await createUser(app, { email: `av2-r1b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'R', user });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should rename the app', async () => {
      const { user } = await createUser(app, { email: `av2-r2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user });

      const renamed = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'New Name' })
        .expect(200);
      expect(renamed.body).toMatchObject({ id: seeded.id, name: 'New Name' });
    });

    it('should move the app into a folder', async () => {
      const { user } = await createUser(app, { email: `av2-r2b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user });
      const folder = await createFolder(app, {
        name: 'Destination Folder',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });

      const moved = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: folder.id })
        .expect(200);
      expect(moved.body.folder_id).toBe(folder.id);
    });

    it('should move the app from one folder to another', async () => {
      const { user } = await createUser(app, { email: `av2-r2c-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user });
      const folderA = await createFolder(app, {
        name: 'Folder A',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });
      const folderB = await createFolder(app, {
        name: 'Folder B',
        type: APP_TYPES.FRONT_END,
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

    it('should clear the folder', async () => {
      const { user } = await createUser(app, { email: `av2-r2d-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user });
      const folder = await createFolder(app, {
        name: 'Destination Folder',
        type: APP_TYPES.FRONT_END,
        organizationId: user.defaultOrganizationId,
      });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: folder.id })
        .expect(200);

      const cleared = await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: null })
        .expect(200);
      expect(cleared.body.folder_id).toBeNull();
    });

    it('should reject a nonexistent folder_id', async () => {
      const { user } = await createUser(app, { email: `av2-r2e-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Old Name', user });
      await request(app.getHttpServer())
        .patch(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .send({ folder_id: NONEXISTENT_UUID })
        .expect(422);
    });

    it('should 409 when renaming to a name that already exists in the workspace', async () => {
      // Seed via the endpoint: the uniqueness check reads app_versions.app_name, which
      // createApplication() leaves unseeded.
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

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps', () => {
    it('should return an empty list for a workspace with no apps', async () => {
      const { user } = await createUser(app, { email: `av2-l1-${Date.now()}@tooljet.io` });
      const empty = await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId))
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(empty.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });
    });

    it('should list apps scoped to the workspace, excluding modules and workflows', async () => {
      const { user } = await createUser(app, { email: `av2-l1b-${Date.now()}@tooljet.io` });
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

    it('should match apps by name when search is given', async () => {
      // Seed via the endpoint so ?search= hits the app_versions-backed name.
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

    it('should list only apps outside any folder when folder_id is null', async () => {
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

      const unfoldered = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?folder_id=null`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(unfoldered.body.pagination.total_count).toBe(1);
      expect(unfoldered.body.data.map((a: { id: string }) => a.id)).toContain(notInFolder.body.id);
    });

    it('should list only apps in the named folder', async () => {
      const { user } = await createUser(app, { email: `av2-l3b-${Date.now()}@tooljet.io` });
      const folder = await createFolder(app, {
        name: 'Filter Folder',
        type: APP_TYPES.FRONT_END,
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
      const { user } = await createUser(app, { email: `av2-l3c-${Date.now()}@tooljet.io` });
      await createApplication(app, { name: 'App One', user });
      await createApplication(app, { name: 'App Two', user });
      await createApplication(app, { name: 'App Three', user });

      const paged = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?page=1&per_page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(2);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
    });

    it('should reject a per_page above 100', async () => {
      const { user } = await createUser(app, { email: `av2-l3d-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}?per_page=101`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier', () => {
    it('should 404 for a nonexistent app', async () => {
      const { user } = await createUser(app, { email: `av2-g1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should 404 for an app in another workspace', async () => {
      const { user } = await createUser(app, { email: `av2-g1b-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `av2-g1-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Owned By Someone Else', user });
      await request(app.getHttpServer())
        .get(`${base(otherOrg.id)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should resolve by id, by slug, and by name', async () => {
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

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier', () => {
    it('should 404 for a nonexistent app', async () => {
      const { user } = await createUser(app, { email: `av2-d1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should 404 when the id belongs to a module', async () => {
      const { user } = await createUser(app, { email: `av2-d1b-${Date.now()}@tooljet.io` });
      const module = await createApplication(app, { name: 'A Module', user, type: APP_TYPES.MODULE }, false);
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${module.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should delete the app and clean up its data query folders', async () => {
      const { user } = await createUser(app, { email: `av2-d2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'To Delete', user });
      const version = await createApplicationVersion(app, seeded);
      await saveEntity(DataQueryFolder, { name: 'A Folder', appVersionId: version.id });

      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(204);

      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}`)
        .set('Authorization', getExtAuth())
        .expect(404);
      expect(await findEntity(DataQueryFolder, { appVersionId: version.id })).toBeNull();
    });
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/apps/import', () => {
    it('should return 400 when definition is missing', async () => {
      const { user } = await createUser(app, { email: `av2-i1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(`${base(user.defaultOrganizationId)}/import`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);
    });

    it('should import an exported app and have it appear in the workspace listing', async () => {
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

    it('should reject a module definition', async () => {
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
    });

    it('should 409 on a duplicate name/slug on import', async () => {
      const { user } = await createUser(app, { email: `av2-i3b-${Date.now()}@tooljet.io` });
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
        .expect(409);
    });

    it('should return 422 (without a machine-readable code) when tooljet_version is newer than the server', async () => {
      // AllExceptionsFilter reads exception.code, but the code sits on exception.response.code,
      // so it never reaches the body.
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

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier/export', () => {
    it('should 404 for a nonexistent app', async () => {
      const { user } = await createUser(app, { email: `av2-e1-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${NONEXISTENT_UUID}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it('should return {definition} with no credentials on success', async () => {
      const { user } = await createUser(app, { email: `av2-e1b-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export Shape App', user });
      await createApplicationVersion(app, seeded);
      const res = await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(Object.keys(res.body)).toEqual(['definition']);
      expect(res.body.definition).toHaveProperty('tooljet_version');
    });

    it('should check for TJDB tables when exportTJDB is set', async () => {
      const { user } = await createUser(app, { email: `av2-e2-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Export TJDB App', user });
      await createApplicationVersion(app, seeded);
      const tjdbSpy = jest.spyOn(app.get(AppsUtilService), 'findTooljetDbTables');

      await request(app.getHttpServer())
        .get(`${base(user.defaultOrganizationId)}/${seeded.id}/export?exportTJDB=true`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(tjdbSpy).toHaveBeenCalledWith(seeded.id);
    });

    it('should 404 for an app in another workspace', async () => {
      const { user } = await createUser(app, { email: `av2-e3-${Date.now()}@tooljet.io` });
      const { organization: otherOrg } = await createUser(app, { email: `av2-e3-other-${Date.now()}@tooljet.io` });
      const seeded = await createApplication(app, { name: 'Cross Workspace Export', user });
      await createApplicationVersion(app, seeded);
      await request(app.getHttpServer())
        .get(`${base(otherOrg.id)}/${seeded.id}/export`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });
});

describe('ExternalApisAppsControllerV2 (EE plan: starter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should reject v2 routes on the starter plan', async () => {
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

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should not register the v2 routes on CE', async () => {
    const { user } = await createUser(app, { email: `av2-ce-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId))
      .set('Authorization', getExtAuth())
      .expect(404);
  });
});
