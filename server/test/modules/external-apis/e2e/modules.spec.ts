/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';

jest.setTimeout(120_000);

// Token is read from .env.test at runtime by ConfigService — read after env is loaded.
const getExtAuth = () => `Basic ${process.env.EXTERNAL_API_ACCESS_TOKEN}`;

describe('ExternalApisModulesController (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  beforeEach(async () => {
    await resetDB();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

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

    it('returns empty list when workspace has no modules', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });

      const res = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.modules).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('returns only module-type apps (excludes front-end apps)', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = user.defaultOrganizationId;

      // ensureAppEnvironments is idempotent per-org, skip on subsequent calls
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

    it('returns 400 when moduleId is not a UUID', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${user.defaultOrganizationId}/modules/not-a-uuid`)
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

      const res = await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${user.defaultOrganizationId}/modules/${mod.id}`)
        .set('Authorization', getExtAuth())
        .expect(201);

      expect(res.body).toHaveProperty('tooljet_version');
      expect(res.body).toHaveProperty('app');
      expect(Array.isArray(res.body.app)).toBe(true);
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

    it('returns 400 when tooljet_version exceeds current version', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });

      await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${user.defaultOrganizationId}/modules`)
        .set('Authorization', getExtAuth())
        .send({ tooljet_version: '999.0.0', app: [] })
        .expect(400);
    });

    it('imports module and returns success message', async () => {
      const { user } = await createUser(app, { email: 'admin@tooljet.io' });
      const orgId = user.defaultOrganizationId;

      const mod = await createApplication(app, { name: 'Source Module', user, type: APP_TYPES.MODULE });
      await createApplicationVersion(app, mod);

      const exportRes = await request(app.getHttpServer())
        .post(`/api/ext/export/workspace/${orgId}/modules/${mod.id}`)
        .set('Authorization', getExtAuth())
        .expect(201);

      const importPayload = {
        tooljet_version: exportRes.body.tooljet_version,
        appName: 'Imported Module',
        app: exportRes.body.app,
      };

      const importRes = await request(app.getHttpServer())
        .post(`/api/ext/import/workspace/${orgId}/modules`)
        .set('Authorization', getExtAuth())
        .send(importPayload)
        .expect(201);

      expect(importRes.body.message).toBe('Module imported successfully.');
    });
  });
});
