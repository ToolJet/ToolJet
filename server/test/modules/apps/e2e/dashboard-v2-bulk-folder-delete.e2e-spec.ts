import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from '@entities/app.entity';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { APP_TYPES } from '@modules/apps/constants';
import {
  initTestApp,
  closeTestApp,
  addAppToFolder,
  createAdmin,
  createEndUser,
  createFolder,
  findEntities,
  findEntity,
  saveEntity,
  seedDashboardApp,
} from 'test-helper';

/** @group platform */
describe('DashboardBulkFolderDeleteController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const bulkDelete = (cookie: string[], workspaceId: string, body: Record<string, unknown>) =>
    request(nestApp.getHttpServer())
      .post('/api/v2/folders/bulk-delete')
      .set('Cookie', cookie)
      .set('tj-workspace-id', workspaceId)
      .send(body);
  const appExists = async (id: string) => !!(await findEntity(App, { id }));
  const folderExists = async (id: string) => !!(await findEntity(Folder, { id }));
  const folderOf = (name: string, organizationId: string, createdBy: string, type = 'front-end') =>
    saveEntity(Folder, { name, organizationId, createdBy, type } as Folder);

  describe('POST /api/v2/folders/bulk-delete | Bulk folder delete', () => {
    it('should delete folders and move their apps to root in folder_only mode', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-only@tooljet.io');
      const f1 = await createFolder(nestApp, { name: 'F1', organizationId: admin.workspace.id });
      const f2 = await createFolder(nestApp, { name: 'F2', organizationId: admin.workspace.id });
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A' });
      const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B' });
      await addAppToFolder(nestApp, a, f1);
      await addAppToFolder(nestApp, b, f2);

      const res = await bulkDelete(admin.cookie, admin.workspace.id, {
        folder_ids: [f1.id, f2.id],
        mode: 'folder_only',
        type: 'front-end',
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderExists(f1.id)).toBe(false);
      expect(await folderExists(f2.id)).toBe(false);
      expect(await appExists(a.id)).toBe(true);
      expect(await appExists(b.id)).toBe(true);
      expect(await findEntities(FolderApp, { where: [{ appId: a.id }, { appId: b.id }] })).toHaveLength(0);
    });

    it("should delete the folder's apps in folder_and_apps mode", async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-apps@tooljet.io');
      const folder = await createFolder(nestApp, { name: 'With apps', organizationId: admin.workspace.id });
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A', folder });
      const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B', folder });

      const res = await bulkDelete(admin.cookie, admin.workspace.id, {
        folder_ids: [folder.id],
        mode: 'folder_and_apps',
        type: 'front-end',
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderExists(folder.id)).toBe(false);
      expect(await appExists(a.id)).toBe(false);
      expect(await appExists(b.id)).toBe(false);
    });

    it('should write nothing when any folder is blocked, and act on the rest when resent without it', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-modes@tooljet.io');
      const endUser = await createEndUser(nestApp, 'bulk-fdel-modes-eu@tooljet.io', { workspace: admin.workspace });
      const mine = await folderOf('Mine', admin.workspace.id, endUser.user.id);
      const theirs = await folderOf('Theirs', admin.workspace.id, admin.user.id);
      const body = { folder_ids: [mine.id, theirs.id], mode: 'folder_only', type: 'front-end' };

      const allOrNothing = await bulkDelete(endUser.cookie, admin.workspace.id, body).expect(200);
      expect(allOrNothing.body).toEqual({ blocked_ids: [theirs.id] });
      expect(await folderExists(mine.id)).toBe(true);
      expect(await folderExists(theirs.id)).toBe(true);

      const resent = await bulkDelete(endUser.cookie, admin.workspace.id, {
        folder_ids: [mine.id],
        mode: 'folder_only',
        type: 'front-end',
      }).expect(200);
      expect(resent.body).toEqual({ blocked_ids: [] });
      expect(await folderExists(mine.id)).toBe(false);
      expect(await folderExists(theirs.id)).toBe(true);
    });

    it('should keep apps the user cannot delete, moving them to root', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-hidden@tooljet.io');
      const endUser = await createEndUser(nestApp, 'bulk-fdel-hidden-eu@tooljet.io', { workspace: admin.workspace });
      const folder = await folderOf('Mine', admin.workspace.id, endUser.user.id);
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Admin app', folder });
      const body = { folder_ids: [folder.id], mode: 'folder_and_apps', type: 'front-end' };

      const res = await bulkDelete(endUser.cookie, admin.workspace.id, body).expect(200);
      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderExists(folder.id)).toBe(false);
      expect(await appExists(app.id)).toBe(true);
      expect(await findEntity(FolderApp, { appId: app.id })).toBeNull();
    });

    it('should block folders of another type', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-type@tooljet.io');
      const folder = await createFolder(nestApp, {
        name: 'Modules',
        type: APP_TYPES.MODULE,
        organizationId: admin.workspace.id,
      });

      const res = await bulkDelete(admin.cookie, admin.workspace.id, {
        folder_ids: [folder.id],
        mode: 'folder_only',
        type: 'front-end',
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [folder.id] });
    });

    it('should 400 on a bad body', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-400@tooljet.io');
      await bulkDelete(admin.cookie, admin.workspace.id, { folder_ids: [], mode: 'nope', type: 'front-end' }).expect(
        400
      );
    });
  });
});
