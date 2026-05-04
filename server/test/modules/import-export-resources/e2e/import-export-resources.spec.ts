/**
 * Import/Export Resources E2E Tests
 *
 * Verifies the v2 import/export/clone endpoints:
 *   POST /api/v2/resources/export | export apps
 *   POST /api/v2/resources/import | import apps (round-trip)
 *   POST /api/v2/resources/clone  | clone an app
 *
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  initTestApp,
  createAdmin,
  createEndUser,
  createApplication,
  createApplicationVersion,
  closeTestApp,
} from 'test-helper';

describe('ImportExportResourcesController', () => {
describe('EE (plan: enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  /** Creates an app with a version, ready for export/clone operations. */
  async function seedApp(admin: Awaited<ReturnType<typeof createAdmin>>) {
    const application = await createApplication(app, {
      name: 'export-test-app',
      user: admin.user as any,
    });
    await createApplicationVersion(app, application as any);
    return application;
  }

  describe('POST /api/v2/resources/export | export apps', () => {
    it('should allow an admin to export an app (201)', async () => {
      const admin = await createAdmin(app, 'admin@tooljet.io');
      const application = await seedApp(admin);

      const response = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .send({
          app: [{ id: application.id }],
          organization_id: admin.user.defaultOrganizationId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('app');
      expect(Array.isArray(response.body.app)).toBe(true);
      expect(response.body.app.length).toEqual(1);
      expect(response.body).toHaveProperty('tooljet_version');
    });

    it('should deny export for an end-user (403)', async () => {
      const admin = await createAdmin(app, 'admin@tooljet.io');
      const application = await seedApp(admin);
      const endUser = await createEndUser(app, 'viewer@tooljet.io', {
        workspace: admin.workspace,
      });

      await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('tj-workspace-id', endUser.user.defaultOrganizationId)
        .set('Cookie', endUser.cookie)
        .send({
          app: [{ id: application.id }],
          organization_id: endUser.user.defaultOrganizationId,
        })
        .expect(403);
    });
  });

  describe('POST /api/v2/resources/import | import apps (round-trip)', () => {
    it('should allow an admin to import an exported payload (round-trip)', async () => {
      const admin = await createAdmin(app, 'admin@tooljet.io');
      const application = await seedApp(admin);

      // Export first
      const exportResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .send({
          app: [{ id: application.id }],
          organization_id: admin.user.defaultOrganizationId,
        })
        .expect(201);

      // Import the exported payload back
      const importResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .send({
          organization_id: admin.user.defaultOrganizationId,
          tooljet_version: exportResponse.body.tooljet_version,
          app: exportResponse.body.app,
        })
        .expect(201);

      expect(importResponse.body).toHaveProperty('imports');
      expect(importResponse.body.success).toBe(true);
    });
  });

  describe('POST /api/v2/resources/clone | clone an app', () => {
    it('should allow an admin to clone an app', async () => {
      const admin = await createAdmin(app, 'admin@tooljet.io');
      const application = await seedApp(admin);

      const response = await request(app.getHttpServer())
        .post('/api/v2/resources/clone')
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .send({
          app: [{ id: application.id, name: 'cloned-app' }],
          organization_id: admin.user.defaultOrganizationId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('imports');
      expect(response.body.success).toBe(true);
    });
  });
});
});
