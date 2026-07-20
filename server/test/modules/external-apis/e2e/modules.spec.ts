/**
 * @group platform
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
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';

jest.setTimeout(120_000);

// Read the token from the same ConfigService the guard resolves it from — the
// app's ConfigModule and process.env can diverge (different env files).
let externalApiAccessToken: string;
const getExtAuth = () => `Basic ${externalApiAccessToken}`;

// A valid UUID that will never exist in the test database.
const NONEXISTENT_UUID = '00000000-0000-0000-0000-000000000001';

// Helper: export a module and return the full export body.
async function exportModule(
  server: ReturnType<INestApplication['getHttpServer']>,
  orgId: string,
  moduleId: string,
  query = ''
) {
  const res = await request(server)
    .post(`/api/ext/export/workspace/${orgId}/modules/${moduleId}${query}`)
    .set('Authorization', getExtAuth())
    .expect(201);
  return res.body;
}

// Helper: import a module and return the response body.
async function importModule(
  server: ReturnType<INestApplication['getHttpServer']>,
  orgId: string,
  payload: Record<string, unknown>
) {
  const res = await request(server)
    .post(`/api/ext/import/workspace/${orgId}/modules`)
    .set('Authorization', getExtAuth())
    .send(payload)
    .expect(201);
  return res.body;
}

// Helper: list modules in a workspace.
async function listModules(server: ReturnType<INestApplication['getHttpServer']>, orgId: string) {
  const res = await request(server)
    .get(`/api/ext/workspace/${orgId}/modules`)
    .set('Authorization', getExtAuth())
    .expect(200);
  return res.body as { modules: any[]; total: number };
}

describe('ExternalApisModulesController (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    externalApiAccessToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  // ---------------------------------------------------------------------------
  // GET /api/ext/workspace/:workspaceId/modules
  // ---------------------------------------------------------------------------

  describe('GET /api/ext/workspace/:workspaceId/modules', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${user.defaultOrganizationId}/modules`)
        .expect(403);
    });

    it('returns 400 for non-UUID workspaceId', async () => {
      await request(app.getHttpServer())
        .get('/api/ext/workspace/not-a-uuid/modules')
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('returns 400 for a valid UUID workspace that does not exist', async () => {
      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${NONEXISTENT_UUID}/modules`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('returns empty list when workspace has no modules', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });

      const res = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.modules).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('returns correct response shape for each module', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await createApplication(app, { name: 'Shape Module', user, type: APP_TYPES.MODULE });

      const res = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.total).toBe(1);
      const mod = res.body.modules[0];
      expect(mod).toHaveProperty('id');
      expect(mod).toHaveProperty('name', 'Shape Module');
      expect(mod).toHaveProperty('slug');
      expect(mod).toHaveProperty('icon');
      expect(mod).toHaveProperty('isPublic');
      expect(mod).toHaveProperty('createdAt');
      expect(mod).toHaveProperty('updatedAt');
    });

    it('returns only module-type apps (excludes front-end apps)', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = user.defaultOrganizationId;

      await createApplication(app, { name: 'Front-end app', user, type: APP_TYPES.FRONT_END });
      const module1 = await createApplication(app, { name: 'Auth Module', user, type: APP_TYPES.MODULE }, false);
      const module2 = await createApplication(app, { name: 'Payment Module', user, type: APP_TYPES.MODULE }, false);

      const res = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${orgId}/modules`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.total).toBe(2);
      const names = res.body.modules.map((m: any) => m.name);
      expect(names).toContain(module1.name);
      expect(names).toContain(module2.name);
      expect(names).not.toContain('Front-end app');
    });

    it('returns modules belonging to the given workspace only', async () => {
      const { user: user1 } = await createUser(app, { email: 'user1@tooljet.io' });
      const { user: user2 } = await createUser(app, { email: 'user2@tooljet.io' });

      await createApplication(app, { name: 'Module A', user: user1, type: APP_TYPES.MODULE });
      await createApplication(app, { name: 'Module B', user: user2, type: APP_TYPES.MODULE });

      const res = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${user1.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.modules[0].name).toBe('Module A');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/ext/export/workspace/:workspaceId/modules/:moduleId
  // ---------------------------------------------------------------------------

  describe('POST /api/ext/export/workspace/:workspaceId/modules/:moduleId', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const mod = await createApplication(app, { name: 'M', user, type: APP_TYPES.MODULE });
      await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${user.defaultOrganizationId}/modules/${mod.id}`)
        .expect(403);
    });

    it('returns 400 for non-UUID moduleId', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${user.defaultOrganizationId}/modules/not-a-uuid`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('returns 400 for a valid UUID moduleId that does not exist', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${user.defaultOrganizationId}/modules/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('returns 400 when module does not belong to workspace', async () => {
      const { user: user1 } = await createUser(app, { email: 'user1@tooljet.io' });
      const { user: user2 } = await createUser(app, { email: 'user2@tooljet.io' });
      const mod = await createApplication(app, { name: 'M', user: user1, type: APP_TYPES.MODULE });

      await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${user2.defaultOrganizationId}/modules/${mod.id}`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('returns 400 when app exists but is not a module type', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const frontendApp = await createApplication(app, { name: 'FE', user, type: APP_TYPES.FRONT_END });

      await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${user.defaultOrganizationId}/modules/${frontendApp.id}`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('exports module and returns definition with tooljet_version', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const mod = await createApplication(app, { name: 'Auth Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, mod);

      const body = await exportModule(app.getHttpServer(), user.defaultOrganizationId, mod.id);

      expect(body).toHaveProperty('tooljet_version');
      expect(typeof body.tooljet_version).toBe('string');
      expect(body).toHaveProperty('app');
      expect(Array.isArray(body.app)).toBe(true);
      expect(body.app.length).toBeGreaterThan(0);
      expect(body.app[0]).toHaveProperty('definition');
    });

    it('excludes TJDB from export when exportTJDB=false', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const mod = await createApplication(app, { name: 'Auth Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, mod);

      const body = await exportModule(app.getHttpServer(), user.defaultOrganizationId, mod.id, '?exportTJDB=false');

      expect(body).not.toHaveProperty('tooljet_database');
    });

    it('does not exclude TJDB when exportTJDB=true explicitly', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const mod = await createApplication(app, { name: 'Auth Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, mod);

      // Should not error — TJDB inclusion is allowed even when the module has no tables
      const body = await exportModule(app.getHttpServer(), user.defaultOrganizationId, mod.id, '?exportTJDB=true');

      expect(body).toHaveProperty('tooljet_version');
      expect(body).toHaveProperty('app');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/ext/import/workspace/:workspaceId/modules
  // ---------------------------------------------------------------------------

  describe('POST /api/ext/import/workspace/:workspaceId/modules', () => {
    it('returns 403 without Authorization header', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .expect(403);
    });

    it('returns 400 for non-UUID workspaceId', async () => {
      await request(app.getHttpServer())
        .post('/api/ext/import/workspace/not-a-uuid/modules')
        .set('Authorization', getExtAuth())
        .expect(400);
    });

    it('returns 400 for a valid UUID workspace that does not exist', async () => {
      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${NONEXISTENT_UUID}/modules`)
        .set('Authorization', getExtAuth())
        .send({ tooljet_version: '1.0.0', app: [] })
        .expect(400);
    });

    it('returns 400 when tooljet_version is missing from request body', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .send({ app: [] })
        .expect(400);
    });

    it('returns 400 when tooljet_version exceeds current version', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .send({ tooljet_version: '999.0.0', app: [] })
        .expect(400);
    });

    it('accepts import body with only tooljet_version (no app, no tooljet_database)', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const res = await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .send({ tooljet_version: '1.0.0' })
        .expect(201);

      expect(res.body.message).toBe('Module imported successfully.');
    });

    it('accepts import body with tooljet_database as empty array', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const res = await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .send({ tooljet_version: '1.0.0', tooljet_database: [] })
        .expect(201);

      expect(res.body.message).toBe('Module imported successfully.');
    });

    it('returns 400 when tooljet_database entry is missing the id field', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .send({
          tooljet_version: '1.0.0',
          tooljet_database: [{ table_name: 'test_table', schema: { columns: [] } }],
        })
        .expect(400);
    });

    it('returns 400 when tooljet_database entry id is not a valid UUID', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .send({
          tooljet_version: '1.0.0',
          tooljet_database: [{ id: 'not-a-uuid', table_name: 'test_table', schema: { columns: [] } }],
        })
        .expect(400);
    });

    it('returns 400 when tooljet_database entry is missing table_name', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .send({
          tooljet_version: '1.0.0',
          tooljet_database: [{ id: NONEXISTENT_UUID, schema: { columns: [] } }],
        })
        .expect(400);
    });

    it('imports module, returns success message, and module appears in workspace listing', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = user.defaultOrganizationId;

      const mod = await createApplication(app, { name: 'Source Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, mod);

      const exportBody = await exportModule(app.getHttpServer(), orgId, mod.id);

      const importRes = await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${orgId}/modules`)
        .set('Authorization', getExtAuth())
        .send({
          tooljet_version: exportBody.tooljet_version,
          app: exportBody.app,
          tooljet_database: exportBody.tooljet_database ?? [],
        })
        .expect(201);

      expect(importRes.body.message).toBe('Module imported successfully.');

      // Verify the imported module materialised in the workspace (total goes from 1 → 2)
      const listing = await listModules(app.getHttpServer(), orgId);
      expect(listing.total).toBe(2);
    });

    it('imports module with appName override and reflects the new name in workspace listing', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = user.defaultOrganizationId;

      const mod = await createApplication(app, { name: 'Original Name', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, mod);

      const exportBody = await exportModule(app.getHttpServer(), orgId, mod.id);

      await importModule(app.getHttpServer(), orgId, {
        tooljet_version: exportBody.tooljet_version,
        appName: 'Renamed Module',
        app: exportBody.app,
        tooljet_database: exportBody.tooljet_database ?? [],
      });

      const listing = await listModules(app.getHttpServer(), orgId);
      const names = listing.modules.map((m: any) => m.name);
      expect(names).toContain('Renamed Module');
    });

    it('imports into a different workspace than the source', async () => {
      const { user: user1 } = await createUser(app, { email: 'user1@tooljet.io' });
      const { user: user2 } = await createUser(app, { email: 'user2@tooljet.io' });

      const mod = await createApplication(app, { name: 'Portable Module', user: user1, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, mod);

      const exportBody = await exportModule(app.getHttpServer(), user1.defaultOrganizationId, mod.id);

      await importModule(app.getHttpServer(), user2.defaultOrganizationId, {
        tooljet_version: exportBody.tooljet_version,
        appName: 'Portable Module',
        app: exportBody.app,
        tooljet_database: exportBody.tooljet_database ?? [],
      });

      const listing = await listModules(app.getHttpServer(), user2.defaultOrganizationId);
      expect(listing.total).toBe(1);
      expect(listing.modules[0].name).toBe('Portable Module');
    });

    it('returns 400 when a front-end app JSON is sent to the module import endpoint', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = user.defaultOrganizationId;

      const frontendApp = await createApplication(app, { name: 'Frontend App', user, type: APP_TYPES.FRONT_END });
      await createApplicationVersion(app, frontendApp);

      // Export the front-end app via the apps export endpoint
      const exportRes = await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${orgId}/apps/${frontendApp.id}`)
        .set('Authorization', getExtAuth())
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${orgId}/modules`)
        .set('Authorization', getExtAuth())
        .send({
          tooljet_version: exportRes.body.tooljet_version ?? '1.0.0',
          app: exportRes.body.app,
          tooljet_database: exportRes.body.tooljet_database ?? [],
        })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/ext/import/workspace/:workspaceId/apps — module JSON rejection
  // ---------------------------------------------------------------------------

  describe('POST /api/ext/import/workspace/:workspaceId/apps', () => {
    it('returns 400 when a module JSON is sent to the app import endpoint', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = user.defaultOrganizationId;

      const mod = await createApplication(app, { name: 'Source Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, mod);

      const exportBody = await exportModule(app.getHttpServer(), orgId, mod.id);

      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${orgId}/apps`)
        .set('Authorization', getExtAuth())
        .send({
          tooljet_version: exportBody.tooljet_version,
          app: exportBody.app,
          tooljet_database: exportBody.tooljet_database ?? [],
        })
        .expect(400);
    });
  });
});

describe('ExternalApisModulesController (EE plan: starter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    externalApiAccessToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('GET /api/ext/workspace/:workspaceId/modules returns 403 — externalApi not included in starter plan', async () => {
    const { user } = await createUser(app, { email: 'admin@tooljet.io' });
    await request(app.getHttpServer())
      .get(`/api/ext/workspace/${user.defaultOrganizationId}/modules`)
      .set('Authorization', getExtAuth())
      .expect(451);
  });
});

describe('ExternalApisModulesController (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
    externalApiAccessToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('GET /api/ext/workspace/:workspaceId/modules returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: 'admin@tooljet.io' });
    await request(app.getHttpServer())
      .get(`/api/ext/workspace/${user.defaultOrganizationId}/modules`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /api/ext/export/workspace/:workspaceId/modules/:moduleId returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: 'admin@tooljet.io' });
    await request(app.getHttpServer())
      .post(`/api/ext/export/workspace/${user.defaultOrganizationId}/modules/${NONEXISTENT_UUID}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('POST /api/ext/import/workspace/:workspaceId/modules returns 404 — route not registered on CE', async () => {
    const { user } = await createUser(app, { email: 'admin@tooljet.io' });
    await request(app.getHttpServer())
      .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
      .set('Authorization', getExtAuth())
      .send({ tooljet_version: '1.0.0' })
      .expect(404);
  });
});
