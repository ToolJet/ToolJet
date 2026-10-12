import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from '@entities/app.entity';
import { PinnedItem } from '@entities/pinned_item.entity';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  createFolder,
  findEntity,
  getEntityRepository,
  resolveOrSeedDefaultBranch,
  seedDashboardApp,
  seedPin,
  updateEntity,
} from 'test-helper';

/** @group platform */
describe('PinsController', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee' }));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const http = () => request(nestApp.getHttpServer());

  describe('EE (plan: basic)', () => {
    describe('POST /api/v2/pins | Pin', () => {
      it('should append new pins at the end in request order and ignore already-pinned and invisible ids', async () => {
        const admin = await createAdmin(nestApp, 'dash-pin-create@tooljet.io');
        const endUser = await createEndUser(nestApp, 'dash-pin-create-eu@tooljet.io', { workspace: admin.workspace });
        const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
        const { app: released } = await seedDashboardApp(nestApp, {
          user: admin.user,
          name: 'Released',
          released: true,
        });
        const { app: released2 } = await seedDashboardApp(nestApp, {
          user: admin.user,
          name: 'Released 2',
          released: true,
        });
        const { app: draft } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Draft' });
        await seedPin(endUser.user, { appId: released.id, branchId: branch.id, position: 0 });

        await http()
          .post('/api/v2/pins')
          .set('Cookie', endUser.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .send({ resource_type: 'app', resource_ids: [released.id, draft.id, released2.id] })
          .expect(204);

        const pins = await getEntityRepository(PinnedItem).find({
          where: { userId: endUser.user.id },
          order: { position: 'ASC' },
        });
        expect(pins.map((pin) => pin.appId)).toEqual([released.id, released2.id]);
      });

      it('should pin only folders the user can see', async () => {
        const admin = await createAdmin(nestApp, 'dash-pin-folder@tooljet.io');
        const endUser = await createEndUser(nestApp, 'dash-pin-folder-eu@tooljet.io', { workspace: admin.workspace });
        const shown = await createFolder(nestApp, { name: 'Has released', organizationId: admin.workspace.id });
        const hidden = await createFolder(nestApp, { name: 'Drafts only', organizationId: admin.workspace.id });
        await seedDashboardApp(nestApp, { user: admin.user, name: 'Released', released: true, folder: shown });
        await seedDashboardApp(nestApp, { user: admin.user, name: 'Draft', folder: hidden });

        await http()
          .post('/api/v2/pins')
          .set('Cookie', endUser.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .send({ resource_type: 'folder', resource_ids: [hidden.id, shown.id] })
          .expect(204);

        const pins = await getEntityRepository(PinnedItem).find({ where: { userId: endUser.user.id } });
        expect(pins).toHaveLength(1);
        expect(pins[0]).toMatchObject({ folderId: shown.id, appId: null });
      });
    });

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

      it('should reorder only visible pins and keep hidden pins in their slots', async () => {
        const admin = await createAdmin(nestApp, 'dash-pin-order-hidden-admin@tooljet.io');
        const endUser = await createEndUser(nestApp, 'dash-pin-order-hidden@tooljet.io', {
          workspace: admin.workspace,
        });
        const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
        const { app: a } = await seedDashboardApp(nestApp, { user: admin.user, name: 'A', released: true });
        const { app: b } = await seedDashboardApp(nestApp, { user: admin.user, name: 'B', released: true });
        const { app: c } = await seedDashboardApp(nestApp, { user: admin.user, name: 'C', released: true });
        await seedPin(endUser.user, { appId: a.id, branchId: branch.id, position: 0 });
        await seedPin(endUser.user, { appId: b.id, branchId: branch.id, position: 1 });
        await seedPin(endUser.user, { appId: c.id, branchId: branch.id, position: 2 });
        await updateEntity(App, b.id, { currentVersionId: null });

        await http()
          .put('/api/v2/pins/order')
          .set('Cookie', endUser.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .send({
            type: 'front-end',
            items: [
              { resource_type: 'app', resource_id: c.id },
              { resource_type: 'app', resource_id: a.id },
            ],
          })
          .expect(204);

        const positions = Object.fromEntries(
          (await getEntityRepository(PinnedItem).find({ where: { userId: endUser.user.id } })).map((p) => [
            p.appId,
            p.position,
          ])
        );
        expect(positions).toEqual({ [c.id]: 0, [b.id]: 1, [a.id]: 2 });
      });
    });
  });
});
