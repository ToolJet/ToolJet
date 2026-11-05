import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Folder } from '@entities/folder.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { initTestApp, closeTestApp, createAdmin, createEndUser, saveEntity, seedDashboardApp } from 'test-helper';

/** @group platform */
describe('FolderAppsController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  // End user who created the folder, no folder grants: only the owner rule can allow the move.
  const setup = async (tag: string) => {
    const admin = await createAdmin(nestApp, `move-guard-admin-${tag}@tooljet.io`);
    const { user, cookie } = await createEndUser(nestApp, `move-guard-${tag}@tooljet.io`, {
      workspace: admin.workspace,
    });
    const folder = await saveEntity(Folder, {
      name: `Owned ${tag}`,
      organizationId: admin.workspace.id,
      createdBy: user.id,
    } as Folder);
    return { admin, user, cookie, folder };
  };
  const move = (cookie: string[], workspaceId: string, body: Record<string, unknown>) =>
    request(nestApp.getHttpServer())
      .post('/api/folder-apps')
      .set('Cookie', cookie)
      .set('tj-workspace-id', workspaceId)
      .send(body);

  describe('POST /api/folder-apps (app_id) | Single move by folder owner', () => {
    it('should allow moving an app the owner also owns', async () => {
      const { admin, user, cookie, folder } = await setup('single-own');
      const { app } = await seedDashboardApp(nestApp, { user, name: 'Mine' });

      expect((await move(cookie, admin.workspace.id, { folder_id: folder.id, app_id: app.id })).statusCode).toBe(201);
    });

    it('should reject an app owned by someone else', async () => {
      const { admin, cookie, folder } = await setup('single-foreign');
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Theirs' });

      expect((await move(cookie, admin.workspace.id, { folder_id: folder.id, app_id: app.id })).statusCode).toBe(403);
    });

    it('should reject an app whose type differs from the folder type', async () => {
      const { admin, user, cookie, folder } = await setup('single-type');
      const { app } = await seedDashboardApp(nestApp, { user, name: 'Mine module', type: APP_TYPES.MODULE });

      expect((await move(cookie, admin.workspace.id, { folder_id: folder.id, app_id: app.id })).statusCode).toBe(403);
    });
  });

  describe('POST /api/folder-apps (app_ids) | Bulk move by folder owner', () => {
    it('should allow moving apps the owner also owns', async () => {
      const { admin, user, cookie, folder } = await setup('bulk-own');
      const { app: a } = await seedDashboardApp(nestApp, { user, name: 'Mine A' });
      const { app: b } = await seedDashboardApp(nestApp, { user, name: 'Mine B' });

      expect((await move(cookie, admin.workspace.id, { folder_id: folder.id, app_ids: [a.id, b.id] })).statusCode).toBe(
        201
      );
    });

    it('should reject the batch when any app is owned by someone else', async () => {
      const { admin, user, cookie, folder } = await setup('bulk-foreign');
      const { app: mine } = await seedDashboardApp(nestApp, { user, name: 'Mine' });
      const { app: theirs } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Theirs' });

      expect(
        (await move(cookie, admin.workspace.id, { folder_id: folder.id, app_ids: [mine.id, theirs.id] })).statusCode
      ).toBe(403);
    });

    it('should reject the batch when any app type differs from the folder type', async () => {
      const { admin, user, cookie, folder } = await setup('bulk-type');
      const { app: mine } = await seedDashboardApp(nestApp, { user, name: 'Mine app' });
      const { app: module } = await seedDashboardApp(nestApp, { user, name: 'Mine module', type: APP_TYPES.MODULE });

      expect(
        (await move(cookie, admin.workspace.id, { folder_id: folder.id, app_ids: [mine.id, module.id] })).statusCode
      ).toBe(403);
    });
  });
});
