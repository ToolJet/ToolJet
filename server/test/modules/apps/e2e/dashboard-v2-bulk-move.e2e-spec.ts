import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { APP_TYPES } from '@modules/apps/constants';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  createFolder,
  getEntityRepository,
  saveEntity,
  seedDashboardApp,
} from 'test-helper';

/** @group platform */
describe('DashboardBulkMoveController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const bulkMove = (cookie: string[], workspaceId: string, body: Record<string, unknown>) =>
    request(nestApp.getHttpServer())
      .post('/api/v2/folder-apps/bulk-move')
      .set('Cookie', cookie)
      .set('tj-workspace-id', workspaceId)
      .send(body);
  const v1Move = (cookie: string[], workspaceId: string, body: Record<string, unknown>) =>
    request(nestApp.getHttpServer())
      .post('/api/folder-apps')
      .set('Cookie', cookie)
      .set('tj-workspace-id', workspaceId)
      .send(body);
  const folderOf = async (appId: string) =>
    (await getEntityRepository(FolderApp).findOne({ where: { appId } }))?.folderId ?? null;

  // End user who created the folder, no folder grants: only the owner rule can allow a move.
  const ownerSetup = async (tag: string) => {
    const admin = await createAdmin(nestApp, `bulk-move-admin-${tag}@tooljet.io`);
    const endUser = await createEndUser(nestApp, `bulk-move-${tag}@tooljet.io`, { workspace: admin.workspace });
    const folder = await saveEntity(Folder, {
      name: `Owned ${tag}`,
      organizationId: admin.workspace.id,
      createdBy: endUser.user.id,
    } as Folder);
    return { admin, endUser, folder };
  };

  describe('POST /api/v2/folder-apps/bulk-move | Bulk move', () => {
    it('should move every allowed app and report the result', async () => {
      const admin = await createAdmin(nestApp, 'bulk-move-ok@tooljet.io');
      const folder = await createFolder(nestApp, { name: 'Target', organizationId: admin.workspace.id });
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A' });
      const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B' });

      const res = await bulkMove(admin.cookie, admin.workspace.id, {
        app_ids: [a.id, b.id],
        folder_id: folder.id,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderOf(a.id)).toBe(folder.id);
      expect(await folderOf(b.id)).toBe(folder.id);
    });

    it('should write nothing when any app is blocked, and act on the rest when resent without it', async () => {
      const { admin, endUser, folder } = await ownerSetup('modes');
      const { app: mine } = await seedDashboardApp(nestApp, { user: endUser.user, name: 'Mine' });
      const { app: theirs } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Theirs' });
      const body = { app_ids: [mine.id, theirs.id], folder_id: folder.id };

      const allOrNothing = await bulkMove(endUser.cookie, admin.workspace.id, body).expect(200);
      expect(allOrNothing.body).toEqual({ blocked_ids: [theirs.id] });
      expect(await folderOf(mine.id)).toBeNull();
      expect(await folderOf(theirs.id)).toBeNull();

      const resent = await bulkMove(endUser.cookie, admin.workspace.id, {
        app_ids: [mine.id],
        folder_id: folder.id,
      }).expect(200);
      expect(resent.body).toEqual({ blocked_ids: [] });
      expect(await folderOf(mine.id)).toBe(folder.id);
      expect(await folderOf(theirs.id)).toBeNull();
    });

    it('should 404 for a folder outside the workspace', async () => {
      const admin = await createAdmin(nestApp, 'bulk-move-404@tooljet.io');
      const other = await createAdmin(nestApp, 'bulk-move-404-other@tooljet.io');
      const foreign = await createFolder(nestApp, { name: 'Foreign', organizationId: other.workspace.id });
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A' });

      await bulkMove(admin.cookie, admin.workspace.id, { app_ids: [app.id], folder_id: foreign.id }).expect(404);
    });

    it('should block app ids from another workspace', async () => {
      const admin = await createAdmin(nestApp, 'bulk-move-foreign-app@tooljet.io');
      const other = await createAdmin(nestApp, 'bulk-move-foreign-app-other@tooljet.io');
      const folder = await createFolder(nestApp, { name: 'Target', organizationId: admin.workspace.id });
      const { app: foreignApp } = await seedDashboardApp(nestApp, { user: other.user, name: 'Foreign' });

      const res = await bulkMove(admin.cookie, admin.workspace.id, {
        app_ids: [foreignApp.id],
        folder_id: folder.id,
      }).expect(200);
      expect(res.body).toEqual({ blocked_ids: [foreignApp.id] });
      expect(await folderOf(foreignApp.id)).toBeNull();
    });

    it('should accept more than 50 app ids', async () => {
      const admin = await createAdmin(nestApp, 'bulk-move-many@tooljet.io');
      const folder = await createFolder(nestApp, { name: 'Target', organizationId: admin.workspace.id });
      const ids = Array.from({ length: 51 }, () => randomUUID());

      const res = await bulkMove(admin.cookie, admin.workspace.id, { app_ids: ids, folder_id: folder.id }).expect(200);
      expect(res.body.blocked_ids).toHaveLength(51);
    });

    it('should 400 on a bad body', async () => {
      const admin = await createAdmin(nestApp, 'bulk-move-400@tooljet.io');
      await bulkMove(admin.cookie, admin.workspace.id, { app_ids: [], folder_id: 'nope' }).expect(400);
    });
  });

  // Same scenarios through v1 single move and v2 bulk move: the two must agree.
  describe('v1 / v2 move parity', () => {
    const scenarios: {
      name: string;
      tag: string;
      app: 'mine' | 'theirs' | 'module';
      asAdmin?: boolean;
      allowed: boolean;
    }[] = [
      { name: 'folder owner, own app', tag: 'p-own', app: 'mine', allowed: true },
      { name: 'folder owner, someone else’s app', tag: 'p-foreign', app: 'theirs', allowed: false },
      { name: 'type mismatch', tag: 'p-type', app: 'module', allowed: false },
      { name: 'admin, an app someone else owns', tag: 'p-admin', app: 'mine', asAdmin: true, allowed: true },
    ];

    it.each(scenarios)('$name', async ({ tag, app: which, asAdmin, allowed }) => {
      const { admin, endUser, folder } = await ownerSetup(tag);
      const owner = which === 'theirs' ? admin.user : endUser.user;
      const type = which === 'module' ? APP_TYPES.MODULE : APP_TYPES.FRONT_END;
      const { app: viaV1 } = await seedDashboardApp(nestApp, { user: owner, name: `${tag} v1`, type });
      const { app: viaV2 } = await seedDashboardApp(nestApp, { user: owner, name: `${tag} v2`, type });
      const cookie = asAdmin ? admin.cookie : endUser.cookie;

      const v1 = await v1Move(cookie, admin.workspace.id, { folder_id: folder.id, app_id: viaV1.id });
      const v2 = await bulkMove(cookie, admin.workspace.id, {
        folder_id: folder.id,
        app_ids: [viaV2.id],
      }).expect(200);

      expect(v1.statusCode).toBe(allowed ? 201 : 403);
      expect(v2.body.blocked_ids).toEqual(allowed ? [] : [viaV2.id]);
    });
  });
});
