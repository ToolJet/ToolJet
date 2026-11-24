import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from '@entities/data_source.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { Folder } from '@entities/folder.entity';
import { User } from '@entities/user.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AbilityService } from '@modules/ability/service';
import { MODULES } from '@modules/app/constants/modules';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import {
  closeTestApp,
  createAdmin,
  createEndUser,
  createFolder,
  initTestApp,
  resolveOrSeedDefaultBranch,
  saveEntity,
  seedDashboardDataSource,
  seedDataSourceActivity,
  seedPin,
  updateEntity,
} from 'test-helper';

const list = (nestApp: INestApplication, cookie: string[], workspaceId: string, query: Record<string, unknown> = {}) =>
  request(nestApp.getHttpServer())
    .get('/api/v2/data-sources')
    .query(query)
    .set('Cookie', cookie)
    .set('tj-workspace-id', workspaceId);

const ids = (body: { items: { id: string }[] }) => body.items.map((i) => i.id);

// CE resolves no granular data-source grants, so per-data-source use / configure grants are layered
// onto the real permission resolve for one user.
function grantDataSources(user: User, grant: { use?: string[]; configure?: string[] }) {
  const original = AbilityService.prototype.resourceActionsPermission;
  return jest.spyOn(AbilityService.prototype, 'resourceActionsPermission').mockImplementation(async function (
    this: AbilityService,
    ...args: Parameters<AbilityService['resourceActionsPermission']>
  ) {
    const permissions = await original.apply(this, args);
    const dataSourcePermissions = permissions[MODULES.GLOBAL_DATA_SOURCE];
    if (args[0].id !== user.id || !dataSourcePermissions) return permissions;
    return {
      ...permissions,
      [MODULES.GLOBAL_DATA_SOURCE]: {
        ...dataSourcePermissions,
        usableDataSourcesId: grant.use ?? [],
        configurableDataSourceId: grant.configure ?? [],
      },
    };
  });
}

/** @group platform */
describe('DataSourcesDashboardController', () => {
  let nestApp: INestApplication;

  const dataSourceFolder = (organizationId: string, name: string) =>
    createFolder(nestApp, { name, type: DATA_SOURCE_FOLDER_TYPE, organizationId });

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('GET /api/v2/data-sources | Root list', () => {
    it('should reject unauthenticated requests', async () => {
      await request(nestApp.getHttpServer()).get('/api/v2/data-sources').expect(401);
    });

    it('should reject page < 1 and page_size > 50 with 400', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-400@tooljet.io');
      for (const query of [{ page: 0 }, { page_size: 51 }]) {
        expect((await list(nestApp, admin.cookie, admin.workspace.id, query)).statusCode).toBe(400);
      }
    });

    it('should return folders first, then loose data sources, in the documented shape', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-shape@tooljet.io');
      const folder = await dataSourceFolder(admin.workspace.id, 'Core databases');
      const { dataSource: inFolder } = await seedDashboardDataSource(nestApp, {
        organizationId: admin.workspace.id,
        name: 'Orders DB',
        folder,
        createdBy: admin.user.id,
      });
      const { dataSource: loose } = await seedDashboardDataSource(nestApp, {
        organizationId: admin.workspace.id,
        name: 'Billing API',
        kind: 'restapi',
        createdBy: admin.user.id,
      });

      const res = await list(nestApp, admin.cookie, admin.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        page: 1,
        page_size: 50,
        total: 2,
        counts: { pinned: 0, folders: 1, data_sources: 1 },
        folder: null,
        items: [
          {
            kind: 'folder',
            id: folder.id,
            name: 'Core databases',
            data_source_count: 1,
            last_modified_at: expect.any(String),
            modified_by: null,
            last_viewed_at: null,
            owner: null, // createFolder leaves created_by unset
            pinned: false,
            actions: { rename: true, delete: true, pin: true },
          },
          {
            kind: 'data_source',
            id: loose.id,
            name: 'Billing API',
            data_source_kind: 'restapi',
            plugin_id: null,
            folder: null,
            last_modified_at: expect.any(String),
            modified_by: null,
            last_viewed_at: null,
            owner: { id: admin.user.id, name: 'test test' },
            pinned: false,
            actions: { edit: true, delete: true, pin: true },
          },
        ],
      });
      expect(ids(res.body)).not.toContain(inFolder.id);
      expect(res.body.items[0]).not.toHaveProperty('data_source_kind');
      expect(res.body.items[1]).not.toHaveProperty('data_source_count');
    });

    it('should put pins first by position, flat with folder refs, counted only in counts.pinned', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-pins@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const org = admin.workspace.id;
      const folder = await dataSourceFolder(org, 'Pinned folder');
      const { dataSource: nested } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Nested',
        folder,
      });
      const { dataSource: loosePinned } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Loose',
      });
      await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Unpinned' });
      await seedPin(admin.user, { dataSourceId: loosePinned.id, branchId: branch.id, position: 0 });
      await seedPin(admin.user, { folderId: folder.id, branchId: branch.id, position: 1 });
      await seedPin(admin.user, { dataSourceId: nested.id, branchId: branch.id, position: 2 });

      const res = await list(nestApp, admin.cookie, org);

      expect(res.body).toMatchObject({
        total: 4,
        counts: { pinned: 3, folders: 0, data_sources: 1 },
        items: [
          { kind: 'data_source', id: loosePinned.id, folder: null, pinned: true },
          { kind: 'folder', id: folder.id, pinned: true },
          { kind: 'data_source', id: nested.id, folder: { id: folder.id, name: 'Pinned folder' }, pinned: true },
          { kind: 'data_source', name: 'Unpinned', pinned: false },
        ],
      });
    });

    it('should page one ordered list, break name ties case-insensitively and return [] past the end', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-paging@tooljet.io');
      const org = admin.workspace.id;
      const { dataSource: b } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'b source' });
      const { dataSource: a } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'A source' });
      const { dataSource: c } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'C source' });

      const page1 = await list(nestApp, admin.cookie, org, { page_size: 2 });
      const page2 = await list(nestApp, admin.cookie, org, { page_size: 2, page: 2 });
      const page3 = await list(nestApp, admin.cookie, org, { page_size: 2, page: 3 });

      expect(page1.body).toMatchObject({ page: 1, page_size: 2, total: 3 });
      expect(ids(page1.body)).toEqual([a.id, b.id]);
      expect(page2.body).toMatchObject({ page: 2, page_size: 2, total: 3 });
      expect(ids(page2.body)).toEqual([c.id]);
      expect(page3.statusCode).toBe(200);
      expect(page3.body).toMatchObject({ items: [], total: 3 });
    });
  });

  describe('GET /api/v2/data-sources | Order', () => {
    it('should order an edit-capable user by their own last edit, untouched rows last', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-order-edit@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const { dataSource: untouched } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'A untouched',
      });
      const { dataSource: old } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'B old edit' });
      const { dataSource: recent } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'C new edit',
      });
      const { dataSource: viewed } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'D viewed' });
      const base = { userId: admin.user.id, branchId: branch.id };
      await seedDataSourceActivity(nestApp, { ...base, dataSourceId: old.id, lastEditedAt: new Date('2026-01-01') });
      await seedDataSourceActivity(nestApp, { ...base, dataSourceId: recent.id, lastEditedAt: new Date('2026-06-01') });
      await seedDataSourceActivity(nestApp, { ...base, dataSourceId: viewed.id, lastViewedAt: new Date('2026-09-01') });

      const res = await list(nestApp, admin.cookie, org);

      expect(ids(res.body)).toEqual([recent.id, old.id, untouched.id, viewed.id]);
      expect(res.body.items[0]).toMatchObject({
        modified_by: { id: admin.user.id, name: 'test test' },
        last_modified_at: new Date('2026-06-01').toISOString(),
      });
      expect(res.body.items[3]).toMatchObject({
        modified_by: null,
        last_viewed_at: new Date('2026-09-01').toISOString(),
      });
    });

    it('should order a use-only user by their own last view, untouched rows last', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-order-view-admin@tooljet.io');
      const viewer = await createEndUser(nestApp, 'data-source-dash-order-view@tooljet.io', {
        workspace: admin.workspace,
      });
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const { dataSource: untouched } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'A untouched',
      });
      const { dataSource: edited } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'B edited' });
      const { dataSource: viewed } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'C viewed' });
      const base = { userId: viewer.user.id, branchId: branch.id };
      await seedDataSourceActivity(nestApp, { ...base, dataSourceId: edited.id, lastEditedAt: new Date('2026-06-01') });
      await seedDataSourceActivity(nestApp, { ...base, dataSourceId: viewed.id, lastViewedAt: new Date('2026-01-01') });
      grantDataSources(viewer.user, { use: [untouched.id, edited.id, viewed.id] });

      const res = await list(nestApp, viewer.cookie, org);

      expect(ids(res.body)).toEqual([viewed.id, untouched.id, edited.id]);
    });
  });

  describe('GET /api/v2/data-sources?folder_id= | Folder contents', () => {
    it('should page a folder’s data sources with the folder header, pins first', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-folder@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const folder = await dataSourceFolder(org, 'Warehouse');
      const seeded = [];
      for (let i = 0; i < 22; i++) {
        const name = `Source ${String(i).padStart(2, '0')}`;
        seeded.push((await seedDashboardDataSource(nestApp, { organizationId: org, name, folder })).dataSource);
      }
      await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Outside' });
      await seedPin(admin.user, { dataSourceId: seeded[21].id, branchId: branch.id, position: 0 });

      const page1 = await list(nestApp, admin.cookie, org, { folder_id: folder.id, page_size: 20 });
      const page2 = await list(nestApp, admin.cookie, org, { folder_id: folder.id, page_size: 20, page: 2 });

      expect(page1.body).toMatchObject({
        page: 1,
        page_size: 20,
        total: 22,
        counts: { pinned: 1, folders: 0, data_sources: 21 },
        folder: { id: folder.id, name: 'Warehouse' },
      });
      expect(ids(page1.body)).toEqual([seeded[21].id, ...seeded.slice(0, 19).map((d) => d.id)]);
      expect(page1.body.items[1]).toMatchObject({ folder: { id: folder.id, name: 'Warehouse' }, pinned: false });
      expect(ids(page2.body)).toEqual([seeded[19].id, seeded[20].id]);
    });

    it('should 404 for a folder the user cannot see', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-folder-404-admin@tooljet.io');
      const endUser = await createEndUser(nestApp, 'data-source-dash-folder-404@tooljet.io', {
        workspace: admin.workspace,
      });
      const folder = await dataSourceFolder(admin.workspace.id, 'Hidden');
      await seedDashboardDataSource(nestApp, { organizationId: admin.workspace.id, name: 'Secret', folder });

      const res = await list(nestApp, endUser.cookie, admin.workspace.id, { folder_id: folder.id });

      expect(res.statusCode).toBe(404);
    });

    it('should 404 for another workspace’s folder and for an app folder', async () => {
      const owner = await createAdmin(nestApp, 'data-source-dash-folder-xws-owner@tooljet.io');
      const other = await createAdmin(nestApp, 'data-source-dash-folder-xws@tooljet.io');
      const foreign = await dataSourceFolder(owner.workspace.id, 'Foreign');
      const appFolder = await createFolder(nestApp, { name: 'Apps', organizationId: other.workspace.id });

      for (const folderId of [foreign.id, appFolder.id]) {
        const res = await list(nestApp, other.cookie, other.workspace.id, { folder_id: folderId });
        expect(res.statusCode).toBe(404);
      }
    });
  });

  describe('GET /api/v2/data-sources?search= | Search', () => {
    it('should return matched folders, then matched data sources grouped by folder, loose ones last', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-search@tooljet.io');
      const org = admin.workspace.id;
      const salesFolder = await dataSourceFolder(org, 'Sales stuff');
      const otherFolder = await dataSourceFolder(org, 'Other');
      const { dataSource: inSales } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Sales DB',
        folder: salesFolder,
      });
      const { dataSource: inOther } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Sales API',
        folder: otherFolder,
      });
      const { dataSource: loose } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'sales loose',
      });
      await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Unrelated', folder: salesFolder });

      const res = await list(nestApp, admin.cookie, org, { search: '  SALES ', folder_id: otherFolder.id });

      expect(res.body).toMatchObject({
        total: 4,
        counts: { pinned: 0, folders: 1, data_sources: 3 },
        folder: null,
        items: [
          { kind: 'folder', id: salesFolder.id, name: 'Sales stuff' },
          { kind: 'data_source', id: inOther.id, folder: { id: otherFolder.id, name: 'Other' } },
          { kind: 'data_source', id: inSales.id, folder: { id: salesFolder.id, name: 'Sales stuff' } },
          { kind: 'data_source', id: loose.id, folder: null },
        ],
      });
    });

    it('should treat % and _ as literal characters', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-search-escape@tooljet.io');
      const org = admin.workspace.id;
      const { dataSource: literal } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: '100% uptime',
      });
      await seedDashboardDataSource(nestApp, { organizationId: org, name: '100 uptime' });
      await seedDashboardDataSource(nestApp, { organizationId: org, name: 'a_b' });

      const percent = await list(nestApp, admin.cookie, org, { search: '0%' });
      const underscore = await list(nestApp, admin.cookie, org, { search: '0_' });

      expect(ids(percent.body)).toEqual([literal.id]);
      expect(underscore.body).toMatchObject({ items: [], total: 0 });
    });
  });

  describe('GET /api/v2/data-sources | Visibility', () => {
    it('should show a user with one use grant only that data source and the folder holding it', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-vis-admin@tooljet.io');
      const user = await createEndUser(nestApp, 'data-source-dash-vis@tooljet.io', { workspace: admin.workspace });
      const org = admin.workspace.id;
      const holding = await dataSourceFolder(org, 'Holding');
      await dataSourceFolder(org, 'Empty');
      const { dataSource: granted } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Granted',
        folder: holding,
      });
      await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Sibling', folder: holding });
      await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Loose hidden' });
      grantDataSources(user.user, { use: [granted.id] });

      const root = await list(nestApp, user.cookie, org);
      const inFolder = await list(nestApp, user.cookie, org, { folder_id: holding.id });

      expect(root.body).toMatchObject({
        total: 1,
        counts: { pinned: 0, folders: 1, data_sources: 0 },
        items: [{ kind: 'folder', id: holding.id, data_source_count: 1 }],
      });
      expect(inFolder.body).toMatchObject({ total: 1, items: [{ id: granted.id }] });
    });

    it('should give an end user with no grants an empty list', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-vis-none-admin@tooljet.io');
      const endUser = await createEndUser(nestApp, 'data-source-dash-vis-none@tooljet.io', {
        workspace: admin.workspace,
      });
      const folder = await dataSourceFolder(admin.workspace.id, 'Folder');
      await seedDashboardDataSource(nestApp, { organizationId: admin.workspace.id, name: 'In folder', folder });
      await seedDashboardDataSource(nestApp, { organizationId: admin.workspace.id, name: 'Loose' });

      const res = await list(nestApp, endUser.cookie, admin.workspace.id);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ items: [], total: 0, counts: { pinned: 0, folders: 0, data_sources: 0 } });
    });

    it('should never list another workspace’s data sources or folders, nor sample and local ones', async () => {
      const mine = await createAdmin(nestApp, 'data-source-dash-vis-xws-a@tooljet.io');
      const theirs = await createAdmin(nestApp, 'data-source-dash-vis-xws-b@tooljet.io');
      const { dataSource: own } = await seedDashboardDataSource(nestApp, {
        organizationId: mine.workspace.id,
        name: 'Own',
      });
      const { dataSource: sample } = await seedDashboardDataSource(nestApp, {
        organizationId: mine.workspace.id,
        name: 'Sample',
      });
      await updateEntity(DataSource, sample.id, { type: 'sample' });
      const { dataSource: local } = await seedDashboardDataSource(nestApp, {
        organizationId: mine.workspace.id,
        name: 'Local',
      });
      await updateEntity(DataSource, local.id, { scope: 'local' });
      await seedDashboardDataSource(nestApp, { organizationId: theirs.workspace.id, name: 'Theirs' });
      await dataSourceFolder(theirs.workspace.id, 'Their folder');

      const res = await list(nestApp, mine.cookie, mine.workspace.id);

      expect(res.body).toMatchObject({ total: 1, items: [{ id: own.id }] });
    });

    it('should hide a data source deleted on a feature branch there but keep it on the default branch', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-vis-branch@tooljet.io');
      const org = admin.workspace.id;
      const feature = await saveEntity(WorkspaceBranch, { organizationId: org, name: 'feature-x' } as WorkspaceBranch);
      const { dataSource: deleted } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Deleted there',
      });
      await saveEntity(DataSourceVersion, {
        dataSourceId: deleted.id,
        name: 'Deleted there',
        isActive: false,
        branchId: feature.id,
      } as DataSourceVersion);
      const { dataSource: renamed } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Old name' });
      await saveEntity(DataSourceVersion, {
        dataSourceId: renamed.id,
        name: 'New name',
        isActive: true,
        branchId: feature.id,
      } as DataSourceVersion);
      const { dataSource: inherited } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Inherited',
      });

      const onDefault = await list(nestApp, admin.cookie, org);
      const onFeature = await list(nestApp, admin.cookie, org, { branch_id: feature.id });

      expect(onDefault.body.items.map((i: { name: string }) => i.name)).toEqual([
        'Deleted there',
        'Inherited',
        'Old name',
      ]);
      expect(onFeature.body).toMatchObject({
        total: 2,
        items: [
          { id: inherited.id, name: 'Inherited' },
          { id: renamed.id, name: 'New name' },
        ],
      });
      expect(ids(onFeature.body)).not.toContain(deleted.id);
    });

    it("should take the folder, last editor and caller's activity from the listed branch and the caller's own row", async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-vis-branch-activity@tooljet.io');
      const other = await createAdmin(nestApp, 'data-source-dash-vis-branch-activity-other@tooljet.io', {
        workspace: admin.workspace,
      });
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const feature = await saveEntity(WorkspaceBranch, { organizationId: org, name: 'feature-y' } as WorkspaceBranch);
      const folder = await dataSourceFolder(org, 'Default only');
      const { dataSource: defaultOnly } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'A default only',
        folder,
      });
      const { dataSource: othersActivity } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'B others activity',
      });
      const { dataSource: ownEdit } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'C own edit',
      });
      await seedDataSourceActivity(nestApp, {
        userId: other.user.id,
        dataSourceId: defaultOnly.id,
        branchId: branch.id,
        lastEditedAt: new Date('2026-05-01'),
      });
      await seedDataSourceActivity(nestApp, {
        userId: other.user.id,
        dataSourceId: othersActivity.id,
        branchId: feature.id,
        lastEditedAt: new Date('2026-06-01'),
        lastViewedAt: new Date('2026-06-01'),
      });
      await seedDataSourceActivity(nestApp, {
        userId: admin.user.id,
        dataSourceId: ownEdit.id,
        branchId: feature.id,
        lastEditedAt: new Date('2026-01-01'),
      });

      const onDefault = await list(nestApp, admin.cookie, org, { folder_id: folder.id });
      const onFeature = await list(nestApp, admin.cookie, org, { branch_id: feature.id });

      expect(onDefault.body.items).toMatchObject([
        { id: defaultOnly.id, modified_by: { id: other.user.id }, folder: { id: folder.id } },
      ]);
      expect(onFeature.body.items).toMatchObject([
        { id: folder.id, kind: 'folder', data_source_count: 0 },
        { id: ownEdit.id, last_modified_at: new Date('2026-01-01').toISOString() },
        { id: defaultOnly.id, folder: null, modified_by: null },
        { id: othersActivity.id, modified_by: { id: other.user.id }, last_viewed_at: null },
      ]);
    });
  });

  describe('GET /api/v2/data-sources | Owner, modified by and actions', () => {
    it('should report owner, last editor and per-role actions for admin, configure-one and use-only users', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-actions-admin@tooljet.io');
      const configurer = await createEndUser(nestApp, 'data-source-dash-actions-configure@tooljet.io', {
        workspace: admin.workspace,
      });
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const folder = await dataSourceFolder(org, 'Configurer folder');
      await updateEntity(Folder, folder.id, { createdBy: configurer.user.id });
      const { dataSource: configurable } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Configurable',
        createdBy: admin.user.id,
      });
      const { dataSource: usable } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Usable' });
      await seedDataSourceActivity(nestApp, {
        userId: configurer.user.id,
        dataSourceId: configurable.id,
        branchId: branch.id,
        lastEditedAt: new Date('2026-03-01'),
      });

      const asAdmin = await list(nestApp, admin.cookie, org);
      expect(asAdmin.body.items).toMatchObject([
        {
          id: folder.id,
          owner: { id: configurer.user.id, name: 'test test' },
          actions: { rename: true, delete: true, pin: true },
        },
        {
          id: configurable.id,
          owner: { id: admin.user.id, name: 'test test' },
          modified_by: { id: configurer.user.id, name: 'test test' },
          last_modified_at: new Date('2026-03-01').toISOString(),
          actions: { edit: true, delete: true, pin: true },
        },
        { id: usable.id, owner: null, modified_by: null, actions: { edit: true, delete: true, pin: true } },
      ]);

      grantDataSources(configurer.user, { configure: [configurable.id], use: [usable.id] });
      const asConfigurer = await list(nestApp, configurer.cookie, org);
      expect(asConfigurer.body.items).toMatchObject([
        { id: folder.id, actions: { rename: true, delete: true, pin: true } },
        { id: configurable.id, actions: { edit: true, delete: false, pin: true } },
        { id: usable.id, actions: { edit: false, delete: false, pin: true } },
      ]);
    });

    it('should block folder delete in multi-branch mode while the folder holds data sources on any branch', async () => {
      const admin = await createAdmin(nestApp, 'data-source-dash-actions-multibranch@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const feature = await saveEntity(WorkspaceBranch, { organizationId: org, name: 'feature-y' } as WorkspaceBranch);
      const holding = await dataSourceFolder(org, 'A holds on feature');
      const empty = await dataSourceFolder(org, 'B empty');
      await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Feature only',
        folder: holding,
        branchId: feature.id,
      });
      jest.spyOn(GitSyncConfigsUtilService.prototype, 'getDetails').mockResolvedValue({
        isEnabled: true,
        isMultiBranchingEnabled: true,
        options: { type: null, defaultBranch: { id: branch.id, name: branch.name }, isBranchingEnabled: true },
        orgGit: null,
      } as any);

      const res = await list(nestApp, admin.cookie, org);

      expect(res.body).toMatchObject({ total: 2 });
      const byId = new Map(res.body.items.map((i: { id: string }) => [i.id, i]));
      expect(byId.get(holding.id)).toMatchObject({
        kind: 'folder',
        data_source_count: 0,
        actions: { rename: false, delete: false, pin: true },
      });
      expect(byId.get(empty.id)).toMatchObject({
        kind: 'folder',
        data_source_count: 0,
        actions: { rename: false, delete: true, pin: true },
      });
    });
  });

  describe('GET /api/v2/data-sources | Workspace scope', () => {
    it("should 404 for another workspace's branch id", async () => {
      const admin = await createAdmin(nestApp, 'ds-list-foreign-branch@tooljet.io');
      const other = await createAdmin(nestApp, 'ds-list-foreign-branch-other@tooljet.io');
      const foreignBranch = await resolveOrSeedDefaultBranch(other.workspace.id);
      await seedDashboardDataSource(nestApp, { organizationId: other.workspace.id, name: 'Foreign' });

      await list(nestApp, admin.cookie, admin.workspace.id, { branch_id: foreignBranch.id }).expect(404);
    });
  });
});
