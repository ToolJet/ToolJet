/**
 * Audit Logs E2E Tests
 *
 * Verifies the EE audit-logs endpoints:
 *   GET /api/audit-logs          — list with pagination (guarded by AuditLogsDurationGuard)
 *   GET /api/audit-logs/resources — list available resource types
 *
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { resetDB, initTestApp, createAdmin, createEndUser, saveEntity } from 'test-helper';
import { AuditLog } from 'src/entities/audit_log.entity';
import { MODULES } from '@modules/app/constants/modules';

describe('audit logs controller', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  beforeEach(async () => {
    await resetDB();
  });

  afterAll(async () => {
    await app.close();
  });

  /** Builds timeFrom/timeTo spanning the last 7 days (required by AuditLogsDurationGuard). */
  function recentTimeRange(): { timeFrom: string; timeTo: string } {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      timeFrom: weekAgo.toISOString(),
      timeTo: now.toISOString(),
    };
  }

  /** Seeds a single audit log entry for the given user and workspace. */
  async function seedAuditLog(userId: string, organizationId: string) {
    await saveEntity(AuditLog, {
      userId,
      organizationId,
      resourceId: userId,
      resourceName: 'test-user',
      resourceType: MODULES.SESSION,
      actionType: 'USER_LOGIN',
      ipAddress: '127.0.0.1',
      metadata: {},
      resourceData: {},
    } as any);
  }

  describe('GET /api/audit-logs', () => {
    it('should return 400 when timeFrom/timeTo are missing', async () => {
      const admin = await createAdmin(app, 'admin@tooljet.io');

      await request(app.getHttpServer())
        .get('/api/audit-logs')
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .expect(400);
    });

    it('should allow an admin to list audit logs (200)', async () => {
      const admin = await createAdmin(app, 'admin@tooljet.io');
      await seedAuditLog(admin.user.id, admin.user.defaultOrganizationId);

      const response = await request(app.getHttpServer())
        .get('/api/audit-logs')
        .query(recentTimeRange())
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .expect(200);

      expect(response.body).toHaveProperty('audit_logs');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.audit_logs)).toBe(true);
      expect(response.body.audit_logs.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect pagination params (page, perPage)', async () => {
      const admin = await createAdmin(app, 'admin@tooljet.io');
      await seedAuditLog(admin.user.id, admin.user.defaultOrganizationId);

      const response = await request(app.getHttpServer())
        .get('/api/audit-logs')
        .query({ page: 1, perPage: 5, ...recentTimeRange() })
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .expect(200);

      expect(response.body.meta).toHaveProperty('total_pages');
      expect(response.body.meta).toHaveProperty('total_count');
      expect(response.body.meta).toHaveProperty('current_page');
      expect(response.body.meta.current_page).toEqual(1);
      // With perPage=5, results should not exceed 5
      expect(response.body.audit_logs.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/audit-logs/resources', () => {
    it('should allow an admin to list available resource types (200)', async () => {
      const admin = await createAdmin(app, 'admin@tooljet.io');

      const response = await request(app.getHttpServer())
        .get('/api/audit-logs/resources')
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', admin.cookie)
        .expect(200);

      // Response is an object keyed by resource category (e.g. USER, SESSION, etc.)
      expect(typeof response.body).toBe('object');
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });

    it('should deny unauthenticated access (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/audit-logs/resources')
        .expect(401);
    });
  });
});
