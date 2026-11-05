import { INestApplication } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { Folder } from '@entities/folder.entity';
import { PinnedItem } from '@entities/pinned_item.entity';
import { UserAppActivity } from '@entities/user_app_activity.entity';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createFolder,
  deleteEntities,
  findEntity,
  resolveOrSeedDefaultBranch,
  saveEntity,
  seedActivity,
  seedDashboardApp,
  seedPin,
} from 'test-helper';

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
});
