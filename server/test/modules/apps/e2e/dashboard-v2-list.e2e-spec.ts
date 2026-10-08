import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from '@entities/app.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  createFolder,
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
    ({ app: nestApp } = await initTestApp({ edition: 'ee' }));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('EE edition', () => {
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
            },
          ],
        });
        expect(res.body.items.map((i: { id: string }) => i.id)).not.toContain(inFolder.id);
        expect(res.body.items[1]).not.toHaveProperty('is_public');
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

      it('end user sees only released apps, hides folders with no released app, ordered by last view', async () => {
        const admin = await createAdmin(nestApp, 'dash-list-eu-admin@tooljet.io');
        const endUser = await createEndUser(nestApp, 'dash-list-eu@tooljet.io', { workspace: admin.workspace });
        const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
        const draftFolder = await createFolder(nestApp, { name: 'Drafts only', organizationId: admin.workspace.id });
        await seedDashboardApp(nestApp, { user: admin.user, name: 'Draft', folder: draftFolder });
        const { app: r1 } = await seedDashboardApp(nestApp, { user: admin.user, name: 'R1', released: true });
        const { app: r2 } = await seedDashboardApp(nestApp, { user: admin.user, name: 'R2', released: true });
        await seedActivity(endUser.user.id, r2.id, branch.id, { lastViewedAt: new Date() });

        const res = await list(nestApp, endUser.cookie, admin.workspace.id, { type: 'front-end' });

        expect(res.body).toMatchObject({ total: 2, counts: { pinned: 0, folders: 0, apps: 2 } });
        expect(res.body.items.map((i: { id: string }) => i.id)).toEqual([r2.id, r1.id]);
        expect(res.body.items[0]).toMatchObject({ last_viewed_at: expect.any(String) });
        expect(res.body.items[1]).toMatchObject({ last_viewed_at: null });
        expect(res.body.items[0].actions).toMatchObject({ edit: false, delete: false, pin: true });
      });

      it("end user's folder last_viewed_at is their latest view across its visible apps, null when none viewed", async () => {
        const admin = await createAdmin(nestApp, 'dash-list-eu-fview-admin@tooljet.io');
        const endUser = await createEndUser(nestApp, 'dash-list-eu-fview@tooljet.io', { workspace: admin.workspace });
        const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
        const viewed = await createFolder(nestApp, { name: 'Viewed', organizationId: admin.workspace.id });
        const unviewed = await createFolder(nestApp, { name: 'Unviewed', organizationId: admin.workspace.id });
        const { app: older } = await seedDashboardApp(nestApp, {
          user: admin.user,
          name: 'Older',
          released: true,
          folder: viewed,
        });
        const { app: newer } = await seedDashboardApp(nestApp, {
          user: admin.user,
          name: 'Newer',
          released: true,
          folder: viewed,
        });
        await seedDashboardApp(nestApp, { user: admin.user, name: 'Never opened', released: true, folder: unviewed });
        const latest = new Date('2026-06-01T10:00:00Z');
        await seedActivity(endUser.user.id, older.id, branch.id, { lastViewedAt: new Date('2026-01-01T10:00:00Z') });
        await seedActivity(endUser.user.id, newer.id, branch.id, { lastViewedAt: latest });
        // Another user's view must not count.
        await seedActivity(admin.user.id, newer.id, branch.id, { lastViewedAt: new Date() });

        const res = await list(nestApp, endUser.cookie, admin.workspace.id, { type: 'front-end' });

        const byId = new Map(res.body.items.map((i: { id: string }) => [i.id, i]));
        expect(byId.get(viewed.id)).toMatchObject({ last_viewed_at: latest.toISOString() });
        expect(byId.get(unviewed.id)).toMatchObject({ last_viewed_at: null });
      });

      it('end user gets no modules', async () => {
        const admin = await createAdmin(nestApp, 'dash-list-eu-mod-admin@tooljet.io');
        const endUser = await createEndUser(nestApp, 'dash-list-eu-mod@tooljet.io', { workspace: admin.workspace });
        await seedDashboardApp(nestApp, { user: admin.user, name: 'Mod', type: APP_TYPES.MODULE, released: true });

        const res = await list(nestApp, endUser.cookie, admin.workspace.id, { type: 'module' });

        expect(res.body).toMatchObject({ items: [], total: 0 });
      });

      // Default end-user group: WORKFLOWS canView + isAll → isAllExecutable → every workflow viewable (EE);
      // released-only then applies like apps.
      it('end user sees only released workflows, with no launch and edit + delete disabled', async () => {
        const admin = await createAdmin(nestApp, 'dash-list-eu-wf-admin@tooljet.io');
        const endUser = await createEndUser(nestApp, 'dash-list-eu-wf@tooljet.io', { workspace: admin.workspace });
        await seedDashboardApp(nestApp, { user: admin.user, name: 'WF draft', type: APP_TYPES.WORKFLOW });
        const { app: released } = await seedDashboardApp(nestApp, {
          user: admin.user,
          name: 'WF released',
          type: APP_TYPES.WORKFLOW,
          released: true,
        });

        const res = await list(nestApp, endUser.cookie, admin.workspace.id, { type: 'workflow' });

        expect(res.body.items).toEqual([
          expect.objectContaining({
            id: released.id,
            actions: { launch: null, edit: false, delete: false, pin: true },
          }),
        ]);
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
        for (let i = 0; i < 6; i++)
          apps.push((await seedDashboardApp(nestApp, { user: admin.user, name: `P${i}` })).app);
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
        for (let i = 0; i < 6; i++)
          apps.push((await seedDashboardApp(nestApp, { user: admin.user, name: `S${i}` })).app);
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

      it('lists workflows for an admin with launch = null', async () => {
        const admin = await createAdmin(nestApp, 'dash-list-wf@tooljet.io');
        const { app: workflow } = await seedDashboardApp(nestApp, {
          user: admin.user,
          name: 'WF one',
          type: APP_TYPES.WORKFLOW,
        });

        const res = await list(nestApp, admin.cookie, admin.workspace.id, { type: 'workflow' });

        expect(res.statusCode).toBe(200);
        expect(res.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: workflow.id, actions: expect.objectContaining({ launch: null }) }),
          ])
        );
      });
    });
  });
});
