import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { DataSource } from '@entities/data_source.entity';
import { Folder } from '@entities/folder.entity';
import { PinnedItem } from '@entities/pinned_item.entity';
import { User } from '@entities/user.entity';
import { UserAppActivity } from '@entities/user_app_activity.entity';
import { UserDataSourceActivity } from '@entities/user_data_source_activity.entity';
import {
  createApplication,
  createApplicationVersion,
  createAdmin,
  createDataSource,
  createFolder,
  createUser,
  closeTestApp,
  deleteEntities,
  ensureAppEnvironments,
  findEntity,
  initTestApp,
  login,
  resolveOrSeedDefaultBranch,
  saveEntity,
  seedActivity,
  seedDashboardApp,
  seedDataSourceActivity,
  seedPin,
  updateEntity,
} from 'test-helper';

/** App version + a global data source on the org's default branch. */
async function seedDashboardDataSource(
  nestApp: INestApplication,
  opts: { user: User; name: string }
): Promise<DataSource> {
  const application = await createApplication(nestApp, { name: `${opts.name} app`, user: opts.user });
  const appVersion = await createApplicationVersion(nestApp, application as App & { organizationId: string });
  return createDataSource(nestApp, { name: opts.name, kind: 'restapi', appVersion });
}

/** @group platform */
describe('Dashboard v2 schema', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('should cascade pins and activity when the app is deleted', async () => {
    const admin = await createAdmin(nestApp, 'dash-schema-app@tooljet.io');
    const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
    const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Cascade app' });
    await seedPin(admin.user, { appId: app.id, branchId: branch.id, position: 0 });
    await seedActivity(admin.user.id, app.id, branch.id, { lastEditedAt: new Date() });

    await deleteEntities(App, { id: app.id });

    expect(await findEntity(PinnedItem, { appId: app.id })).toBeNull();
    expect(await findEntity(UserAppActivity, { appId: app.id })).toBeNull();
  });

  it('should cascade the pin when the folder is deleted', async () => {
    const admin = await createAdmin(nestApp, 'dash-schema-folder@tooljet.io');
    const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
    const folder = await createFolder(nestApp, { name: 'Cascade folder', organizationId: admin.workspace.id });
    await seedPin(admin.user, { folderId: folder.id, branchId: branch.id, position: 0 });

    await deleteEntities(Folder, { id: folder.id });

    expect(await findEntity(PinnedItem, { folderId: folder.id })).toBeNull();
  });

  it('should reject a pin that names both an app and a folder', async () => {
    const admin = await createAdmin(nestApp, 'dash-schema-check@tooljet.io');
    const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
    const folder = await createFolder(nestApp, { name: 'Both folder', organizationId: admin.workspace.id });
    const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Both app' });

    await expect(
      saveEntity(PinnedItem, {
        userId: admin.user.id,
        branchId: branch.id,
        appId: app.id,
        folderId: folder.id,
        position: 0,
      } as PinnedItem)
    ).rejects.toThrow(/chk_pinned_items_one_resource/);
  });

  describe('data source columns', () => {
    it('should cascade pins and activity when the data source is deleted', async () => {
      const admin = await createAdmin(nestApp, 'dash-schema-ds-cascade@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const dataSource = await seedDashboardDataSource(nestApp, { user: admin.user, name: 'Cascade data source' });
      await seedPin(admin.user, { dataSourceId: dataSource.id, branchId: branch.id, position: 0 });
      await seedDataSourceActivity(nestApp, {
        userId: admin.user.id,
        dataSourceId: dataSource.id,
        branchId: branch.id,
        lastEditedAt: new Date(),
      });

      await deleteEntities(DataSource, { id: dataSource.id });

      expect(await findEntity(PinnedItem, { dataSourceId: dataSource.id })).toBeNull();
      expect(await findEntity(UserDataSourceActivity, { dataSourceId: dataSource.id })).toBeNull();
    });

    it('should null created_by when the creating user is deleted', async () => {
      const admin = await createAdmin(nestApp, 'dash-schema-ds-owner@tooljet.io');
      const creator = await createUser(nestApp, {
        email: 'dash-schema-ds-creator@tooljet.io',
        organization: admin.workspace,
      });
      const dataSource = await seedDashboardDataSource(nestApp, { user: admin.user, name: 'Owned data source' });
      await updateEntity(DataSource, dataSource.id, { createdBy: creator.user.id });

      await deleteEntities(User, { id: creator.user.id });

      expect(await findEntity(DataSource, { id: dataSource.id })).toMatchObject({ createdBy: null });
    });

    it('should reject a pin that names both an app and a data source', async () => {
      const admin = await createAdmin(nestApp, 'dash-schema-ds-check-both@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const { app } = await seedDashboardApp(nestApp, { user: admin.user, name: 'Both app (data source)' });
      const dataSource = await seedDashboardDataSource(nestApp, { user: admin.user, name: 'Both data source' });

      await expect(
        saveEntity(PinnedItem, {
          userId: admin.user.id,
          branchId: branch.id,
          appId: app.id,
          dataSourceId: dataSource.id,
          position: 0,
        } as PinnedItem)
      ).rejects.toThrow(/chk_pinned_items_one_resource/);
    });

    it('should reject a pin that names none of app, folder, or data source', async () => {
      const admin = await createAdmin(nestApp, 'dash-schema-ds-check-none@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);

      await expect(
        saveEntity(PinnedItem, {
          userId: admin.user.id,
          branchId: branch.id,
          position: 0,
        } as PinnedItem)
      ).rejects.toThrow(/chk_pinned_items_one_resource/);
    });

    it('should reject a second pin for the same user, branch and data source', async () => {
      const admin = await createAdmin(nestApp, 'dash-schema-ds-unique@tooljet.io');
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const dataSource = await seedDashboardDataSource(nestApp, { user: admin.user, name: 'Unique pin data source' });
      await seedPin(admin.user, { dataSourceId: dataSource.id, branchId: branch.id, position: 0 });

      await expect(
        seedPin(admin.user, { dataSourceId: dataSource.id, branchId: branch.id, position: 1 })
      ).rejects.toThrow(/uq_pinned_items_user_branch_data_source/);
    });

    it('should store created_by as the caller on POST /api/data-sources', async () => {
      const admin = await createAdmin(nestApp, 'dash-schema-ds-create@tooljet.io');
      await ensureAppEnvironments(nestApp, admin.workspace.id);
      const loggedUser = await login(nestApp, admin.user.email);

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-sources')
        .set('tj-workspace-id', admin.user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'owner_test_data_source', kind: 'restapi', options: [] });

      expect(response.statusCode).toBe(201);
      expect(await findEntity(DataSource, { id: response.body.id })).toMatchObject({ createdBy: admin.user.id });
    });
  });
});
