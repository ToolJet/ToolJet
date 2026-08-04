import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp, createApplication, createApplicationVersion } from 'test-helper';

/**
 * External API — POST /ext/import/workspace/:workspaceId/apps
 *
 * Rejection of module JSON via this endpoint is already covered in modules.spec.ts
 * ("returns 400 when a module JSON is sent to the app import endpoint") — not duplicated here.
 * TJDB-field-level DTO validation (missing id/table_name, invalid UUID, etc.) is shared with the
 * module import DTO and already covered there too — this file only proves the apps wiring works.
 *
 * Tested cases:
 *   - Auth: missing header, wrong token
 *   - 400: non-UUID workspaceId, workspace does not exist, tooljet_version missing,
 *     tooljet_version exceeds current, target app name already taken in the workspace
 *   - Happy path: export → import round trip into the same and a different workspace,
 *     appName override, tooljet_database accepted as an empty array
 *   - Documented gotcha: omitting both `app` and `appName` 500s instead of 400 — the
 *     service unconditionally reads `importresources.app[0].definition`. Tested as-is;
 *     flagged as a design question rather than silently patched.
 */

const NONEXISTENT_UUID = '00000000-0000-0000-0000-000000000001';

/** @group platform */
describe('External API — POST /ext/import/workspace/:workspaceId/apps', () => {
  let app: INestApplication;
  let AUTH_HEADER: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    AUTH_HEADER = `Basic ${app.get(ConfigService).get('EXTERNAL_API_ACCESS_TOKEN')}`;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  function importUrl(workspaceId: string) {
    return `/api/ext/import/workspace/${workspaceId}/apps`;
  }

  async function exportApp(organizationId: string, appId: string) {
    const res = await request(app.getHttpServer())
      .post(`/api/ext/export/workspace/${organizationId}/apps/${appId}`)
      .set('Authorization', AUTH_HEADER)
      .expect(201);
    return res.body;
  }

  async function listApps(organizationId: string) {
    const res = await request(app.getHttpServer())
      .get(`/api/ext/workspace/${organizationId}/apps`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);
    return res.body as { id: string; name: string }[];
  }

  describe('auth', () => {
    it('returns 403 when Authorization header is missing', async () => {
      await request(app.getHttpServer())
        .post(importUrl(NONEXISTENT_UUID))
        .send({ tooljet_version: '1.0.0' })
        .expect(403);
    });

    it('returns 403 when the access token is wrong', async () => {
      await request(app.getHttpServer())
        .post(importUrl(NONEXISTENT_UUID))
        .set('Authorization', 'Basic wrong-token')
        .send({ tooljet_version: '1.0.0' })
        .expect(403);
    });
  });

  describe('validation', () => {
    it('returns 400 for a non-UUID workspaceId', async () => {
      await request(app.getHttpServer())
        .post(importUrl('not-a-uuid'))
        .set('Authorization', AUTH_HEADER)
        .send({ tooljet_version: '1.0.0' })
        .expect(400);
    });

    it('returns 400 for a workspace that does not exist', async () => {
      await request(app.getHttpServer())
        .post(importUrl(NONEXISTENT_UUID))
        .set('Authorization', AUTH_HEADER)
        .send({ tooljet_version: '1.0.0', appName: 'X', app: [{ definition: { appV2: { name: 'X' } } }] })
        .expect(400);
    });

    it('returns 400 when tooljet_version is missing', async () => {
      const { organization } = await createUser(app, { email: `app-import-noversion-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(importUrl(organization.id))
        .set('Authorization', AUTH_HEADER)
        .send({ appName: 'X', app: [{ definition: { appV2: { name: 'X' } } }] })
        .expect(400);
    });

    it('returns 400 when tooljet_version exceeds the current server version', async () => {
      const { organization } = await createUser(app, { email: `app-import-futurever-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(importUrl(organization.id))
        .set('Authorization', AUTH_HEADER)
        .send({ tooljet_version: '999.0.0', appName: 'X', app: [{ definition: { appV2: { name: 'X' } } }] })
        .expect(400);
    });

    it('returns 400 when the target app name is already taken in the workspace', async () => {
      const { user, organization } = await createUser(app, { email: `app-import-dupname-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'Source App', user });
      await createApplicationVersion(app, seededApp);
      const exportBody = await exportApp(organization.id, seededApp.id);

      await request(app.getHttpServer())
        .post(importUrl(organization.id))
        .set('Authorization', AUTH_HEADER)
        .send({
          tooljet_version: exportBody.tooljet_version,
          appName: 'Dup App',
          app: exportBody.app,
          tooljet_database: exportBody.tooljet_database ?? [],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(importUrl(organization.id))
        .set('Authorization', AUTH_HEADER)
        .send({
          tooljet_version: exportBody.tooljet_version,
          appName: 'Dup App',
          app: exportBody.app,
          tooljet_database: exportBody.tooljet_database ?? [],
        })
        .expect(400);

      expect(res.body.message).toContain('already taken');
    });

    // Documented gotcha (see file header) — not a contract we assert should stay this way,
    // just recording actual current behavior so a future change here is a visible diff.
    it('currently 500s (not 400) when both app and appName are omitted', async () => {
      const { organization } = await createUser(app, { email: `app-import-noapp-${Date.now()}@tooljet.io` });
      await request(app.getHttpServer())
        .post(importUrl(organization.id))
        .set('Authorization', AUTH_HEADER)
        .send({ tooljet_version: '1.0.0' })
        .expect(500);
    });
  });

  describe('happy path', () => {
    it('round-trips export → import within the same workspace under a new name', async () => {
      const { user, organization } = await createUser(app, { email: `app-import-roundtrip-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'Source App', user });
      await createApplicationVersion(app, seededApp);

      const exportBody = await exportApp(organization.id, seededApp.id);

      const importRes = await request(app.getHttpServer())
        .post(importUrl(organization.id))
        .set('Authorization', AUTH_HEADER)
        .send({
          tooljet_version: exportBody.tooljet_version,
          appName: 'Imported Copy',
          app: exportBody.app,
          tooljet_database: exportBody.tooljet_database ?? [],
        })
        .expect(201);

      expect(importRes.body.message).toContain(organization.id);

      const apps = await listApps(organization.id);
      const names = apps.map((a) => a.name);
      expect(names).toContain('Source App');
      expect(names).toContain('Imported Copy');
    });

    it('imports into a different workspace than the source', async () => {
      const { user: user1, organization: org1 } = await createUser(app, { email: `app-import-cross-1-${Date.now()}@tooljet.io` });
      const { organization: org2 } = await createUser(app, { email: `app-import-cross-2-${Date.now()}@tooljet.io` });

      const seededApp = await createApplication(app, { name: 'Portable App', user: user1 });
      await createApplicationVersion(app, seededApp);

      const exportBody = await exportApp(org1.id, seededApp.id);

      await request(app.getHttpServer())
        .post(importUrl(org2.id))
        .set('Authorization', AUTH_HEADER)
        .send({
          tooljet_version: exportBody.tooljet_version,
          appName: 'Portable App',
          app: exportBody.app,
          tooljet_database: exportBody.tooljet_database ?? [],
        })
        .expect(201);

      const apps = await listApps(org2.id);
      expect(apps.map((a) => a.name)).toContain('Portable App');
    });

    it('accepts tooljet_database as an empty array', async () => {
      const { user, organization } = await createUser(app, { email: `app-import-emptytjdb-${Date.now()}@tooljet.io` });
      const seededApp = await createApplication(app, { name: 'Empty TJDB App', user });
      await createApplicationVersion(app, seededApp);
      const exportBody = await exportApp(organization.id, seededApp.id);

      await request(app.getHttpServer())
        .post(importUrl(organization.id))
        .set('Authorization', AUTH_HEADER)
        .send({
          tooljet_version: exportBody.tooljet_version,
          appName: 'Empty TJDB Copy',
          app: exportBody.app,
          tooljet_database: [],
        })
        .expect(201);
    });
  });
});
