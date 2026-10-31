import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from '@entities/app.entity';
import { Component } from '@entities/component.entity';
import { Page } from '@entities/page.entity';
import { AppVersion } from '@entities/app_version.entity';
import { APP_TYPES } from '@modules/apps/constants';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  findEntity,
  findEntityOrFail,
  saveEntity,
  seedDashboardApp,
} from 'test-helper';

/** @group platform */
describe('DashboardAppsController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const bulkDelete = (cookie: string[], workspaceId: string, body: Record<string, unknown>) =>
    request(nestApp.getHttpServer())
      .post('/api/v2/apps/bulk-delete')
      .set('Cookie', cookie)
      .set('tj-workspace-id', workspaceId)
      .send(body);
  const exists = async (id: string) => !!(await findEntity(App, { id }));

  describe('POST /api/v2/apps/bulk-delete | Bulk delete', () => {
    it('should delete every allowed app and report the result', async () => {
      const admin = await createAdmin(nestApp, 'bulk-del-ok@tooljet.io');
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A' });
      const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B' });

      const res = await bulkDelete(admin.cookie, admin.workspace.id, {
        app_ids: [a.id, b.id],
        type: 'front-end',
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await exists(a.id)).toBe(false);
      expect(await exists(b.id)).toBe(false);
    });

    it('should write nothing when any app is blocked, and act on the rest when resent without it', async () => {
      const admin = await createAdmin(nestApp, 'bulk-del-modes@tooljet.io');
      const other = await createAdmin(nestApp, 'bulk-del-modes-other@tooljet.io');
      const { app: mine } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Mine' });
      const { app: foreign } = await seedDashboardApp(nestApp, { user: other.user, name: 'Foreign' });
      const body = { app_ids: [mine.id, foreign.id], type: 'front-end' };

      const allOrNothing = await bulkDelete(admin.cookie, admin.workspace.id, body).expect(200);
      expect(allOrNothing.body).toEqual({ blocked_ids: [foreign.id] });
      expect(await exists(mine.id)).toBe(true);
      expect(await exists(foreign.id)).toBe(true);

      const resent = await bulkDelete(admin.cookie, admin.workspace.id, {
        app_ids: [mine.id],
        type: 'front-end',
      }).expect(200);
      expect(resent.body).toEqual({ blocked_ids: [] });
      expect(await exists(mine.id)).toBe(false);
      expect(await exists(foreign.id)).toBe(true);
    });

    it('should block a module that other apps use, like single delete', async () => {
      const admin = await createAdmin(nestApp, 'bulk-del-module@tooljet.io');
      const { app: module } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'Shared module',
        type: APP_TYPES.MODULE,
      });
      const { app: consumer } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Consumer' });
      const consumerVersion = await findEntityOrFail(AppVersion, { appId: consumer.id } as any);
      const page = await findEntityOrFail(Page, { appVersionId: consumerVersion.id } as any);
      await saveEntity(Component, {
        name: 'module1',
        type: 'ModuleViewer',
        pageId: page.id,
        properties: { moduleAppId: { value: module.id }, moduleVersionId: { value: '' } },
        general: {},
        styles: {},
        generalStyles: {},
        validation: {},
      } as any);

      const res = await bulkDelete(admin.cookie, admin.workspace.id, {
        app_ids: [module.id],
        type: 'module',
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [module.id] });
    });

    it('should block apps the user cannot delete and apps of another type', async () => {
      const admin = await createAdmin(nestApp, 'bulk-del-perm@tooljet.io');
      const endUser = await createEndUser(nestApp, 'bulk-del-perm-eu@tooljet.io', { workspace: admin.workspace });
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Admin app' });
      const { app: module } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'A module',
        type: APP_TYPES.MODULE,
      });

      const asEndUser = await bulkDelete(endUser.cookie, admin.workspace.id, {
        app_ids: [app.id],
        type: 'front-end',
      }).expect(200);
      expect(asEndUser.body).toEqual({ blocked_ids: [app.id] });
      const wrongType = await bulkDelete(admin.cookie, admin.workspace.id, {
        app_ids: [module.id],
        type: 'front-end',
      }).expect(200);
      expect(wrongType.body).toEqual({ blocked_ids: [module.id] });
    });

    it('should 400 on a bad body', async () => {
      const admin = await createAdmin(nestApp, 'bulk-del-400@tooljet.io');
      await bulkDelete(admin.cookie, admin.workspace.id, { app_ids: [], type: 'nope' }).expect(400);
    });
  });
});
