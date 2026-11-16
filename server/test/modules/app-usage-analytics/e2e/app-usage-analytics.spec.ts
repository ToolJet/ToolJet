/**
 * Usage analytics is EE/Cloud only. On CE the routes exist but never serve data.
 *
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createAdmin } from 'test-helper';

describe('AppUsageAnalyticsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('GET /api/analytics/status | Status on CE', () => {
    it('should return 501 for a workspace admin', async () => {
      const admin = await createAdmin(app, 'ce-analytics-admin@tooljet.io');
      await request(app.getHttpServer())
        .get('/api/analytics/status')
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .expect(501);
    });
  });

  describe('GET /api/analytics/workspace/summary | Summary on CE', () => {
    it('should return 501 for a workspace admin', async () => {
      const admin = await createAdmin(app, 'ce-analytics-admin2@tooljet.io');
      await request(app.getHttpServer())
        .get('/api/analytics/workspace/summary')
        .query({ start: '2026-10-17', end: '2026-11-16' })
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .expect(501);
    });
  });
});
