import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '@entities/folder_app.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  createFolder,
  getEntityRepository,
  resolveOrSeedDefaultBranch,
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
  const bulkRemove = (cookie: string[], workspaceId: string, body: Record<string, unknown>) =>
    request(nestApp.getHttpServer())
      .post('/api/v2/folder-apps/bulk-remove')
      .set('Cookie', cookie)
      .set('tj-workspace-id', workspaceId)
      .send(body);
  const v1Remove = (cookie: string[], workspaceId: string, folderId: string, appId: string) =>
    request(nestApp.getHttpServer())
      .put(`/api/folder-apps/${folderId}`)
      .set('Cookie', cookie)
      .set('tj-workspace-id', workspaceId)
      .send({ app_id: appId });
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

  describe('POST /api/v2/folder-apps/bulk-remove | Bulk remove', () => {
    it('should remove apps from different folders, and treat an app in no folder as a no-op', async () => {
      const admin = await createAdmin(nestApp, 'bulk-remove-ok@tooljet.io');
      const first = await createFolder(nestApp, { name: 'First', organizationId: admin.workspace.id });
      const second = await createFolder(nestApp, { name: 'Second', organizationId: admin.workspace.id });
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A', folder: first });
      const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B', folder: second });
      const { app: stray } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Stray' });

      const res = await bulkRemove(admin.cookie, admin.workspace.id, {
        app_ids: [a.id, b.id, stray.id],
        type: APP_TYPES.FRONT_END,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderOf(a.id)).toBeNull();
      expect(await folderOf(b.id)).toBeNull();
      expect(await folderOf(stray.id)).toBeNull();
    });

    it('should write nothing when any app is blocked', async () => {
      const { admin, endUser, folder } = await ownerSetup('remove-blocked');
      const adminFolder = await createFolder(nestApp, { name: 'Admin folder', organizationId: admin.workspace.id });
      const { app: mine } = await seedDashboardApp(nestApp, { user: endUser.user, name: 'Mine', folder });
      const { app: theirs } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'Theirs',
        folder: adminFolder,
      });

      const res = await bulkRemove(endUser.cookie, admin.workspace.id, {
        app_ids: [mine.id, theirs.id],
        type: APP_TYPES.FRONT_END,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [theirs.id] });
      expect(await folderOf(mine.id)).toBe(folder.id);
      expect(await folderOf(theirs.id)).toBe(adminFolder.id);
    });

    it('should block app ids from another workspace, and a type mismatch', async () => {
      const admin = await createAdmin(nestApp, 'bulk-remove-foreign@tooljet.io');
      const other = await createAdmin(nestApp, 'bulk-remove-foreign-other@tooljet.io');
      const { app: foreignApp } = await seedDashboardApp(nestApp, { user: other.user, name: 'Foreign' });
      const { app: moduleApp } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'Module',
        type: APP_TYPES.MODULE,
      });

      const res = await bulkRemove(admin.cookie, admin.workspace.id, {
        app_ids: [foreignApp.id, moduleApp.id],
        type: APP_TYPES.FRONT_END,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [foreignApp.id, moduleApp.id] });
    });

    it('should move and remove workflows the same way', async () => {
      const admin = await createAdmin(nestApp, 'bulk-remove-workflow@tooljet.io');
      const folder = await createFolder(nestApp, {
        name: 'Workflows',
        type: APP_TYPES.WORKFLOW,
        organizationId: admin.workspace.id,
      });
      const { app: workflow } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'Flow',
        type: APP_TYPES.WORKFLOW,
      });

      const moved = await bulkMove(admin.cookie, admin.workspace.id, {
        app_ids: [workflow.id],
        folder_id: folder.id,
      }).expect(200);
      expect(moved.body).toEqual({ blocked_ids: [] });
      expect(await folderOf(workflow.id)).toBe(folder.id);

      const removed = await bulkRemove(admin.cookie, admin.workspace.id, {
        app_ids: [workflow.id],
        type: APP_TYPES.WORKFLOW,
      }).expect(200);
      expect(removed.body).toEqual({ blocked_ids: [] });
      expect(await folderOf(workflow.id)).toBeNull();
    });

    it('should 400 on a bad body', async () => {
      const admin = await createAdmin(nestApp, 'bulk-remove-400@tooljet.io');
      await bulkRemove(admin.cookie, admin.workspace.id, { app_ids: [], type: 'nope' }).expect(400);
    });
  });

  // Same scenarios through v1 single remove and v2 bulk remove: the two must agree.
  describe('v1 / v2 remove parity', () => {
    const scenarios: {
      name: string;
      tag: string;
      appOwner: 'endUser' | 'admin';
      folderOwner: 'endUser' | 'admin';
      caller: 'endUser' | 'admin';
      allowed: boolean;
    }[] = [
      {
        name: 'folder owner, own app',
        tag: 'r-own',
        appOwner: 'endUser',
        folderOwner: 'endUser',
        caller: 'endUser',
        allowed: true,
      },
      {
        name: 'folder owner, someone else’s app',
        tag: 'r-foreign',
        appOwner: 'admin',
        folderOwner: 'endUser',
        caller: 'endUser',
        allowed: true,
      },
      {
        name: 'not the folder owner, own app',
        tag: 'r-not-owner',
        appOwner: 'endUser',
        folderOwner: 'admin',
        caller: 'endUser',
        allowed: false,
      },
      {
        name: 'admin, someone else’s folder',
        tag: 'r-admin',
        appOwner: 'endUser',
        folderOwner: 'endUser',
        caller: 'admin',
        allowed: true,
      },
    ];

    it.each(scenarios)('$name', async ({ tag, appOwner, folderOwner, caller, allowed }) => {
      const { admin, endUser, folder: ownedFolder } = await ownerSetup(tag);
      const folder =
        folderOwner === 'admin'
          ? await createFolder(nestApp, { name: `Admin ${tag}`, organizationId: admin.workspace.id })
          : ownedFolder;
      const owner = appOwner === 'admin' ? admin.user : endUser.user;
      const { app: viaV1 } = await seedDashboardApp(nestApp, { user: owner, name: `${tag} v1`, folder });
      const { app: viaV2 } = await seedDashboardApp(nestApp, { user: owner, name: `${tag} v2`, folder });
      const cookie = caller === 'admin' ? admin.cookie : endUser.cookie;

      const v1 = await v1Remove(cookie, admin.workspace.id, folder.id, viaV1.id);
      const v2 = await bulkRemove(cookie, admin.workspace.id, {
        app_ids: [viaV2.id],
        type: APP_TYPES.FRONT_END,
      }).expect(200);

      expect(v1.statusCode).toBe(allowed ? 200 : 403);
      expect(v2.body.blocked_ids).toEqual(allowed ? [] : [viaV2.id]);
      expect(await folderOf(viaV2.id)).toBe(allowed ? null : folder.id);
    });
  });

  describe('git-sync folder write guard', () => {
    const multiBranchGit = (defaultBranch: WorkspaceBranch) =>
      jest.spyOn(GitSyncConfigsUtilService.prototype, 'getDetails').mockResolvedValue({
        isEnabled: true,
        isMultiBranchingEnabled: true,
        options: {
          type: null,
          defaultBranch: { id: defaultBranch.id, name: defaultBranch.name },
          isBranchingEnabled: true,
        },
        orgGit: null,
      } as any);

    it('should refuse bulk move and bulk remove on the default branch', async () => {
      const admin = await createAdmin(nestApp, 'bulk-guard-default@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const inFolder = await createFolder(nestApp, { name: 'In', organizationId: admin.workspace.id });
      const target = await createFolder(nestApp, { name: 'Target', organizationId: admin.workspace.id });
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A', folder: inFolder });
      const { app: workflow } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'Flow',
        type: APP_TYPES.WORKFLOW,
      });
      const spy = multiBranchGit(branch);
      try {
        for (const branchField of [{ branch_id: branch.id }, {}]) {
          await bulkMove(admin.cookie, admin.workspace.id, {
            app_ids: [app.id],
            folder_id: target.id,
            ...branchField,
          }).expect(403);
          await bulkRemove(admin.cookie, admin.workspace.id, {
            app_ids: [app.id],
            type: APP_TYPES.FRONT_END,
            ...branchField,
          }).expect(403);
          await bulkRemove(admin.cookie, admin.workspace.id, {
            app_ids: [workflow.id],
            type: APP_TYPES.WORKFLOW,
            ...branchField,
          }).expect(403);
        }
      } finally {
        spy.mockRestore();
      }
      expect(await folderOf(app.id)).toBe(inFolder.id);
    });

    it('should allow both on a feature branch', async () => {
      const admin = await createAdmin(nestApp, 'bulk-guard-feature@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const feature = await saveEntity(WorkspaceBranch, {
        organizationId: admin.workspace.id,
        name: 'feature',
        isDefault: false,
      } as WorkspaceBranch);
      const target = await createFolder(nestApp, { name: 'Target', organizationId: admin.workspace.id });
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A', branchId: feature.id });
      const spy = multiBranchGit(branch);
      try {
        const moved = await bulkMove(admin.cookie, admin.workspace.id, {
          app_ids: [app.id],
          folder_id: target.id,
          branch_id: feature.id,
        }).expect(200);
        expect(moved.body).toEqual({ blocked_ids: [] });
        expect(await folderOf(app.id)).toBe(target.id);

        const removed = await bulkRemove(admin.cookie, admin.workspace.id, {
          app_ids: [app.id],
          type: APP_TYPES.FRONT_END,
          branch_id: feature.id,
        }).expect(200);
        expect(removed.body).toEqual({ blocked_ids: [] });
        expect(await folderOf(app.id)).toBeNull();
      } finally {
        spy.mockRestore();
      }
    });
  });
});
