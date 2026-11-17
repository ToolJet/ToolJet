import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserDataSourceActivity } from '@entities/user_data_source_activity.entity';
import { DataSourceActivityService } from '@modules/data-sources/dashboard/activity.service';
import {
  TestUser,
  closeTestApp,
  createAdmin,
  createUser,
  ensureAppEnvironments,
  findEntity,
  getAllEnvironments,
  initTestApp,
  login,
  resolveOrSeedDefaultBranch,
  seedDataSourceActivity,
} from 'test-helper';

/** Global data source created via the real create endpoint, so organization_id is set correctly. */
async function createGlobalDataSource(nestApp: INestApplication, admin: TestUser, name: string): Promise<string> {
  const response = await request(nestApp.getHttpServer())
    .post('/api/data-sources')
    .set('tj-workspace-id', admin.workspace.id)
    .set('Cookie', admin.cookie)
    .send({ name, kind: 'restapi', options: [] });
  return response.body.id;
}

/** @group platform */
describe('Data sources dashboard activity write paths', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('GET /api/data-sources/:id/environment/:environment_id | Open connection form', () => {
    it('should record last_viewed_at for the caller on the default branch', async () => {
      const admin = await createAdmin(nestApp, 'ds-act-view@tooljet.io');
      await ensureAppEnvironments(nestApp, admin.workspace.id);
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const dataSourceId = await createGlobalDataSource(nestApp, admin, 'View data source');
      const environments = await getAllEnvironments(nestApp, admin.workspace.id);
      const defaultEnv = environments.find((e) => e.isDefault) || environments[0];

      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-sources/${dataSourceId}/environment/${defaultEnv.id}`)
        .set('tj-workspace-id', admin.workspace.id)
        .set('Cookie', admin.cookie);

      expect(response.statusCode).toBe(200);
      expect(
        await findEntity(UserDataSourceActivity, { userId: admin.user.id, dataSourceId, branchId: branch.id })
      ).toMatchObject({ lastViewedAt: expect.any(Date), lastEditedAt: null });
    });

    it('should not move last_viewed_at again within 5 minutes', async () => {
      const admin = await createAdmin(nestApp, 'ds-act-view-throttle@tooljet.io');
      await ensureAppEnvironments(nestApp, admin.workspace.id);
      const dataSourceId = await createGlobalDataSource(nestApp, admin, 'Throttled view data source');
      const environments = await getAllEnvironments(nestApp, admin.workspace.id);
      const defaultEnv = environments.find((e) => e.isDefault) || environments[0];
      const viewOnce = () =>
        request(nestApp.getHttpServer())
          .get(`/api/data-sources/${dataSourceId}/environment/${defaultEnv.id}`)
          .set('tj-workspace-id', admin.workspace.id)
          .set('Cookie', admin.cookie);

      await viewOnce();
      const first = await findEntity(UserDataSourceActivity, { userId: admin.user.id, dataSourceId });
      await viewOnce();
      const second = await findEntity(UserDataSourceActivity, { userId: admin.user.id, dataSourceId });

      expect(second.lastViewedAt).toEqual(first.lastViewedAt);
    });
  });

  describe('PUT /api/data-sources/:id | Update data source', () => {
    it('should record last_edited_at for the caller on the default branch', async () => {
      const admin = await createAdmin(nestApp, 'ds-act-edit@tooljet.io');
      await ensureAppEnvironments(nestApp, admin.workspace.id);
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const dataSourceId = await createGlobalDataSource(nestApp, admin, 'Edit data source');
      const environments = await getAllEnvironments(nestApp, admin.workspace.id);
      const defaultEnv = environments.find((e) => e.isDefault) || environments[0];

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-sources/${dataSourceId}?environment_id=${defaultEnv.id}`)
        .set('tj-workspace-id', admin.workspace.id)
        .set('Cookie', admin.cookie)
        .send({ name: 'Edited data source', options: [] });

      expect(response.statusCode).toBe(200);
      expect(
        await findEntity(UserDataSourceActivity, { userId: admin.user.id, dataSourceId, branchId: branch.id })
      ).toMatchObject({ lastEditedAt: expect.any(Date) });
    });
  });

  describe('DataSourceActivityService | Smart throttle', () => {
    it('should write inside the 5-minute window when someone else edited since', async () => {
      const a = await createAdmin(nestApp, 'ds-act-smart-a@tooljet.io');
      const b = await createAdmin(nestApp, 'ds-act-smart-b@tooljet.io', { workspace: a.workspace });
      await ensureAppEnvironments(nestApp, a.workspace.id);
      const branch = await resolveOrSeedDefaultBranch(a.workspace.id);
      const dataSourceId = await createGlobalDataSource(nestApp, a, 'Two editors');
      const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
      await seedDataSourceActivity(nestApp, {
        userId: a.user.id,
        dataSourceId,
        branchId: branch.id,
        lastEditedAt: minutesAgo(2),
      });
      await seedDataSourceActivity(nestApp, {
        userId: b.user.id,
        dataSourceId,
        branchId: branch.id,
        lastEditedAt: minutesAgo(1),
      });

      await nestApp.get(DataSourceActivityService).recordEdit(a.user.id, dataSourceId, a.workspace.id, branch.id);

      const aRow = await findEntity(UserDataSourceActivity, { userId: a.user.id, dataSourceId });
      const bRow = await findEntity(UserDataSourceActivity, { userId: b.user.id, dataSourceId });
      expect(aRow.lastEditedAt.getTime()).toBeGreaterThan(bRow.lastEditedAt.getTime());
    });

    it('should skip inside the 5-minute window when the user is still the latest editor', async () => {
      const a = await createAdmin(nestApp, 'ds-act-solo@tooljet.io');
      await ensureAppEnvironments(nestApp, a.workspace.id);
      const branch = await resolveOrSeedDefaultBranch(a.workspace.id);
      const dataSourceId = await createGlobalDataSource(nestApp, a, 'Solo editor');
      const seeded = new Date(Date.now() - 2 * 60_000);
      await seedDataSourceActivity(nestApp, {
        userId: a.user.id,
        dataSourceId,
        branchId: branch.id,
        lastEditedAt: seeded,
      });

      await nestApp.get(DataSourceActivityService).recordEdit(a.user.id, dataSourceId, a.workspace.id, branch.id);

      expect((await findEntity(UserDataSourceActivity, { userId: a.user.id, dataSourceId })).lastEditedAt).toEqual(
        seeded
      );
    });
  });

  describe('Guard failure | No write', () => {
    it('should write nothing when the request is refused', async () => {
      const admin = await createAdmin(nestApp, 'ds-act-403-admin@tooljet.io');
      await ensureAppEnvironments(nestApp, admin.workspace.id);
      const dataSourceId = await createGlobalDataSource(nestApp, admin, 'Guarded data source');
      const endUser = await createUser(nestApp, {
        email: 'ds-act-403-user@tooljet.io',
        groups: ['all_users'],
        organization: admin.workspace,
      });
      const { tokenCookie } = await login(nestApp, endUser.user.email);
      const environments = await getAllEnvironments(nestApp, admin.workspace.id);
      const defaultEnv = environments.find((e) => e.isDefault) || environments[0];

      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-sources/${dataSourceId}/environment/${defaultEnv.id}`)
        .set('tj-workspace-id', admin.workspace.id)
        .set('Cookie', tokenCookie);

      expect(response.statusCode).toBe(403);
      expect(await findEntity(UserDataSourceActivity, { userId: endUser.user.id, dataSourceId })).toBeNull();
    });
  });
});
