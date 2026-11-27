import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { PinnedItem } from '@entities/pinned_item.entity';
import { User } from '@entities/user.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AbilityService } from '@modules/ability/service';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import {
  closeTestApp,
  createAdmin,
  createEndUser,
  createFolder,
  findEntity,
  getEntityRepository,
  initTestApp,
  resolveOrSeedDefaultBranch,
  saveEntity,
  seedDashboardApp,
  seedDashboardDataSource,
  seedPin,
} from 'test-helper';

// CE resolves no granular data-source grants, so a per-data-source use grant is layered onto the
// real permission resolve for one user (mirrors data-sources-dashboard-list.e2e-spec.ts).
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
describe('DataSourcesPinsController', () => {
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

  const http = () => request(nestApp.getHttpServer());
  const list = (cookie: string[], workspaceId: string, query: Record<string, unknown> = {}) =>
    http().get('/api/v2/data-sources').query(query).set('Cookie', cookie).set('tj-workspace-id', workspaceId);

  describe('POST /api/v2/data-sources/pins | Pin', () => {
    it('should pin a data source and a folder, listed pinned first in request order', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-create@tooljet.io');
      const org = admin.workspace.id;
      const folder = await dataSourceFolder(org, 'Pinned folder');
      const { dataSource: pinned } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Pinned' });
      await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Unpinned' });

      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({ resource_type: 'folder', resource_ids: [folder.id] })
        .expect(204);
      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({ resource_type: 'data_source', resource_ids: [pinned.id] })
        .expect(204);

      const res = await list(admin.cookie, org);
      expect(res.body.items.slice(0, 2)).toMatchObject([
        { id: folder.id, kind: 'folder', pinned: true },
        { id: pinned.id, kind: 'data_source', pinned: true },
      ]);
      expect(res.body.counts.pinned).toBe(2);
    });

    it('should be idempotent: pinning twice leaves a single row', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-twice@tooljet.io');
      const org = admin.workspace.id;
      const { dataSource } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Twice' });

      for (let i = 0; i < 2; i++) {
        await http()
          .post('/api/v2/data-sources/pins')
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', org)
          .send({ resource_type: 'data_source', resource_ids: [dataSource.id] })
          .expect(204);
      }

      expect(await getEntityRepository(PinnedItem).count({ where: { dataSourceId: dataSource.id } })).toBe(1);
    });

    it('should silently ignore a data source the caller cannot see', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-invisible-owner@tooljet.io');
      const endUser = await createEndUser(nestApp, 'ds-pin-invisible@tooljet.io', { workspace: admin.workspace });
      const org = admin.workspace.id;
      const { dataSource } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Not granted' });

      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', endUser.cookie)
        .set('tj-workspace-id', org)
        .send({ resource_type: 'data_source', resource_ids: [dataSource.id] })
        .expect(204);

      expect(await findEntity(PinnedItem, { dataSourceId: dataSource.id })).toBeNull();
    });

    it('should silently ignore an app folder id (not a data-source folder)', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-app-folder@tooljet.io');
      const org = admin.workspace.id;
      const appFolder = await createFolder(nestApp, {
        name: 'App folder',
        type: APP_TYPES.FRONT_END,
        organizationId: org,
      });

      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({ resource_type: 'folder', resource_ids: [appFolder.id] })
        .expect(204);

      expect(await findEntity(PinnedItem, { folderId: appFolder.id })).toBeNull();
    });

    it('should hide a pin after the caller loses access, without deleting it or blocking reorder', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-revoke-owner@tooljet.io');
      const endUser = await createEndUser(nestApp, 'ds-pin-revoke@tooljet.io', { workspace: admin.workspace });
      const org = admin.workspace.id;
      const { dataSource } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Revoked' });

      grantDataSources(endUser.user, { use: [dataSource.id] });
      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', endUser.cookie)
        .set('tj-workspace-id', org)
        .send({ resource_type: 'data_source', resource_ids: [dataSource.id] })
        .expect(204);

      jest.restoreAllMocks();
      grantDataSources(endUser.user, { use: [] });

      const res = await list(endUser.cookie, org);
      expect(res.body.items.find((i: { id: string }) => i.id === dataSource.id)).toBeUndefined();
      expect(await findEntity(PinnedItem, { dataSourceId: dataSource.id })).not.toBeNull();

      await http()
        .put('/api/v2/data-sources/pins/order')
        .set('Cookie', endUser.cookie)
        .set('tj-workspace-id', org)
        .send({ items: [] })
        .expect(204);
    });

    it('should not show a pin made on a feature branch on the default branch', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-branch@tooljet.io');
      const org = admin.workspace.id;
      const defaultBranch = await resolveOrSeedDefaultBranch(org);
      const feature = await saveEntity(WorkspaceBranch, {
        organizationId: org,
        name: 'feature-pin',
      } as WorkspaceBranch);
      const { dataSource } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Branched' });

      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({ resource_type: 'data_source', resource_ids: [dataSource.id], branch_id: feature.id })
        .expect(204);

      const onFeature = await list(admin.cookie, org, { branch_id: feature.id });
      const onDefault = await list(admin.cookie, org, { branch_id: defaultBranch.id });
      expect(onFeature.body.items).toMatchObject([{ id: dataSource.id, pinned: true }]);
      expect(onDefault.body.items.find((i: { id: string }) => i.id === dataSource.id)).toMatchObject({
        pinned: false,
      });
    });
  });

  describe('DELETE /api/v2/data-sources/pins/:resource_type/:resource_id | Unpin', () => {
    it('should remove only that pin and be idempotent', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-delete@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const folder = await dataSourceFolder(org, 'Unpin me');
      const { dataSource } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Keep pinned',
        folder,
      });
      await seedPin(admin.user, { folderId: folder.id, branchId: branch.id, position: 0 });
      await seedPin(admin.user, { dataSourceId: dataSource.id, branchId: branch.id, position: 1 });

      for (let i = 0; i < 2; i++) {
        await http()
          .delete(`/api/v2/data-sources/pins/folder/${folder.id}`)
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', org)
          .expect(204);
      }

      expect(await findEntity(PinnedItem, { folderId: folder.id })).toBeNull();
      expect(await findEntity(PinnedItem, { dataSourceId: dataSource.id })).not.toBeNull();
    });
  });

  describe('PUT /api/v2/data-sources/pins/order | Reorder', () => {
    it('should reorder the caller’s data-source-page pins and leave an app pin’s position unchanged', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-order@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'App pin' });
      const { dataSource: a } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'A' });
      const { dataSource: b } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'B' });
      await seedPin(admin.user, { appId: app.id, branchId: branch.id, position: 0 });
      await seedPin(admin.user, { dataSourceId: a.id, branchId: branch.id, position: 1 });
      await seedPin(admin.user, { dataSourceId: b.id, branchId: branch.id, position: 2 });

      await http()
        .put('/api/v2/data-sources/pins/order')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({
          items: [
            { resource_type: 'data_source', resource_id: b.id },
            { resource_type: 'data_source', resource_id: a.id },
          ],
        })
        .expect(204);

      const positions = Object.fromEntries(
        (await getEntityRepository(PinnedItem).find({ where: { userId: admin.user.id } })).map((p) => [
          p.appId ?? p.dataSourceId,
          p.position,
        ])
      );
      expect(positions).toEqual({ [app.id]: 0, [b.id]: 1, [a.id]: 2 });
    });

    it('should 400 when the request set differs from the current pins', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-order-400@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const { dataSource: a } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Only' });
      await seedPin(admin.user, { dataSourceId: a.id, branchId: branch.id, position: 0 });

      await http()
        .put('/api/v2/data-sources/pins/order')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({ items: [] })
        .expect(400);
    });

    it('should 400 when the request includes an id that is not currently pinned (extra id)', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-order-extra@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const { dataSource: pinned } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Pinned only',
      });
      const { dataSource: notPinned } = await seedDashboardDataSource(nestApp, {
        organizationId: org,
        name: 'Not pinned',
      });
      await seedPin(admin.user, { dataSourceId: pinned.id, branchId: branch.id, position: 0 });

      await http()
        .put('/api/v2/data-sources/pins/order')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({
          items: [
            { resource_type: 'data_source', resource_id: pinned.id },
            { resource_type: 'data_source', resource_id: notPinned.id },
          ],
        })
        .expect(400);
    });

    it('should 400 when the request swaps a pinned id for an unpinned one (missing + extra)', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-order-swap@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const { dataSource: pinned } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Pinned' });
      const { dataSource: other } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Other' });
      await seedPin(admin.user, { dataSourceId: pinned.id, branchId: branch.id, position: 0 });

      await http()
        .put('/api/v2/data-sources/pins/order')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({ items: [{ resource_type: 'data_source', resource_id: other.id }] })
        .expect(400);
    });
  });

  describe('Pins | Workspace scope', () => {
    it("should 404 for another workspace's branch id on pin, unpin and reorder, and write nothing", async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-foreign-branch@tooljet.io');
      const other = await createAdmin(nestApp, 'ds-pin-foreign-branch-other@tooljet.io');
      const org = admin.workspace.id;
      const branch = await resolveOrSeedDefaultBranch(org);
      const foreignBranch = await resolveOrSeedDefaultBranch(other.workspace.id);
      const { dataSource: pinned } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Pinned' });
      const { dataSource: loose } = await seedDashboardDataSource(nestApp, { organizationId: org, name: 'Loose' });
      await seedPin(admin.user, { dataSourceId: pinned.id, branchId: branch.id, position: 0 });

      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({ resource_type: 'data_source', resource_ids: [loose.id], branch_id: foreignBranch.id })
        .expect(404);
      await http()
        .delete(`/api/v2/data-sources/pins/data_source/${pinned.id}`)
        .query({ branch_id: foreignBranch.id })
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .expect(404);
      await http()
        .put('/api/v2/data-sources/pins/order')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', org)
        .send({ items: [{ resource_type: 'data_source', resource_id: pinned.id }], branch_id: foreignBranch.id })
        .expect(404);

      expect(await getEntityRepository(PinnedItem).find({ where: { userId: admin.user.id } })).toEqual([
        expect.objectContaining({ dataSourceId: pinned.id, branchId: branch.id }),
      ]);
    });

    it("should not pin another workspace's folder", async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-foreign-folder@tooljet.io');
      const other = await createAdmin(nestApp, 'ds-pin-foreign-folder-other@tooljet.io');
      const foreignFolder = await dataSourceFolder(other.workspace.id, 'Foreign');

      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id)
        .send({ resource_type: 'folder', resource_ids: [foreignFolder.id] })
        .expect(204);

      expect(await getEntityRepository(PinnedItem).count({ where: { userId: admin.user.id } })).toBe(0);
    });

    it('should 400 for more than 500 ids', async () => {
      const admin = await createAdmin(nestApp, 'ds-pin-too-many@tooljet.io');
      const ids = Array.from({ length: 501 }, () => randomUUID());

      await http()
        .post('/api/v2/data-sources/pins')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id)
        .send({ resource_type: 'data_source', resource_ids: ids })
        .expect(400);
    });
  });
});
