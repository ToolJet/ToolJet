/**
 * @group platform
 */

/**
 * One service serves all three folder types, so the suite runs once per type from the table below.
 * Gating and spec deviations: see apps-v2.e2e-spec.ts.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createFolder,
  createApplication,
  addAppToFolder,
  findEntity,
  NONEXISTENT_UUID,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { FolderApp } from '@entities/folder_app.entity';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

const FOLDER_KINDS = [
  {
    label: 'App Folders',
    type: APP_TYPES.FRONT_END,
    path: 'app-folders',
    otherType: APP_TYPES.MODULE,
    otherPath: 'module-folders',
    resourcePath: 'apps',
  },
  {
    label: 'Module Folders',
    type: APP_TYPES.MODULE,
    path: 'module-folders',
    otherType: APP_TYPES.WORKFLOW,
    otherPath: 'workflow-folders',
    resourcePath: 'modules',
  },
  {
    label: 'Workflow Folders',
    type: APP_TYPES.WORKFLOW,
    path: 'workflow-folders',
    otherType: APP_TYPES.FRONT_END,
    otherPath: 'app-folders',
    resourcePath: 'workflows',
  },
];

function base(workspaceId: string, path: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/${path}`;
}

describe('External API v2 Folders (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('should reject a request with no token', async () => {
    const { user } = await createUser(app, { email: `fv2-auth-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId, 'app-folders'))
      .send({ name: 'X' })
      .expect(403);
  });

  it('should reject a request with an invalid token', async () => {
    const { user } = await createUser(app, { email: `fv2-auth2-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId, 'app-folders'))
      .set('Authorization', 'Basic wrong-token')
      .send({ name: 'X' })
      .expect(403);
  });

  it('should 404 when the workspace identifier matches nothing', async () => {
    await request(app.getHttpServer())
      .post(base('not-a-real-workspace', 'app-folders'))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  for (const kind of FOLDER_KINDS) {
    describe(kind.label, () => {
      describe(`POST /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}`, () => {
        it('should reject a missing name', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({})
            .expect(400);
        });

        it('should reject an empty name', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c1b-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: '' })
            .expect(400);
        });

        it('should reject a whitespace-only name', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c1c-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: '   ' })
            .expect(400);
        });

        it('should reject a name with disallowed characters', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c1d-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Invalid/Name*Here' })
            .expect(400);
        });

        it('should create a folder', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c2-${Date.now()}@tooljet.io` });
          const res = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Internal Tools' })
            .expect(201);
          expect(res.body).toMatchObject({ name: 'Internal Tools' });
        });

        it('should allow a different folder type to reuse the same name', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c2b-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Internal Tools' })
            .expect(201);
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.otherPath))
            .set('Authorization', getExtAuth())
            .send({ name: 'Internal Tools' })
            .expect(201);
        });

        it('should 409 when a folder with the same name and type already exists', async () => {
          // Must be last in the test: the failed INSERT poisons the rest of the transaction.
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c3-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Dup Folder' })
            .expect(201);
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Dup Folder' })
            .expect(409);
        });
      });

      describe(`GET /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}`, () => {
        it('should return an empty list for a workspace with no folders of this type', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l1-${Date.now()}@tooljet.io` });
          const empty = await request(app.getHttpServer())
            .get(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(empty.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });
        });

        it('should list only folders of this type', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l1b-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Mine' })
            .expect(201);
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.otherPath))
            .set('Authorization', getExtAuth())
            .send({ name: 'Not Mine' })
            .expect(201);

          const res = await request(app.getHttpServer())
            .get(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(res.body.pagination.total_count).toBe(1);
          expect(res.body.data[0].name).toBe('Mine');
        });

        it('should match folders by name when search is given', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l2-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Findable Folder' })
            .expect(201);
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Something Else' })
            .expect(201);

          const searched = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}?search=findable`)
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(searched.body.pagination.total_count).toBe(1);
          expect(searched.body.data[0].name).toBe('Findable Folder');
        });

        it('should page results with page and per_page', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l2b-${Date.now()}@tooljet.io` });
          for (let i = 0; i < 3; i++) {
            await request(app.getHttpServer())
              .post(base(user.defaultOrganizationId, kind.path))
              .set('Authorization', getExtAuth())
              .send({ name: `Folder ${i}` })
              .expect(201);
          }

          const paged = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}?page=1&per_page=2`)
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(paged.body.data).toHaveLength(2);
          expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
        });
      });

      describe(`GET /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('should 404 for a nonexistent folder', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-g1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .expect(404);
        });

        it('should 404 for a different folder type sharing the id', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-g1b-${Date.now()}@tooljet.io` });
          const otherKindFolder = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.otherPath))
            .set('Authorization', getExtAuth())
            .send({ name: 'Only In Other Type' })
            .expect(201);
          await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${otherKindFolder.body.id}`)
            .set('Authorization', getExtAuth())
            .expect(404);
        });

        it('should resolve by id and by name', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-g2-${Date.now()}@tooljet.io` });
          const uniqueName = `Resolve Me ${Date.now()}`;
          const created = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: uniqueName })
            .expect(201);

          const byId = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(byId.body).toMatchObject({ id: created.body.id, name: uniqueName });

          const byName = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${encodeURIComponent(uniqueName)}`)
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(byName.body.id).toBe(created.body.id);
        });
      });

      describe(`PATCH /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('should 404 for a nonexistent folder', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .patch(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .send({ name: 'Renamed' })
            .expect(404);
        });

        it('should 400 when name is missing', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u1b-${Date.now()}@tooljet.io` });
          const created = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'To Rename' })
            .expect(201);
          await request(app.getHttpServer())
            .patch(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .send({})
            .expect(400);
        });

        it('should rename the folder', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u2-${Date.now()}@tooljet.io` });
          const created = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Old Folder Name' })
            .expect(201);

          const res = await request(app.getHttpServer())
            .patch(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .send({ name: 'New Folder Name' })
            .expect(200);
          expect(res.body).toMatchObject({ id: created.body.id, name: 'New Folder Name' });
        });

        it('should 409 when renaming to a name that already exists for this folder type', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u3-${Date.now()}@tooljet.io` });
          const created = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Old Folder Name' })
            .expect(201);
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Taken Folder Name' })
            .expect(201);
          await request(app.getHttpServer())
            .patch(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .send({ name: 'Taken Folder Name' })
            .expect(409);
        });
      });

      describe(`DELETE /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('should 404 for a nonexistent folder', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-x1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .delete(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .expect(404);
        });

        it('should delete the folder', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-x1b-${Date.now()}@tooljet.io` });
          const created = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'To Delete' })
            .expect(201);
          await request(app.getHttpServer())
            .delete(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .expect(204);
          await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .expect(404);
        });

        if (kind.type !== APP_TYPES.MODULE) {
          it('should unfolder its resources without deleting them', async () => {
            const { user } = await createUser(app, { email: `fv2-${kind.path}-x2-${Date.now()}@tooljet.io` });
            const folder = await createFolder(app, {
              name: 'Folder With Resource',
              type: kind.type,
              organizationId: user.defaultOrganizationId,
            });
            const created = await request(app.getHttpServer())
              .post(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/${kind.resourcePath}`)
              .set('Authorization', getExtAuth())
              .send({ name: 'Resource In Folder', folder_id: folder.id })
              .expect(201);

            await request(app.getHttpServer())
              .delete(`${base(user.defaultOrganizationId, kind.path)}/${folder.id}`)
              .set('Authorization', getExtAuth())
              .expect(204);

            const resourceRes = await request(app.getHttpServer())
              .get(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/${kind.resourcePath}/${created.body.id}`)
              .set('Authorization', getExtAuth())
              .expect(200);
            expect(resourceRes.body.folder_id).toBeNull();
          });
        }
      });
    });
  }

  describe('Module folders cascade', () => {
    // Modules v2 has no folder_id in its request/response (spec deviation #3), so unlike
    // Apps/Workflows this can't be driven or asserted through the Modules API — it links the
    // module to the folder directly and checks the join row instead.
    it('should delete a module folder without deleting the module inside it', async () => {
      const { user } = await createUser(app, { email: `fv2-module-folders-x2-${Date.now()}@tooljet.io` });
      const folder = await createFolder(app, {
        name: 'Folder With Module',
        type: APP_TYPES.MODULE,
        organizationId: user.defaultOrganizationId,
      });
      const module = await createApplication(app, { name: 'Resource In Folder', user, type: APP_TYPES.MODULE });
      await addAppToFolder(app, module, folder);

      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId, 'module-folders')}/${folder.id}`)
        .set('Authorization', getExtAuth())
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/modules/${module.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(await findEntity(FolderApp, { folderId: folder.id, appId: module.id })).toBeNull();
    });
  });
});
