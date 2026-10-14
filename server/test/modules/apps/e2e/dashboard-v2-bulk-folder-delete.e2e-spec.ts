import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from '@entities/app.entity';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { APP_TYPES } from '@modules/apps/constants';
import {
  initTestApp,
  closeTestApp,
  addAppToFolder,
  createAdmin,
  createBuilder,
  createEndUser,
  createFolder,
  findEntities,
  findEntity,
  findEntityOrFail,
  saveEntity,
  seedDashboardApp,
  updateEntity,
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

      expect(res.body).toMatchObject({
        applied: true,
        blocked_ids: [],
        counts: { allowed: 2, blocked: 0, done: 2 },
        apps_to_root: [],
        hidden_apps_to_root: 0,
      });
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

      expect(res.body).toMatchObject({ applied: true, counts: { done: 1 }, apps_to_root: [], hidden_apps_to_root: 0 });
      expect(await folderExists(folder.id)).toBe(false);
      expect(await appExists(a.id)).toBe(false);
      expect(await appExists(b.id)).toBe(false);
    });

    it('should write nothing on dry_run or when any folder is blocked, and delete the rest with skip_blocked', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-modes@tooljet.io');
      const endUser = await createEndUser(nestApp, 'bulk-fdel-modes-eu@tooljet.io', { workspace: admin.workspace });
      const mine = await folderOf('Mine', admin.workspace.id, endUser.user.id);
      const theirs = await folderOf('Theirs', admin.workspace.id, admin.user.id);
      const body = { folder_ids: [mine.id, theirs.id], mode: 'folder_only', type: 'front-end' };

      const dry = await bulkDelete(endUser.cookie, admin.workspace.id, { ...body, dry_run: true }).expect(200);
      expect(dry.body).toMatchObject({
        dry_run: true,
        applied: false,
        blocked_ids: [theirs.id],
        counts: { allowed: 1, blocked: 1, done: 0 },
      });
      expect(await folderExists(mine.id)).toBe(true);

      const allOrNothing = await bulkDelete(endUser.cookie, admin.workspace.id, body).expect(200);
      expect(allOrNothing.body).toMatchObject({ applied: false, counts: { done: 0 } });
      expect(await folderExists(mine.id)).toBe(true);
      expect(await folderExists(theirs.id)).toBe(true);

      const skip = await bulkDelete(endUser.cookie, admin.workspace.id, { ...body, skip_blocked: true }).expect(200);
      expect(skip.body).toMatchObject({ applied: true, blocked_ids: [theirs.id], counts: { allowed: 1, done: 1 } });
      expect(await folderExists(mine.id)).toBe(false);
      expect(await folderExists(theirs.id)).toBe(true);
    });

    it('should move apps the user cannot delete to root, counting the hidden ones', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-hidden@tooljet.io');
      const endUser = await createEndUser(nestApp, 'bulk-fdel-hidden-eu@tooljet.io', { workspace: admin.workspace });
      const folder = await folderOf('Mine', admin.workspace.id, endUser.user.id);
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Admin app', folder });
      const body = { folder_ids: [folder.id], mode: 'folder_and_apps', type: 'front-end' };

      const dry = await bulkDelete(endUser.cookie, admin.workspace.id, { ...body, dry_run: true }).expect(200);
      expect(dry.body).toMatchObject({ blocked_ids: [], apps_to_root: [], hidden_apps_to_root: 1 });

      const res = await bulkDelete(endUser.cookie, admin.workspace.id, body).expect(200);
      expect(res.body).toMatchObject({ applied: true, counts: { done: 1 }, apps_to_root: [], hidden_apps_to_root: 1 });
      expect(await folderExists(folder.id)).toBe(false);
      expect(await appExists(app.id)).toBe(true);
    });

    it('should list visible apps the user cannot delete by name', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-visible@tooljet.io');
      const builder = await createBuilder(nestApp, 'bulk-fdel-visible-b@tooljet.io', { workspace: admin.workspace });
      const builderGroup = await findEntityOrFail(GroupPermissions, {
        organizationId: admin.workspace.id,
        name: 'builder',
      } as any);
      await updateEntity(GroupPermissions, builderGroup.id, { appDelete: false });
      const folder = await folderOf('Builder folder', admin.workspace.id, builder.user.id);
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Visible app', folder });

      const res = await bulkDelete(builder.cookie, admin.workspace.id, {
        folder_ids: [folder.id],
        mode: 'folder_and_apps',
        type: 'front-end',
      }).expect(200);

      expect(res.body).toMatchObject({
        applied: true,
        counts: { done: 1 },
        apps_to_root: [{ id: app.id, name: 'Visible app' }],
        hidden_apps_to_root: 0,
      });
      expect(await folderExists(folder.id)).toBe(false);
      expect(await appExists(app.id)).toBe(true);
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
        dry_run: true,
      }).expect(200);

      expect(res.body).toMatchObject({ blocked_ids: [folder.id], counts: { allowed: 0, blocked: 1 } });
    });

    it('should 400 on a bad body', async () => {
      const admin = await createAdmin(nestApp, 'bulk-fdel-400@tooljet.io');
      await bulkDelete(admin.cookie, admin.workspace.id, { folder_ids: [], mode: 'nope', type: 'front-end' }).expect(
        400
      );
    });
  });
});
