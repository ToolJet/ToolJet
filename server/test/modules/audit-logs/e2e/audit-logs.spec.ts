/**
 * Audit Logs E2E Tests
 *
 * Verifies the EE audit-logs endpoints:
 *   GET /api/audit-logs          | list with pagination (guarded by AuditLogsDurationGuard)
 *   GET /api/audit-logs/resources | list available resource types
 *
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, createAdmin, saveEntity, closeTestApp } from 'test-helper';
import { AuditLog } from 'src/entities/audit_log.entity';
import { MODULES } from '@modules/app/constants/modules';

describe('AuditLogsController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

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

    describe('GET /api/audit-logs | List audit logs', () => {
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

        expect(response.body).toMatchObject({
          audit_logs: expect.arrayContaining([expect.any(Object)]),
          meta: expect.any(Object),
        });
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

        expect(response.body).toMatchObject({
          meta: {
            total_pages: expect.any(Number),
            total_count: expect.any(Number),
            current_page: 1,
          },
          audit_logs: expect.any(Array),
        });
        expect(response.body.audit_logs.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /api/audit-logs/resources | List resource types', () => {
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
        await request(app.getHttpServer()).get('/api/audit-logs/resources').expect(401);
      });
    });
  });
});
