import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { UserAppActivity } from '@entities/user_app_activity.entity';
import { DashboardActivityService } from '@modules/apps/dashboard/activity.service';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  findEntity,
  resolveOrSeedDefaultBranch,
  seedActivity,
  seedDashboardApp,
  updateEntity,
} from 'test-helper';

/** @group platform */
describe('Dashboard v2 activity write paths', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee' }));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('EE (plan: basic)', () => {
    describe('POST /api/v2/apps/:id/versions/:versionId/components | Builder edit', () => {
      it('should record last_edited_at for the editing user', async () => {
        const admin = await createAdmin(nestApp, 'dash-act-edit@tooljet.io');
        const { app, version } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Edited app' });
        await updateEntity(AppVersion, version.id, { status: AppVersionStatus.DRAFT });
        const page = await findEntity(Page, { appVersionId: version.id });
        const componentId = randomUUID();

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/apps/${app.id}/versions/${version.id}/components`)
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .send({
            is_user_switched_version: false,
            pageId: page.id,
            diff: {
              [componentId]: {
                name: 'button1',
                layouts: { desktop: { top: 80, left: 15, width: 4, height: 40 } },
                type: 'Button',
                properties: { text: { value: 'Button' } },
                styles: {},
                parent: null,
              },
            },
          });

        expect(response.statusCode).toBe(201);
        expect(await findEntity(UserAppActivity, { userId: admin.user.id, appId: app.id })).toMatchObject({
          lastEditedAt: expect.any(Date),
          lastViewedAt: null,
        });
      });
    });

    describe('GET /api/apps/slugs/:slug | Released app open', () => {
      it('should record last_viewed_at for a signed-in end user', async () => {
        const admin = await createAdmin(nestApp, 'dash-act-view-admin@tooljet.io');
        const endUser = await createEndUser(nestApp, 'dash-act-view-eu@tooljet.io', { workspace: admin.workspace });
        const { app, version } = await seedDashboardApp(nestApp, {
          user: admin.user,
          name: 'Viewed app',
          released: true,
        });

        const response = await request(nestApp.getHttpServer())
          .get(`/api/apps/slugs/${version.slug}`)
          .set('Cookie', endUser.cookie)
          .set('tj-workspace-id', admin.workspace.id);

        expect(response.statusCode).toBe(200);
        expect(await findEntity(UserAppActivity, { userId: endUser.user.id, appId: app.id })).toMatchObject({
          lastViewedAt: expect.any(Date),
        });
      });
    });

    describe('PUT /api/apps/:id | App rename', () => {
      it('should record last_edited_at on the default branch when no branch is sent', async () => {
        const admin = await createAdmin(nestApp, 'dash-act-rename@tooljet.io');
        const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
        const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Before rename' });

        const response = await request(nestApp.getHttpServer())
          .put(`/api/apps/${app.id}`)
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .send({ app: { name: 'After rename' } });

        expect(response.statusCode).toBe(200);
        expect(
          await findEntity(UserAppActivity, { userId: admin.user.id, appId: app.id, branchId: branch.id })
        ).toMatchObject({
          lastEditedAt: expect.any(Date),
        });
      });
    });

    describe('DashboardActivityService | Throttle', () => {
      it('should not move last_edited_at again within 5 minutes', async () => {
        const admin = await createAdmin(nestApp, 'dash-act-throttle@tooljet.io');
        const { app, version } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Throttled app' });
        const service = nestApp.get(DashboardActivityService);

        await service.recordEdit(admin.user.id, app.id, version.id);
        const first = await findEntity(UserAppActivity, { userId: admin.user.id, appId: app.id });
        await service.recordEdit(admin.user.id, app.id, version.id);
        const second = await findEntity(UserAppActivity, { userId: admin.user.id, appId: app.id });

        expect(second.lastEditedAt).toEqual(first.lastEditedAt);
      });

      it('should write inside the 5-minute window when someone else edited since', async () => {
        const a = await createAdmin(nestApp, 'dash-act-smart-a@tooljet.io');
        const b = await createAdmin(nestApp, 'dash-act-smart-b@tooljet.io', { workspace: a.workspace });
        const branch = await resolveOrSeedDefaultBranch(a.workspace.id);
        const { app, version } = await seedDashboardApp(nestApp, { user: a.user, name: 'Two editors' });
        const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
        await seedActivity(a.user.id, app.id, branch.id, { lastEditedAt: minutesAgo(2) });
        await seedActivity(b.user.id, app.id, branch.id, { lastEditedAt: minutesAgo(1) });

        await nestApp.get(DashboardActivityService).recordEdit(a.user.id, app.id, version.id);

        const aRow = await findEntity(UserAppActivity, { userId: a.user.id, appId: app.id });
        const bRow = await findEntity(UserAppActivity, { userId: b.user.id, appId: app.id });
        expect(aRow.lastEditedAt.getTime()).toBeGreaterThan(bRow.lastEditedAt.getTime());
      });

      it('should skip inside the 5-minute window when the user is still the latest editor', async () => {
        const a = await createAdmin(nestApp, 'dash-act-solo@tooljet.io');
        const branch = await resolveOrSeedDefaultBranch(a.workspace.id);
        const { app, version } = await seedDashboardApp(nestApp, { user: a.user, name: 'Solo editor' });
        const seeded = new Date(Date.now() - 2 * 60_000);
        await seedActivity(a.user.id, app.id, branch.id, { lastEditedAt: seeded });

        await nestApp.get(DashboardActivityService).recordEdit(a.user.id, app.id, version.id);

        expect((await findEntity(UserAppActivity, { userId: a.user.id, appId: app.id })).lastEditedAt).toEqual(seeded);
      });
    });
  });
});
