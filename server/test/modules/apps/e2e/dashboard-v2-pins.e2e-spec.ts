import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PinnedItem } from '@entities/pinned_item.entity';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createFolder,
  findEntity,
  getEntityRepository,
  resolveOrSeedDefaultBranch,
  seedDashboardApp,
  seedPin,
} from 'test-helper';

/** @group platform */
describe('PinsController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const http = () => request(nestApp.getHttpServer());

  describe('DELETE /api/v2/pins/:resource_type/:resource_id | Unpin', () => {
    it('should remove only that pin and be idempotent', async () => {
      const admin = await createAdmin(nestApp, 'dash-pin-delete@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const folder = await createFolder(nestApp, { name: 'Unpin me', organizationId: admin.workspace.id });
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Keep pinned', folder });
      await seedPin(admin.user, { folderId: folder.id, branchId: branch.id, position: 0 });
      await seedPin(admin.user, { appId: app.id, branchId: branch.id, position: 1 });

      for (let i = 0; i < 2; i++) {
        await http()
          .delete(`/api/v2/pins/folder/${folder.id}`)
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .expect(204);
      }

      expect(await findEntity(PinnedItem, { folderId: folder.id })).toBeNull();
      expect(await findEntity(PinnedItem, { appId: app.id })).not.toBeNull();
    });
  });

  describe('PUT /api/v2/pins/order | Reorder', () => {
    it('should reorder one type’s pins and leave other types untouched', async () => {
      const admin = await createAdmin(nestApp, 'dash-pin-order@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A' });
      const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B' });
      const { app: m } = await seedDashboardApp(nestApp, { user: admin.user, name: 'M', type: 'module' });
      await seedPin(admin.user, { appId: a.id, branchId: branch.id, position: 0 });
      await seedPin(admin.user, { appId: m.id, branchId: branch.id, position: 1 });
      await seedPin(admin.user, { appId: b.id, branchId: branch.id, position: 2 });

      await http()
        .put('/api/v2/pins/order')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id)
        .send({
          type: 'front-end',
          items: [
            { resource_type: 'app', resource_id: b.id },
            { resource_type: 'app', resource_id: a.id },
          ],
        })
        .expect(204);
      const positions = Object.fromEntries(
        (await getEntityRepository(PinnedItem).find({ where: { userId: admin.user.id } })).map((p) => [
          p.appId,
          p.position,
        ])
      );
      expect(positions).toEqual({ [b.id]: 0, [m.id]: 1, [a.id]: 2 });
    });

    it('should 400 when the request set differs from the current pins', async () => {
      const admin = await createAdmin(nestApp, 'dash-pin-order-400@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Only' });
      await seedPin(admin.user, { appId: a.id, branchId: branch.id, position: 0 });

      await http()
        .put('/api/v2/pins/order')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id)
        .send({ type: 'front-end', items: [] })
        .expect(400);
    });
  });
});
