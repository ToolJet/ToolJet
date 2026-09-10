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

  it('enforces the ExternalApiSecurityGuard and resolveWorkspaceByIdentifier (shared across all three folder types)', async () => {
    const { user } = await createUser(app, { email: `fv2-auth-${Date.now()}@tooljet.io` });
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId, 'app-folders'))
      .send({ name: 'X' })
      .expect(403);
    await request(app.getHttpServer())
      .post(base(user.defaultOrganizationId, 'app-folders'))
      .set('Authorization', 'Basic wrong-token')
      .send({ name: 'X' })
      .expect(403);
    await request(app.getHttpServer())
      .post(base('not-a-real-workspace', 'app-folders'))
      .set('Authorization', getExtAuth())
      .send({ name: 'X' })
      .expect(404);
  });

  for (const kind of FOLDER_KINDS) {
    describe(kind.label, () => {
      // -----------------------------------------------------------------------
      // POST — Create
      // -----------------------------------------------------------------------

      describe(`POST /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}`, () => {
        it('rejects an empty name (FINDING: 500, not 400) and disallowed characters (400)', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({})
            .expect(500);
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Invalid/Name*Here' })
            .expect(400);
        });

        it('creates a folder, and a different folder type may reuse the same name (type-scoped uniqueness)', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-c2-${Date.now()}@tooljet.io` });
          const res = await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Internal Tools' })
            .expect(201);
          expect(res.body).toMatchObject({ name: 'Internal Tools' });

          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.otherPath))
            .set('Authorization', getExtAuth())
            .send({ name: 'Internal Tools' })
            .expect(201);
        });

        it('returns 409 when a folder with the same name and type already exists', async () => {
          // The duplicate check here goes through catchDbException around a real INSERT (unlike
          // Apps/Modules/Workflows' soft SELECT-based pre-checks) — it must be the last request
          // in its test, since the failed statement poisons the rest of the per-test transaction.
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

      // -----------------------------------------------------------------------
      // GET (list)
      // -----------------------------------------------------------------------

      describe(`GET /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}`, () => {
        it('returns an empty list, then lists folders of this type only, with correct shape', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l1-${Date.now()}@tooljet.io` });

          const empty = await request(app.getHttpServer())
            .get(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(empty.body).toMatchObject({ data: [], pagination: { page: 1, per_page: 20, total_count: 0 } });

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

        it('filters by ?search= and paginates with ?page/?per_page', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-l2-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .post(base(user.defaultOrganizationId, kind.path))
            .set('Authorization', getExtAuth())
            .send({ name: 'Findable Folder' })
            .expect(201);
          for (let i = 0; i < 2; i++) {
            await request(app.getHttpServer())
              .post(base(user.defaultOrganizationId, kind.path))
              .set('Authorization', getExtAuth())
              .send({ name: `Other Folder ${i}` })
              .expect(201);
          }

          const searched = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}?search=findable`)
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(searched.body.pagination.total_count).toBe(1);
          expect(searched.body.data[0].name).toBe('Findable Folder');

          const paged = await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}?page=1&per_page=2`)
            .set('Authorization', getExtAuth())
            .expect(200);
          expect(paged.body.data).toHaveLength(2);
          expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 2, total_count: 3 });
        });
      });

      // -----------------------------------------------------------------------
      // GET :folderIdentifier — Detail
      // -----------------------------------------------------------------------

      describe(`GET /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('returns 404 for a nonexistent folder and for a different folder type sharing the id (type-scoped)', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-g1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .get(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .expect(404);

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

        it('resolves by id and by name', async () => {
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

      // -----------------------------------------------------------------------
      // PATCH — Update
      // -----------------------------------------------------------------------

      describe(`PATCH /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('returns 404 for a nonexistent folder and 400 when name is missing', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-u1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .patch(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .send({ name: 'Renamed' })
            .expect(404);

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

        it('renames the folder and rejects a name that already exists for this folder type', async () => {
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

      // -----------------------------------------------------------------------
      // DELETE
      // -----------------------------------------------------------------------

      describe(`DELETE /api/v2/ext/workspaces/:workspaceIdentifier/${kind.path}/:folderIdentifier`, () => {
        it('returns 404 for a nonexistent folder, and 204 + no-longer-resolvable on delete', async () => {
          const { user } = await createUser(app, { email: `fv2-${kind.path}-x1-${Date.now()}@tooljet.io` });
          await request(app.getHttpServer())
            .delete(`${base(user.defaultOrganizationId, kind.path)}/${NONEXISTENT_UUID}`)
            .set('Authorization', getExtAuth())
            .expect(404);

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
          const { user } = await createUser(app, { email: `fv2-${kind.path}-x2-${Date.now()}@tooljet.io` });
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
