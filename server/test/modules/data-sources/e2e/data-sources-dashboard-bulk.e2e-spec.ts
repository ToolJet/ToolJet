import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { DataSource } from '@entities/data_source.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { Folder } from '@entities/folder.entity';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { User } from '@entities/user.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AbilityService } from '@modules/ability/service';
import { MODULES } from '@modules/app/constants/modules';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import {
  closeTestApp,
  createAdmin,
  createBuilder,
  createDataQuery,
  createEndUser,
  findEntity,
  getEntityRepository,
  initTestApp,
  resolveOrSeedDefaultBranch,
  saveEntity,
  seedDashboardApp,
  seedDashboardDataSource,
  updateEntity,
} from 'test-helper';

// CE resolves no granular data-source grants, so a per-data-source use grant is layered onto the
// real permission resolve for one user (mirrors data-sources-dashboard-pins.e2e-spec.ts).
function grantDataSources(user: User, grant: { use?: string[] }) {
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
      [MODULES.GLOBAL_DATA_SOURCE]: { ...dataSourcePermissions, usableDataSourcesId: grant.use ?? [] },
    };
  });
}

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
  } as never);

const singleBranchGit = (defaultBranch: WorkspaceBranch) =>
  jest.spyOn(GitSyncConfigsUtilService.prototype, 'getDetails').mockResolvedValue({
    isEnabled: true,
    isMultiBranchingEnabled: false,
    options: {
      type: null,
      defaultBranch: { id: defaultBranch.id, name: defaultBranch.name },
      isBranchingEnabled: false,
    },
    orgGit: null,
  } as never);

/** @group platform */
describe('DataSourcesDashboardController bulk routes', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const post = (path: string, cookie: string[], workspaceId: string, body: Record<string, unknown>) =>
    request(nestApp.getHttpServer())
      .post(`/api/v2/data-sources/${path}`)
      .set('Cookie', cookie)
      .set('tj-workspace-id', workspaceId)
      .send(body);
  const dataSourceFolder = (organizationId: string, name: string, createdBy?: string) =>
    saveEntity(Folder, { name, organizationId, type: DATA_SOURCE_FOLDER_TYPE, createdBy } as Folder);
  const seed = (organizationId: string, name: string, folder?: Folder) =>
    seedDashboardDataSource(nestApp, { organizationId, name, folder }).then((seeded) => seeded.dataSource);
  const exists = async (id: string) => !!(await findEntity(DataSource, { id }));
  const folderExists = async (id: string) => !!(await findEntity(Folder, { id }));
  const folderOf = async (dataSourceId: string, branchId?: string) =>
    (await getEntityRepository(FolderDataSource).findOne({ where: { dataSourceId, ...(branchId && { branchId }) } }))
      ?.folderId ?? null;
  const addDependentQuery = async (admin: { user: User }, dataSource: DataSource) => {
    const { version } = await seedDashboardApp(nestApp, { user: admin.user, name: `Uses ${dataSource.name}` });
    await createDataQuery(nestApp, { dataSource, appVersion: version });
  };

  describe('POST /api/v2/data-sources/bulk-delete | Bulk delete', () => {
    it('should delete every allowed data source and emit one audit entry each', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-del@tooljet.io');
      const org = admin.workspace.id;
      const a = await seed(org, 'A');
      const b = await seed(org, 'B');
      const spy = jest.spyOn(nestApp.get(EventEmitter2), 'emit');

      const res = await post('bulk-delete', admin.cookie, org, { data_source_ids: [a.id, b.id] }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await exists(a.id)).toBe(false);
      expect(await exists(b.id)).toBe(false);
      const audits = spy.mock.calls.filter(([event]) => event === 'auditLogEntry').map(([, payload]) => payload);
      expect(audits).toHaveLength(2);
      expect(audits).toEqual(
        expect.arrayContaining(
          [a, b].map((dataSource) =>
            expect.objectContaining({
              actionType: 'DATA_SOURCE_DELETE',
              resourceType: MODULES.GLOBAL_DATA_SOURCE,
              resourceId: dataSource.id,
              userId: admin.user.id,
            })
          )
        )
      );
    });

    it('should write nothing when any data source is blocked, and delete the rest when resent without them', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-del-blocked@tooljet.io');
      const other = await createAdmin(nestApp, 'ds-bulk-del-other@tooljet.io');
      const org = admin.workspace.id;
      const free = await seed(org, 'Free');
      const used = await seed(org, 'Used');
      await addDependentQuery(admin, used);
      const sample = await seed(org, 'Sample');
      await updateEntity(DataSource, sample.id, { type: 'sample' } as never);
      const foreign = await seed(other.workspace.id, 'Foreign');
      const missing = randomUUID();

      const res = await post('bulk-delete', admin.cookie, org, {
        data_source_ids: [free.id, used.id, sample.id, foreign.id, missing],
      }).expect(200);
      expect(res.body).toEqual({ blocked_ids: [used.id, sample.id, foreign.id, missing] });
      expect(await exists(free.id)).toBe(true);

      const resent = await post('bulk-delete', admin.cookie, org, { data_source_ids: [free.id] }).expect(200);
      expect(resent.body).toEqual({ blocked_ids: [] });
      expect(await exists(free.id)).toBe(false);
      expect(await exists(used.id)).toBe(true);
      expect(await exists(foreign.id)).toBe(true);
    });

    it('should block a use-only user and let a default builder delete', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-del-roles@tooljet.io');
      const org = admin.workspace.id;
      const endUser = await createEndUser(nestApp, 'ds-bulk-del-use@tooljet.io', { workspace: admin.workspace });
      const builder = await createBuilder(nestApp, 'ds-bulk-del-builder@tooljet.io', { workspace: admin.workspace });
      const dataSource = await seed(org, 'Shared');
      grantDataSources(endUser.user, { use: [dataSource.id] });

      const blocked = await post('bulk-delete', endUser.cookie, org, { data_source_ids: [dataSource.id] }).expect(200);
      expect(blocked.body).toEqual({ blocked_ids: [dataSource.id] });
      expect(await exists(dataSource.id)).toBe(true);

      const deleted = await post('bulk-delete', builder.cookie, org, { data_source_ids: [dataSource.id] }).expect(200);
      expect(deleted.body).toEqual({ blocked_ids: [] });
      expect(await exists(dataSource.id)).toBe(false);
    });

    it('should block a git-synced data source on the default branch of a multi-branch workspace', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-del-git@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const { dataSource, version } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Synced' });
      await updateEntity(DataSourceVersion, version.id, { isSynced: true } as never);
      multiBranchGit(branch);

      const res = await post('bulk-delete', admin.cookie, org, {
        data_source_ids: [dataSource.id],
        branch_id: branch.id,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [dataSource.id] });
      expect(await findEntity(DataSourceVersion, { id: version.id })).not.toBeNull();
    });

    it('should only remove the version row when the default branch is passed', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-del-branch@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const { dataSource, version } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Branch' });

      const res = await post('bulk-delete', admin.cookie, org, {
        data_source_ids: [dataSource.id],
        branch_id: branch.id,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await exists(dataSource.id)).toBe(true);
      expect(await findEntity(DataSourceVersion, { id: version.id })).toBeNull();
    });

    it('should 400 on a bad body', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-del-400@tooljet.io');
      await post('bulk-delete', admin.cookie, admin.workspace.id, { data_source_ids: [] }).expect(400);
      await post('bulk-delete', admin.cookie, admin.workspace.id, { data_source_ids: ['nope'] }).expect(400);
    });
  });

  describe('POST /api/v2/data-sources/bulk-move | Bulk move', () => {
    it('should move data sources from root and from another folder into the target', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-move@tooljet.io');
      const org = admin.workspace.id;
      const source = await dataSourceFolder(org, 'Source');
      const target = await dataSourceFolder(org, 'Target');
      const loose = await seed(org, 'Loose');
      const foldered = await seed(org, 'Foldered', source);

      const res = await post('bulk-move', admin.cookie, org, {
        data_source_ids: [loose.id, foldered.id],
        folder_id: target.id,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderOf(loose.id)).toBe(target.id);
      expect(await folderOf(foldered.id)).toBe(target.id);
      expect(await getEntityRepository(FolderDataSource).count({ where: { dataSourceId: foldered.id } })).toBe(1);
    });

    it("should let a folder owner without folder-create move into their own folder, but not into another's", async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-move-owner-admin@tooljet.io');
      const org = admin.workspace.id;
      const endUser = await createEndUser(nestApp, 'ds-bulk-move-owner@tooljet.io', { workspace: admin.workspace });
      const mine = await dataSourceFolder(org, 'Mine', endUser.user.id);
      const theirs = await dataSourceFolder(org, 'Theirs', admin.user.id);
      const dataSource = await seed(org, 'Movable');
      const inTheirs = await seed(org, 'In theirs', theirs);
      grantDataSources(endUser.user, { use: [dataSource.id, inTheirs.id] });

      const blocked = await post('bulk-move', endUser.cookie, org, {
        data_source_ids: [dataSource.id],
        folder_id: theirs.id,
      }).expect(200);
      expect(blocked.body).toEqual({ blocked_ids: [dataSource.id] });
      expect(await folderOf(dataSource.id)).toBeNull();

      const moved = await post('bulk-move', endUser.cookie, org, {
        data_source_ids: [dataSource.id],
        folder_id: mine.id,
      }).expect(200);
      expect(moved.body).toEqual({ blocked_ids: [] });
      expect(await folderOf(dataSource.id)).toBe(mine.id);
    });

    it('should block data source ids from another workspace and write nothing', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-move-foreign@tooljet.io');
      const other = await createAdmin(nestApp, 'ds-bulk-move-foreign-other@tooljet.io');
      const org = admin.workspace.id;
      const target = await dataSourceFolder(org, 'Target');
      const mine = await seed(org, 'Mine');
      const foreign = await seed(other.workspace.id, 'Foreign');

      const res = await post('bulk-move', admin.cookie, org, {
        data_source_ids: [mine.id, foreign.id],
        folder_id: target.id,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [foreign.id] });
      expect(await folderOf(mine.id)).toBeNull();
      expect(await folderOf(foreign.id)).toBeNull();
    });

    it('should 404 for a target folder in another workspace or of another type', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-move-404@tooljet.io');
      const other = await createAdmin(nestApp, 'ds-bulk-move-404-other@tooljet.io');
      const org = admin.workspace.id;
      const foreignFolder = await dataSourceFolder(other.workspace.id, 'Foreign');
      const appFolder = await saveEntity(Folder, { name: 'Apps', organizationId: org, type: 'front-end' } as Folder);
      const dataSource = await seed(org, 'A');

      for (const folder of [foreignFolder, appFolder]) {
        await post('bulk-move', admin.cookie, org, { data_source_ids: [dataSource.id], folder_id: folder.id }).expect(
          404
        );
      }
      expect(await folderOf(dataSource.id)).toBeNull();
    });

    it('should accept more than 50 data source ids', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-move-many@tooljet.io');
      const org = admin.workspace.id;
      const target = await dataSourceFolder(org, 'Many');
      const ids: string[] = [];
      for (let i = 0; i < 51; i++) ids.push((await seed(org, `Many ${i}`)).id);

      const res = await post('bulk-move', admin.cookie, org, { data_source_ids: ids, folder_id: target.id }).expect(
        200
      );

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await getEntityRepository(FolderDataSource).count({ where: { folderId: target.id } })).toBe(51);
    });

    it('should 400 without a folder id', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-move-400@tooljet.io');
      const dataSource = await seed(admin.workspace.id, 'A');
      await post('bulk-move', admin.cookie, admin.workspace.id, { data_source_ids: [dataSource.id] }).expect(400);
    });
  });

  describe('POST /api/v2/data-sources/bulk-remove | Bulk remove', () => {
    it('should remove data sources from different folders, and treat a loose one as a no-op', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-remove@tooljet.io');
      const org = admin.workspace.id;
      const first = await dataSourceFolder(org, 'First');
      const second = await dataSourceFolder(org, 'Second');
      const a = await seed(org, 'A', first);
      const b = await seed(org, 'B', second);
      const loose = await seed(org, 'Loose');

      const res = await post('bulk-remove', admin.cookie, org, { data_source_ids: [a.id, b.id, loose.id] }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderOf(a.id)).toBeNull();
      expect(await folderOf(b.id)).toBeNull();
      expect(await folderExists(first.id)).toBe(true);
    });

    it("should block a data source in a folder the user can't manage and write nothing", async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-remove-blocked-admin@tooljet.io');
      const org = admin.workspace.id;
      const endUser = await createEndUser(nestApp, 'ds-bulk-remove-blocked@tooljet.io', {
        workspace: admin.workspace,
      });
      const mine = await dataSourceFolder(org, 'Mine', endUser.user.id);
      const theirs = await dataSourceFolder(org, 'Theirs', admin.user.id);
      const inMine = await seed(org, 'In mine', mine);
      const inTheirs = await seed(org, 'In theirs', theirs);
      const other = await createAdmin(nestApp, 'ds-bulk-remove-blocked-other@tooljet.io');
      const foreign = await seed(other.workspace.id, 'Foreign');

      const res = await post('bulk-remove', endUser.cookie, org, {
        data_source_ids: [inMine.id, inTheirs.id, foreign.id],
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [inTheirs.id, foreign.id] });
      expect(await folderOf(inMine.id)).toBe(mine.id);
      expect(await folderOf(inTheirs.id)).toBe(theirs.id);
    });

    it('should refuse bulk move and bulk remove on a git-locked default branch', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-remove-git@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const folder = await dataSourceFolder(org, 'Locked');
      const target = await dataSourceFolder(org, 'Locked target');
      const dataSource = await seed(org, 'A', folder);
      multiBranchGit(branch);

      for (const branchField of [{ branch_id: branch.id }, {}]) {
        await post('bulk-remove', admin.cookie, org, { data_source_ids: [dataSource.id], ...branchField }).expect(403);
        await post('bulk-move', admin.cookie, org, {
          data_source_ids: [dataSource.id],
          folder_id: target.id,
          ...branchField,
        }).expect(403);
      }
      expect(await folderOf(dataSource.id)).toBe(folder.id);
    });
  });

  describe('POST /api/v2/data-sources/folders/bulk-delete | Bulk folder delete', () => {
    it('should delete folders and move their data sources to root in folder_only mode', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-fdel-only@tooljet.io');
      const org = admin.workspace.id;
      const f1 = await dataSourceFolder(org, 'F1');
      const f2 = await dataSourceFolder(org, 'F2');
      const a = await seed(org, 'A', f1);
      const b = await seed(org, 'B', f2);

      const res = await post('folders/bulk-delete', admin.cookie, org, {
        folder_ids: [f1.id, f2.id],
        mode: 'folder_only',
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderExists(f1.id)).toBe(false);
      expect(await folderExists(f2.id)).toBe(false);
      expect(await exists(a.id)).toBe(true);
      expect(await exists(b.id)).toBe(true);
      expect(await folderOf(a.id)).toBeNull();
    });

    it('should delete deletable data sources and move the rest to root in folder_and_data_sources mode', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-fdel-with@tooljet.io');
      const org = admin.workspace.id;
      const folder = await dataSourceFolder(org, 'With data sources');
      const free = await seed(org, 'Free', folder);
      const used = await seed(org, 'Used', folder);
      await addDependentQuery(admin, used);

      const res = await post('folders/bulk-delete', admin.cookie, org, {
        folder_ids: [folder.id],
        mode: 'folder_and_data_sources',
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [] });
      expect(await folderExists(folder.id)).toBe(false);
      expect(await exists(free.id)).toBe(false);
      expect(await exists(used.id)).toBe(true);
      expect(await folderOf(used.id)).toBeNull();
    });

    it("should block a folder the user can't delete, a non-data-source folder, and write nothing", async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-fdel-blocked-admin@tooljet.io');
      const org = admin.workspace.id;
      const endUser = await createEndUser(nestApp, 'ds-bulk-fdel-blocked@tooljet.io', { workspace: admin.workspace });
      const mine = await dataSourceFolder(org, 'Mine', endUser.user.id);
      const theirs = await dataSourceFolder(org, 'Theirs', admin.user.id);
      const appFolder = await saveEntity(Folder, {
        name: 'Apps',
        organizationId: org,
        type: 'front-end',
        createdBy: endUser.user.id,
      } as Folder);

      const res = await post('folders/bulk-delete', endUser.cookie, org, {
        folder_ids: [mine.id, theirs.id, appFolder.id],
        mode: 'folder_only',
      }).expect(200);
      expect(res.body).toEqual({ blocked_ids: [theirs.id, appFolder.id] });
      expect(await folderExists(mine.id)).toBe(true);

      const resent = await post('folders/bulk-delete', endUser.cookie, org, {
        folder_ids: [mine.id],
        mode: 'folder_only',
      }).expect(200);
      expect(resent.body).toEqual({ blocked_ids: [] });
      expect(await folderExists(mine.id)).toBe(false);
      expect(await folderExists(theirs.id)).toBe(true);
    });

    it('should block a folder holding data sources on another branch in multi-branch mode', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-fdel-git@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const feature = await saveEntity(WorkspaceBranch, {
        organizationId: org,
        name: 'feature',
        isDefault: false,
      } as WorkspaceBranch);
      const folder = await dataSourceFolder(org, 'Busy elsewhere');
      await seedDashboardDataSource(nestApp, { organizationId: org, name: 'On feature', folder, branchId: feature.id });
      multiBranchGit(branch);

      const res = await post('folders/bulk-delete', admin.cookie, org, {
        folder_ids: [folder.id],
        mode: 'folder_only',
        branch_id: branch.id,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [folder.id] });
      expect(await folderExists(folder.id)).toBe(true);
    });

    it('should 400 on a bad mode', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-fdel-400@tooljet.io');
      const folder = await dataSourceFolder(admin.workspace.id, 'F');
      await post('folders/bulk-delete', admin.cookie, admin.workspace.id, {
        folder_ids: [folder.id],
        mode: 'folder_and_apps',
      }).expect(400);
    });
  });

  describe('Bulk routes | Workspace scope and listed data sources', () => {
    it("should 404 for another workspace's branch id on every bulk route and write nothing", async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-foreign-branch@tooljet.io');
      const other = await createAdmin(nestApp, 'ds-bulk-foreign-branch-other@tooljet.io');
      const org = admin.workspace.id;
      const foreignBranch = await resolveOrSeedDefaultBranch(other.workspace.id);
      const folder = await dataSourceFolder(org, 'Folder');
      const target = await dataSourceFolder(org, 'Target');
      const inFolder = await seed(org, 'In folder', folder);
      const branch_id = foreignBranch.id;

      await post('bulk-delete', admin.cookie, org, { data_source_ids: [inFolder.id], branch_id }).expect(404);
      await post('bulk-move', admin.cookie, org, {
        data_source_ids: [inFolder.id],
        folder_id: target.id,
        branch_id,
      }).expect(404);
      await post('bulk-remove', admin.cookie, org, { data_source_ids: [inFolder.id], branch_id }).expect(404);
      await post('folders/bulk-delete', admin.cookie, org, {
        folder_ids: [folder.id],
        mode: 'folder_and_data_sources',
        branch_id,
      }).expect(404);

      expect(await exists(inFolder.id)).toBe(true);
      expect(await folderExists(folder.id)).toBe(true);
      expect(await folderOf(inFolder.id)).toBe(folder.id);
      expect(await getEntityRepository(FolderDataSource).count({ where: { branchId: foreignBranch.id } })).toBe(0);
    });

    it("should block another workspace's folder in a folder bulk delete", async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-fdel-foreign@tooljet.io');
      const other = await createAdmin(nestApp, 'ds-bulk-fdel-foreign-other@tooljet.io');
      const foreignFolder = await dataSourceFolder(other.workspace.id, 'Foreign');
      const foreignDataSource = await seed(other.workspace.id, 'Foreign', foreignFolder);

      const res = await post('folders/bulk-delete', admin.cookie, admin.workspace.id, {
        folder_ids: [foreignFolder.id],
        mode: 'folder_and_data_sources',
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [foreignFolder.id] });
      expect(await folderExists(foreignFolder.id)).toBe(true);
      expect(await exists(foreignDataSource.id)).toBe(true);
    });

    it('should block a static data source in bulk delete and bulk move', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-static@tooljet.io');
      const org = admin.workspace.id;
      const target = await dataSourceFolder(org, 'Target');
      const staticDataSource = await seed(org, 'Static');
      await updateEntity(DataSource, staticDataSource.id, { type: 'static' } as never);

      const deleted = await post('bulk-delete', admin.cookie, org, { data_source_ids: [staticDataSource.id] }).expect(
        200
      );
      expect(deleted.body).toEqual({ blocked_ids: [staticDataSource.id] });
      const moved = await post('bulk-move', admin.cookie, org, {
        data_source_ids: [staticDataSource.id],
        folder_id: target.id,
      }).expect(200);
      expect(moved.body).toEqual({ blocked_ids: [staticDataSource.id] });

      expect(await exists(staticDataSource.id)).toBe(true);
      expect(await folderOf(staticDataSource.id)).toBeNull();
    });

    it('should block deleting a synced data source on a feature branch under single-branch git sync', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-del-single-branch@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const feature = await saveEntity(WorkspaceBranch, {
        organizationId: org,
        name: 'feature',
        isDefault: false,
      } as WorkspaceBranch);
      const { dataSource, version } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Synced' });
      await updateEntity(DataSourceVersion, version.id, { isSynced: true } as never);
      singleBranchGit(branch);

      const res = await post('bulk-delete', admin.cookie, org, {
        data_source_ids: [dataSource.id],
        branch_id: feature.id,
      }).expect(200);

      expect(res.body).toEqual({ blocked_ids: [dataSource.id] });
      expect(await findEntity(DataSourceVersion, { id: version.id })).toMatchObject({ isActive: true });
    });

    it('should 400 for more than 500 ids', async () => {
      const admin = await createAdmin(nestApp, 'ds-bulk-too-many@tooljet.io');
      const org = admin.workspace.id;
      const folder = await dataSourceFolder(org, 'Target');
      const ids = Array.from({ length: 501 }, () => randomUUID());

      await post('bulk-delete', admin.cookie, org, { data_source_ids: ids }).expect(400);
      await post('bulk-move', admin.cookie, org, { data_source_ids: ids, folder_id: folder.id }).expect(400);
      await post('bulk-remove', admin.cookie, org, { data_source_ids: ids }).expect(400);
      await post('folders/bulk-delete', admin.cookie, org, { folder_ids: ids, mode: 'folder_only' }).expect(400);
    });
  });
});
