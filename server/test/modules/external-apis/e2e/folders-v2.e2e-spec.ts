/**
 * @group platform
 */

/**
 * External API v2 — App/Module/Workflow Folders (`api-spec-viewer.html` §6)
 *
 * Routes under /api/v2/ext/workspaces/:workspaceIdentifier/{app,module,workflow}-folders (all
 * EE, gated by FEATURE_KEY.*_{APP,MODULE,WORKFLOW}_FOLDER_V2, license EXTERNAL_API). One shared
 * service implementation (server/ee/external-apis/service.ts:1611-1695) parameterized by
 * APP_TYPES, called by three thin controllers — so this file drives the same suite of
 * assertions across all three folder types via a small config table, rather than tripling the
 * code by hand.
 *
 * Unlike Apps/Modules/Workflows, Folder is its own entity with a real `name` column
 * (server/src/entities/folder.entity.ts) — there is no app_versions-style split, so (unlike
 * the other three v2 resources) Create/Get/List do NOT show a name: null bug here. Confirmed
 * empirically below, not assumed.
 *
 * Known, deliberate spec deviations — same as apps-v2.e2e-spec.ts:
 *   1. Error body shape is NestJS's default AllExceptionsFilter, not the spec's {error:{...}}.
 *   2. workspaceIdentifier/folderIdentifier are never format-validated.
 *
 * Confirmed bug found while writing these tests: CreateFolderV2Dto reuses
 * AllowedCharactersValidator from server/src/modules/folders/dto/index.ts, whose validate()
 * does `value.match(...)` with no undefined guard. When `name` is omitted entirely (not just
 * empty), class-validator still runs this custom constraint, which throws a raw TypeError
 * instead of failing validation cleanly — the ValidationPipe doesn't catch it, so it reaches
 * AllExceptionsFilter as an unhandled exception and returns 500, not the expected 400. This is
 * a pre-existing issue in the shared internal folders DTO, not v2-specific code, but it now
 * also affects the v2 Folders API's error handling.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createUser as createUserBase,
  initTestApp,
  closeTestApp,
  createFolder,
  createApplication,
  ensureAppEnvironments,
  NONEXISTENT_UUID,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

// See apps-v2.e2e-spec.ts — createUser() doesn't seed AppEnvironment rows the way real
// workspace onboarding does; needed here for the cascade test, which creates a real App/Workflow.
async function createUser(app: INestApplication, opts: Parameters<typeof createUserBase>[1]) {
  const result = await createUserBase(app, opts);
  await ensureAppEnvironments(app, result.organization.id);
  return result;
}

const FOLDER_KINDS = [
  {
    label: 'App Folders',
    type: APP_TYPES.FRONT_END,
    path: 'app-folders',
    otherType: APP_TYPES.MODULE,
    otherPath: 'module-folders',
  },
  {
    label: 'Module Folders',
    type: APP_TYPES.MODULE,
    path: 'module-folders',
    otherType: APP_TYPES.WORKFLOW,
    otherPath: 'workflow-folders',
  },
  {
    label: 'Workflow Folders',
    type: APP_TYPES.WORKFLOW,
    path: 'workflow-folders',
    otherType: APP_TYPES.FRONT_END,
    otherPath: 'app-folders',
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

  for (const kind of FOLDER_KINDS) {
    describe(kind.label, () => {
      // -----------------------------------------------------------------------
      // POST — Create
      // -----------------------------------------------------------------------

      describe(`POST /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}`, () => {
        it('returns 403 without Authorization header', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .send({ name: 'X' })
            .expect(403);
        });

        it('returns 404 when the workspace does not resolve', async () => {
          await request(app.getHttpServer())
            .post(base('not-a-real-workspace', kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'X' })
            .expect(404);
        });

        it('rejects a missing name (FINDING: 500, not 400 — see AllowedCharactersValidator note above)', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c2-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({})
            .expect(500);
        });

        it('creates a folder and returns {id, name} with the real name (no null-name bug)', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c3-${Date.now()}@tooljet.io` });
          const res = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Internal Tools' })
            .expect(201);

          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Internal Tools');
        });

        it('returns 409 when a folder with the same name and type already exists', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c4-${Date.now()}@tooljet.io` });
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

        it('a folder of a different type can share the same name (type-scoped uniqueness)', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c5-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Cross Type Folder Name' })
            .expect(201);

          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.otherPath))
            .set('Authorization', getExtAuth())
            .send({ name: 'Cross Type Folder Name' })
            .expect(201);
        });

        it('rejects a name with disallowed special characters', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c6-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Invalid/Name*Here' })
            .expect(400);
        });
      });

      // -----------------------------------------------------------------------
      // GET (list)
      // -----------------------------------------------------------------------

      describe(`GET /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}`, () => {
        it('returns 403 without Authorization header', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer()).get(base(user.defaultOrganizationId, kind.path)).expect(403);
        });

        it('returns an empty list with pagination shape', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l2-${Date.now()}@tooljet.io` });
          const res = await request(app.getHttpServer())
            .get(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .expect(200);

          expect(res.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });
        });

        it('lists folders of this type only, excluding other folder types', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l3-${Date.now()}@tooljet.io` });
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

        it('filters by ?search= against name', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l4-${Date.now()}@tooljet.io` });
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

          const res = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}?search=findable`)
            .set('Authorization', getExtAuth())
            .expect(200);

          expect(res.body.pagination.total_count).toBe(1);
          expect(res.body.data[0].name).toBe('Findable Folder');
        });

        it('paginates with ?page and ?per_page', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l5-${Date.now()}@tooljet.io` });
          for (let i = 0; i < 3; i++) {
            await request(app.getHttpServer())
              .post(base(user.defaultOrganizationId, kind.path))
              .set('Authorization', getExtAuth())
              .send({ name: `Page Folder ${i}` })
              .expect(201);
          }

          const res = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}?page=1&per_page=2`)
            .set('Authorization', getExtAuth())
            .expect(200);

          expect(res.body.data).toHaveLength(2);
          expect(res.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
        });
      });

      // -----------------------------------------------------------------------
      // GET :folderIdentifier — Detail
      // -----------------------------------------------------------------------

      describe(`GET /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('returns 404 when the folder does not exist', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-g1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .expect(404);
        });

        it('resolves by id', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-g2-${Date.now()}@tooljet.io` });
          const created = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Resolve By Id' })
            .expect(201);

          const res = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .expect(200);

          expect(res.body).toMatchObject({ id: created.body.id, name: 'Resolve By Id' });
        });

        it('resolves by name', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-g3-${Date.now()}@tooljet.io` });
          const uniqueName = `Resolve By Name ${Date.now()}`;
          const created = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: uniqueName })
            .expect(201);

          const res = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${encodeURIComponent(uniqueName)}`)
            .set('Authorization', getExtAuth())
            .expect(200);

          expect(res.body.id).toBe(created.body.id);
        });

        it('returns 404 for a folder of a different type that happens to share the id/name (type-scoped)', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-g4-${Date.now()}@tooljet.io` });
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
      });

      // -----------------------------------------------------------------------
      // PATCH — Update
      // -----------------------------------------------------------------------

      describe(`PATCH /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('returns 404 when the folder does not exist', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .patch(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .send({ name: 'Renamed' })
            .expect(404);
        });

        it('returns 400 when name is missing', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u2-${Date.now()}@tooljet.io` });
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

        it('renames the folder and returns the updated object', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u3-${Date.now()}@tooljet.io` });
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

          const getRes = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(getRes.body.name).toBe('New Folder Name');
        });

        it('returns 409 when renaming to a name that already exists for this folder type', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u4-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Taken Folder Name' })
            .expect(201);
          const created = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Renameable Folder' })
            .expect(201);

          await request(app.getHttpServer())
            .patch(`${base(user.defaultOrganizationId, kind.path)}/${created.body.id}`)
            .set('Authorization', getExtAuth())
            .send({ name: 'Taken Folder Name' })
            .expect(409);
        });
      });

      // -----------------------------------------------------------------------
      // DELETE
      // -----------------------------------------------------------------------

      describe(`DELETE /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('returns 404 when the folder does not exist', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-x1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .delete(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .expect(404);
        });

        it('deletes the folder and it no longer resolves afterward', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-x2-${Date.now()}@tooljet.io` });
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

        it('cascades: deleting the folder unfolders its resource without deleting the resource itself', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-x3-${Date.now()}@tooljet.io` });
          const folder = await createFolder(app, {
            name: 'Folder With Resource',
            type: kind.type,
            organizationId: user.defaultOrganizationId,
          });

          const resourcePath =
            kind.type === APP_TYPES.FRONT_END ? 'apps' : kind.type === APP_TYPES.MODULE ? 'modules' : 'workflows';
          const resourceCreateBody: Record<string, unknown> = { name: 'Resource In Folder', folder_id: folder.id };
          if (kind.type === APP_TYPES.MODULE) delete resourceCreateBody.folder_id; // Modules v2 has no folder_id support

          let resourceId: string;
          if (kind.type === APP_TYPES.MODULE) {
            const created = await createApplication(app, { name: 'Resource In Folder', user, type: APP_TYPES.MODULE });
            const { addAppToFolder } = await import('test-helper');
            await addAppToFolder(app, created, { id: folder.id } as any);
            resourceId = created.id;
          } else {
            const created = await request(app.getHttpServer())
              .post(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/${resourcePath}`)
              .set('Authorization', getExtAuth())
              .send(resourceCreateBody)
              .expect(201);
            resourceId = created.body.id;
          }

          await request(app.getHttpServer())
            .delete(`${base(user.defaultOrganizationId, kind.path)}/${folder.id}`)
            .set('Authorization', getExtAuth())
            .expect(204);

          const resourceRes = await request(app.getHttpServer())
            .get(`/api/v2/ext/workspaces/${user.defaultOrganizationId}/${resourcePath}/${resourceId}`)
            .set('Authorization', getExtAuth())
            .expect(200);

          if (kind.type !== APP_TYPES.MODULE) {
            expect(resourceRes.body.folder_id).toBeNull();
          }
        });
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Plan / feature-gating (spot checks — one folder type is representative)
// ---------------------------------------------------------------------------

describe('External API v2 Folders (EE plan: starter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('GET /app-folders returns 451 — externalApi not included in starter plan', async () => {
    const { user } = await createUser(app, { email: `fv2-starter-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId, 'app-folders'))
      .set('Authorization', getExtAuth())
      .expect(451);
  });
});

describe('External API v2 Folders (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  for (const kind of FOLDER_KINDS) {
    it(`POST /${kind.path} returns 404 — route not registered on CE`, async () => {
      const { user } = await createUser(app, { email: `fv2-ce-${kind.path}-c-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(base(user.defaultOrganizationId, kind.path))
        .set('Authorization', getExtAuth())
        .send({ name: 'X' })
        .expect(404);
    });

    it(`GET /${kind.path} returns 404 — route not registered on CE`, async () => {
      const { user } = await createUser(app, { email: `fv2-ce-${kind.path}-l-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .get(base(user.defaultOrganizationId, kind.path))
        .set('Authorization', getExtAuth())
        .expect(404);
    });

    it(`DELETE /${kind.path}/:folderIdentifier returns 404 — route not registered on CE`, async () => {
      const { user } = await createUser(app, { email: `fv2-ce-${kind.path}-d-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .delete(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  }
});
