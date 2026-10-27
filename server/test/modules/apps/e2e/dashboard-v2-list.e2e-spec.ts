import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  createFolder,
  findEntityOrFail,
  resolveOrSeedDefaultBranch,
  saveEntity,
  seedActivity,
  seedDashboardApp,
  seedPin,
  updateEntity,
} from 'test-helper';

const list = (nestApp: INestApplication, cookie: string[], workspaceId: string, query: Record<string, unknown>) =>
  request(nestApp.getHttpServer())
    .get('/api/v2/apps')
    .query(query)
    .set('Cookie', cookie)
    .set('tj-workspace-id', workspaceId);

/** @group platform */
describe('DashboardAppsController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('GET /api/v2/apps | Root list', () => {
    it('should reject unauthenticated requests', async () => {
      await request(nestApp.getHttpServer()).get('/api/v2/apps').query({ type: 'front-end' }).expect(401);
    });

    it('should reject page < 1, page_size > 50 and missing type with 400', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-400@tooljet.io');
      for (const query of [{ type: 'front-end', page: 0 }, { type: 'front-end', page_size: 51 }, {}]) {
        expect((await list(nestApp, admin.cookie, admin.workspace.id, query)).statusCode).toBe(400);
      }
    });

    it('should return folders first, then stray apps, in the documented shape for a builder', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-shape@tooljet.io');
      const folder = await createFolder(nestApp, { name: 'Sales', organizationId: admin.workspace.id });
      const { app: inFolder } = await seedDashboardApp(nestApp, { user: admin.user, name: 'In folder', folder });
      const { app: stray } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Stray', released: true });

      const res = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end' });

      expect(res.statusCode).toBe(200);
      expect(res.body).not.toHaveProperty('pinned');
      expect(res.body).toMatchObject({
        page: 1,
        page_size: 50,
        total: 2,
        counts: { pinned: 0, folders: 1, apps: 1 },
        folder: null,
        items: [
          {
            kind: 'folder',
            id: folder.id,
            name: 'Sales',
            app_count: 1,
            last_modified_at: expect.any(String),
            modified_by: null,
            owner: null, // createFolder leaves created_by unset
            pinned: false,
            actions: { rename: true, delete: true, pin: true },
          },
          {
            kind: 'app',
            id: stray.id,
            name: 'Stray',
            slug: expect.any(String),
            folder: null,
            released_version: expect.any(String),
            last_modified_at: expect.any(String),
            modified_by: null,
            owner: { id: admin.user.id, name: expect.any(String) },
            pinned: false,
            actions: { launch: { enabled: true, reason: null }, edit: true, delete: true, pin: true },
            created_at: expect.any(String),
            git: null,
          },
        ],
      });
      expect(res.body.items.map((i: { id: string }) => i.id)).not.toContain(inFolder.id);
      expect(res.body.items[1]).not.toHaveProperty('is_public');
      expect(res.body.items[0]).not.toHaveProperty('git');
    });

    it('should return git-sync state per app when git-sync is on, and no Launch for a stub', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-git@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const { app: synced } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Synced' });
      const { app: stub } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Stub' });
      const syncedVersion = await findEntityOrFail(AppVersion, { appId: synced.id });
      await updateEntity(AppVersion, syncedVersion.id, {
        isSynced: true,
        status: AppVersionStatus.DRAFT,
        versionType: AppVersionType.VERSION,
      });
      const stubVersion = await findEntityOrFail(AppVersion, { appId: stub.id });
      await updateEntity(AppVersion, stubVersion.id, { isStub: true, isSynced: false });
      const spy = jest.spyOn(GitSyncConfigsUtilService.prototype, 'getDetails').mockResolvedValue({
        isEnabled: true,
        isMultiBranchingEnabled: false,
        options: { type: null, defaultBranch: { id: branch.id, name: branch.name }, isBranchingEnabled: false },
        orgGit: null,
      } as any);
      try {
        const res = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end' });
        const byId = new Map(res.body.items.map((i: { id: string }) => [i.id, i]));
        expect(byId.get(synced.id)).toMatchObject({
          git: { synced: true, version_synced: true, stub: false, push_version_id: syncedVersion.id },
        });
        expect(byId.get(stub.id)).toMatchObject({
          git: { synced: false, version_synced: false, stub: true },
          actions: { launch: null },
        });
      } finally {
        spy.mockRestore();
      }
    });

    it('should order a builder’s rows by their own last edit, untouched rows last by name', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-order@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A untouched' });
      const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B old edit' });
      const { app: c } = await seedDashboardApp(nestApp, { user: admin.user, name: 'C new edit' });
      await seedActivity(admin.user.id, b.id, branch.id, { lastEditedAt: new Date('2026-01-01') });
      await seedActivity(admin.user.id, c.id, branch.id, { lastEditedAt: new Date('2026-06-01') });

      const res = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end' });

      expect(res.body.items.map((i: { id: string }) => i.id)).toEqual([c.id, b.id, a.id]);
      expect(res.body.items[0]).toMatchObject({ modified_by: { id: admin.user.id } });
      expect(res.body.items[2]).toMatchObject({ modified_by: null });
    });

    it('end user gets no modules', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-eu-mod-admin@tooljet.io');
      const endUser = await createEndUser(nestApp, 'dash-list-eu-mod@tooljet.io', { workspace: admin.workspace });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Mod', type: APP_TYPES.MODULE, released: true });

      const res = await list(nestApp, endUser.cookie, admin.workspace.id, { type: 'module' });

      expect(res.body).toMatchObject({ items: [], total: 0 });
    });

    it('should put pins first in items by position, flat with folder refs, counted only in counts.pinned', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-pins@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const folder = await createFolder(nestApp, { name: 'Pinned folder', organizationId: admin.workspace.id });
      const { app: nested } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Nested pinned', folder });
      const { app: strayPinned } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Stray pinned' });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Unpinned' });
      await seedPin(admin.user, { appId: strayPinned.id, branchId: branch.id, position: 0 });
      await seedPin(admin.user, { folderId: folder.id, branchId: branch.id, position: 1 });
      await seedPin(admin.user, { appId: nested.id, branchId: branch.id, position: 2 });

      const page1 = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end' });
      const page2 = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', page: 2 });

      expect(page1.body).not.toHaveProperty('pinned');
      expect(page1.body).toMatchObject({
        total: 4,
        counts: { pinned: 3, folders: 0, apps: 1 },
        items: [
          { kind: 'app', id: strayPinned.id, folder: null, pinned: true },
          { kind: 'folder', id: folder.id, pinned: true },
          { kind: 'app', id: nested.id, folder: { id: folder.id, name: 'Pinned folder' }, pinned: true },
          { kind: 'app', name: 'Unpinned', pinned: false },
        ],
      });
      expect(page1.body.items).toHaveLength(4);
      expect(page2.body).toMatchObject({ items: [], total: 4, page: 2, counts: { pinned: 3, folders: 0, apps: 1 } });
    });

    it('should page pins and unpinned rows as one list without gap or overlap', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-paging@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const apps: App[] = [];
      for (let i = 0; i < 6; i++) apps.push((await seedDashboardApp(nestApp, { user: admin.user, name: `P${i}` })).app);
      await seedPin(admin.user, { appId: apps[5].id, branchId: branch.id, position: 0 });

      const ids = async (page: number) =>
        (
          await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', page, page_size: 3 })
        ).body.items.map((i: { id: string }) => i.id);
      const [p1, p2, p3] = [await ids(1), await ids(2), await ids(3)];

      expect(p1).toEqual([apps[5].id, apps[0].id, apps[1].id]);
      expect(p2).toEqual([apps[2].id, apps[3].id, apps[4].id]);
      expect(p3).toEqual([]);
    });

    it('should spill pins past page_size onto page 2, ahead of unpinned rows', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-pin-spill@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const apps: App[] = [];
      for (let i = 0; i < 6; i++) apps.push((await seedDashboardApp(nestApp, { user: admin.user, name: `S${i}` })).app);
      for (const [position, i] of [3, 2, 1, 0].entries()) {
        await seedPin(admin.user, { appId: apps[i].id, branchId: branch.id, position });
      }

      const page = (n: number) =>
        list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', page: n, page_size: 3 });
      const [p1, p2] = [await page(1), await page(2)];
      const ids = (res: { body: { items: { id: string }[] } }) => res.body.items.map((i) => i.id);

      expect(ids(p1)).toEqual([apps[3].id, apps[2].id, apps[1].id]);
      expect(p1.body.items.every((i: { pinned: boolean }) => i.pinned)).toBe(true);
      expect(ids(p2)).toEqual([apps[0].id, apps[4].id, apps[5].id]);
      expect(p2.body.items.map((i: { pinned: boolean }) => i.pinned)).toEqual([true, false, false]);
      expect(p2.body).toMatchObject({ total: 6, counts: { pinned: 4, folders: 0, apps: 2 } });
    });

    it('should continue from the last folder to the first app across a page break', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-folder-break@tooljet.io');
      const fa = await createFolder(nestApp, { name: 'FA', organizationId: admin.workspace.id });
      const fb = await createFolder(nestApp, { name: 'FB', organizationId: admin.workspace.id });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'In FA', folder: fa });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'In FB', folder: fb });
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A stray' });
      const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B stray' });

      const page = (n: number) =>
        list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', page: n, page_size: 3 });
      const [p1, p2] = [await page(1), await page(2)];
      const ids = (res: { body: { items: { id: string }[] } }) => res.body.items.map((i) => i.id);

      expect(ids(p1)).toEqual([fa.id, fb.id, a.id]);
      expect(ids(p2)).toEqual([b.id]);
      expect(p2.body).toMatchObject({ total: 4, counts: { pinned: 0, folders: 2, apps: 2 } });
    });

    it('should hide apps with no version row on the requested branch, including their pins', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-branch@tooljet.io');
      const main = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const feature = await saveEntity(WorkspaceBranch, {
        organizationId: admin.workspace.id,
        name: 'feature-x',
      } as WorkspaceBranch);
      const { app: featureOnly } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'Feature only',
        branchId: feature.id,
      });
      await seedPin(admin.user, { appId: featureOnly.id, branchId: main.id, position: 0 });

      const onMain = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end' });
      const onFeature = await list(nestApp, admin.cookie, admin.workspace.id, {
        type: 'front-end',
        branch_id: feature.id,
      });

      expect(onMain.body).toMatchObject({ items: [], total: 0, counts: { pinned: 0, folders: 0, apps: 0 } });
      expect(onFeature.body.items.map((i: { id: string }) => i.id)).toEqual([featureOnly.id]);
    });

    it('should flag unreleased and maintenance apps in actions.launch', async () => {
      const admin = await createAdmin(nestApp, 'dash-list-launch@tooljet.io');
      const { app: draft } = await seedDashboardApp(nestApp, { user: admin.user, name: 'L draft' });
      const { app: down } = await seedDashboardApp(nestApp, { user: admin.user, name: 'L maint', released: true });
      await updateEntity(App, down.id, { isMaintenanceOn: true });

      const res = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end' });
      const byId = new Map(res.body.items.map((i: { id: string }) => [i.id, i]));

      expect(byId.get(draft.id)).toMatchObject({ actions: { launch: { enabled: false, reason: 'not_released' } } });
      expect(byId.get(down.id)).toMatchObject({ actions: { launch: { enabled: false, reason: 'maintenance' } } });
    });
  });

  describe('GET /api/v2/apps?folder_id | Folder contents', () => {
    it('should page a folder’s visible apps with offset pages and return the folder ref', async () => {
      const admin = await createAdmin(nestApp, 'dash-folder-page@tooljet.io');
      const folder = await createFolder(nestApp, { name: 'HR', organizationId: admin.workspace.id });
      for (let i = 0; i < 3; i++) await seedDashboardApp(nestApp, { user: admin.user, name: `HR${i}`, folder });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Outside' });

      const p1 = await list(nestApp, admin.cookie, admin.workspace.id, {
        type: 'front-end',
        folder_id: folder.id,
        page_size: 2,
      });
      const p2 = await list(nestApp, admin.cookie, admin.workspace.id, {
        type: 'front-end',
        folder_id: folder.id,
        page_size: 2,
        page: 2,
      });

      expect(p1.body).toMatchObject({
        total: 3,
        counts: { pinned: 0, folders: 0, apps: 3 },
        folder: { id: folder.id, name: 'HR' },
        items: [
          { kind: 'app', folder: { id: folder.id, name: 'HR' } },
          { kind: 'app', folder: { id: folder.id, name: 'HR' } },
        ],
      });
      expect(p2.body.items).toHaveLength(1);
    });

    it('should put the folder’s pinned apps first by position, counted only in counts.pinned', async () => {
      const admin = await createAdmin(nestApp, 'dash-folder-pins@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const folder = await createFolder(nestApp, { name: 'Ops', organizationId: admin.workspace.id });
      const apps: App[] = [];
      for (let i = 0; i < 3; i++)
        apps.push((await seedDashboardApp(nestApp, { user: admin.user, name: `Ops${i}`, folder })).app);
      await seedPin(admin.user, { appId: apps[2].id, branchId: branch.id, position: 0 });
      await seedPin(admin.user, { appId: apps[1].id, branchId: branch.id, position: 1 });

      const p1 = await list(nestApp, admin.cookie, admin.workspace.id, {
        type: 'front-end',
        folder_id: folder.id,
        page_size: 2,
      });
      const p2 = await list(nestApp, admin.cookie, admin.workspace.id, {
        type: 'front-end',
        folder_id: folder.id,
        page_size: 2,
        page: 2,
      });

      expect(p1.body).toMatchObject({
        total: 3,
        counts: { pinned: 2, folders: 0, apps: 1 },
        items: [
          { id: apps[2].id, pinned: true },
          { id: apps[1].id, pinned: true },
        ],
      });
      expect(p2.body.items).toMatchObject([{ id: apps[0].id, pinned: false }]);
    });

    it('should 404 for a folder the user cannot see', async () => {
      const admin = await createAdmin(nestApp, 'dash-folder-404-admin@tooljet.io');
      const endUser = await createEndUser(nestApp, 'dash-folder-404@tooljet.io', { workspace: admin.workspace });
      const folder = await createFolder(nestApp, { name: 'Drafts', organizationId: admin.workspace.id });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Draft', folder });

      const res = await list(nestApp, endUser.cookie, admin.workspace.id, {
        type: 'front-end',
        folder_id: folder.id,
      });

      expect(res.statusCode).toBe(404);
    });

    it('should 404 for another workspace’s folder', async () => {
      const owner = await createAdmin(nestApp, 'dash-folder-xws-owner@tooljet.io');
      const outsider = await createAdmin(nestApp, 'dash-folder-xws-outsider@tooljet.io');
      const folder = await createFolder(nestApp, { name: 'Private', organizationId: owner.workspace.id });
      await seedDashboardApp(nestApp, { user: owner.user, name: 'Secret', folder });

      const res = await list(nestApp, outsider.cookie, outsider.workspace.id, {
        type: 'front-end',
        folder_id: folder.id,
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/v2/apps?search | Search', () => {
    it('should return pinned matches first, then name-matched folders, then matched apps grouped by folder, strays last', async () => {
      const admin = await createAdmin(nestApp, 'dash-search@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const matchFolder = await createFolder(nestApp, { name: 'Report hub', organizationId: admin.workspace.id });
      const other = await createFolder(nestApp, { name: 'Misc', organizationId: admin.workspace.id });
      const { app: inOther } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Report A', folder: other });
      const { app: stray } = await seedDashboardApp(nestApp, { user: admin.user, name: 'report stray' });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Unrelated' });
      await seedPin(admin.user, { appId: stray.id, branchId: branch.id, position: 0 });

      const res = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', search: '  report ' });

      expect(res.body).not.toHaveProperty('pinned');
      expect(res.body).toMatchObject({
        total: 3,
        counts: { pinned: 1, folders: 1, apps: 1 },
        items: [
          { kind: 'app', id: stray.id, folder: null, pinned: true },
          { kind: 'folder', id: matchFolder.id, pinned: false },
          { kind: 'app', id: inOther.id, folder: { id: other.id, name: 'Misc' }, pinned: false },
        ],
      });
      expect(res.body.items).toHaveLength(3);
    });

    it('should treat % and _ as literal characters', async () => {
      const admin = await createAdmin(nestApp, 'dash-search-meta@tooljet.io');
      const { app: literal } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Q1 50% off' });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Q1 500 off' });

      const res = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', search: '50%' });

      expect(res.body.items.map((i: { id: string }) => i.id)).toEqual([literal.id]);
    });

    it('should ignore folder_id when search is set (search is workspace-wide)', async () => {
      const admin = await createAdmin(nestApp, 'dash-search-folder@tooljet.io');
      const folder = await createFolder(nestApp, { name: 'Ops', organizationId: admin.workspace.id });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Ops tracker', folder });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Root tracker' });

      const plain = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', search: 'tracker' });
      const withFolder = await list(nestApp, admin.cookie, admin.workspace.id, {
        type: 'front-end',
        folder_id: folder.id,
        search: 'tracker',
      });

      expect(withFolder.body).toMatchObject({ total: 2, folder: null });
      expect(withFolder.body).toEqual(plain.body);
    });

    it('should not leak hidden folders or unreleased apps to end users', async () => {
      const admin = await createAdmin(nestApp, 'dash-search-enduser-admin@tooljet.io');
      const endUser = await createEndUser(nestApp, 'dash-search-enduser@tooljet.io', { workspace: admin.workspace });
      const folder = await createFolder(nestApp, { name: 'Drafts', organizationId: admin.workspace.id });
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Drafts board', folder });

      const res = await list(nestApp, endUser.cookie, admin.workspace.id, { type: 'front-end', search: 'drafts' });

      expect(res.body).toMatchObject({ total: 0, counts: { pinned: 0, folders: 0, apps: 0 }, items: [] });
    });

    it('should group matched apps by folder, most recently active folder first, unfoldered apps last', async () => {
      const admin = await createAdmin(nestApp, 'dash-search-groups@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const older = await createFolder(nestApp, { name: 'Older', organizationId: admin.workspace.id });
      const newer = await createFolder(nestApp, { name: 'Newer', organizationId: admin.workspace.id });
      const { app: inOlder } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'Report older',
        folder: older,
      });
      const { app: inNewer } = await seedDashboardApp(nestApp, {
        user: admin.user,
        name: 'Report newer',
        folder: newer,
      });
      const { app: stray } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Report stray' });
      await seedActivity(admin.user.id, stray.id, branch.id, { lastEditedAt: new Date('2026-09-01') });
      await seedActivity(admin.user.id, inNewer.id, branch.id, { lastEditedAt: new Date('2026-06-01') });
      await seedActivity(admin.user.id, inOlder.id, branch.id, { lastEditedAt: new Date('2026-01-01') });

      const res = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', search: 'report' });

      expect(res.body.items.map((i: { id: string }) => i.id)).toEqual([inNewer.id, inOlder.id, stray.id]);
    });

    it('should page search results without gap or overlap', async () => {
      const admin = await createAdmin(nestApp, 'dash-search-paging@tooljet.io');
      const apps: App[] = [];
      for (let i = 0; i < 4; i++)
        apps.push((await seedDashboardApp(nestApp, { user: admin.user, name: `Find ${i}` })).app);
      await seedDashboardApp(nestApp, { user: admin.user, name: 'Other' });

      const page = (n: number) =>
        list(nestApp, admin.cookie, admin.workspace.id, { type: 'front-end', search: 'find', page: n, page_size: 3 });
      const [p1, p2] = [await page(1), await page(2)];
      const ids = (res: { body: { items: { id: string }[] } }) => res.body.items.map((i) => i.id);

      expect(ids(p1)).toHaveLength(3);
      expect(ids(p2)).toHaveLength(1);
      expect([...ids(p1), ...ids(p2)].sort()).toEqual(apps.map((app) => app.id).sort());
      expect(p2.body).toMatchObject({ total: 4, page: 2 });
    });
  });
});
