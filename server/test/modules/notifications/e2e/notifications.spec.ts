/** @group platform */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { initTestApp, closeTestApp, createAdmin } from 'test-helper';
import { NotificationService } from '@modules/notifications/service';
import { NOTIFICATION_TYPE } from '@modules/notifications/constants';

describe('NotificationController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let admin: Awaited<ReturnType<typeof createAdmin>>;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      admin = await createAdmin(app, 'notifications-admin@tooljet.io');
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    afterAll(async () => { await closeTestApp(app); }, 60000);

    // Attach auth cookie + workspace header on every request
    const authed = (req: request.Test) =>
      req.set('Cookie', admin.cookie).set('tj-workspace-id', admin.workspace.id);

    const seed = async (overrides = {}) => {
      const svc = app.get(NotificationService);
      await svc.notify({
        organizationId: admin.workspace.id,
        userId: admin.user.id,
        type: NOTIFICATION_TYPE.ERROR,
        title: 'Branch creation failed',
        body: 'Push to remote failed',
        ...overrides,
      });
    };

    describe('GET /notifications | list', () => {
      it('should return notifications for the logged-in user', async () => {
        await seed();
        const res = await authed(request(app.getHttpServer()).get('/api/notifications'));
        expect(res.status).toBe(200);
        expect(res.body.notifications[0]).toMatchObject({
          recipientId: expect.any(String),
          type: 'error',
          title: 'Branch creation failed',
        });
      });
    });

    describe('GET /notifications/unread-count', () => {
      it('should count unread (read_at IS NULL)', async () => {
        await seed();
        const res = await authed(request(app.getHttpServer()).get('/api/notifications/unread-count'));
        expect(res.status).toBe(200);
        expect(res.body.count).toBeGreaterThanOrEqual(1);
      });
    });

    describe('PATCH /notifications/:recipientId/read', () => {
      it('should set read_at and drop from unread count', async () => {
        await seed();
        const list = await authed(request(app.getHttpServer()).get('/api/notifications?status=unread'));
        const recipientId = list.body.notifications[0].recipientId;
        const res = await authed(request(app.getHttpServer()).patch(`/api/notifications/${recipientId}/read`));
        expect(res.status).toBe(200);
        const after = await authed(request(app.getHttpServer()).get('/api/notifications?status=unread'));
        expect(after.body.notifications.find((n) => n.recipientId === recipientId)).toBeUndefined();
      });
    });

    describe('PATCH /notifications/read-all', () => {
      it('should mark every unread notification read', async () => {
        await seed();
        const before = await authed(request(app.getHttpServer()).get('/api/notifications/unread-count'));
        expect(before.body.count).toBeGreaterThanOrEqual(1);
        const patchRes = await authed(request(app.getHttpServer()).patch('/api/notifications/read-all'));
        expect(patchRes.status).toBe(200);
        const after = await authed(request(app.getHttpServer()).get('/api/notifications/unread-count'));
        expect(after.body.count).toBe(0);
      });
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });
});
