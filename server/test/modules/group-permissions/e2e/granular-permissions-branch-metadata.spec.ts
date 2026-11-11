import { INestApplication } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppBase } from '@entities/app_base.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { GranularPermissionsService } from '@modules/group-permissions/services/granular-permissions.service';
import {
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
  initTestApp,
  updateEntity,
} from 'test-helper';

/** @group platform */
describe('GranularPermissionsService | Workspace-wide branch metadata', () => {
  let app: INestApplication;
  let service: GranularPermissionsService;
  let workspaceId: string;
  let defaultApp: App;
  let featureApp: App;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    service = app.get(GranularPermissionsService);
    const admin = await createAdmin(app, 'branch-metadata@example.invalid');
    workspaceId = admin.workspace.id;
    const user = Object.assign(admin.user, { organizationId: workspaceId });
    const manager = getDefaultDataSource().manager;
    const branch = await manager.getRepository(WorkspaceBranch).save({
      organizationId: workspaceId,
      name: 'workbench',
      isDefault: false,
    });
    const reviewBranch = await manager.getRepository(WorkspaceBranch).save({
      organizationId: workspaceId,
      name: 'review',
      isDefault: false,
    });

    defaultApp = await createApplication(app, { name: 'Warehouse', user });
    const canonical = await createApplicationVersion(app, defaultApp, { name: 'canonical' });
    const alternate = await createApplicationVersion(app, defaultApp, { name: 'alternate' });
    await updateEntity(AppVersion, canonical.id, {
      appName: 'Warehouse main',
      updatedAt: new Date('2025-01-01'),
    });
    await updateEntity(AppVersion, alternate.id, {
      branchId: branch.id,
      versionType: AppVersionType.BRANCH,
      appName: 'Warehouse workbench',
      updatedAt: new Date('2025-03-01'),
    });

    featureApp = await createApplication(app, { name: 'Materials', user });
    const older = await createApplicationVersion(app, featureApp, { name: 'older' });
    const newer = await createApplicationVersion(app, featureApp, { name: 'newer' });
    await updateEntity(AppVersion, older.id, {
      branchId: branch.id,
      versionType: AppVersionType.BRANCH,
      appName: 'Materials draft',
      updatedAt: new Date('2025-01-01'),
    });
    await updateEntity(AppVersion, newer.id, {
      branchId: reviewBranch.id,
      versionType: AppVersionType.BRANCH,
      appName: 'Materials current',
      slug: 'materials-current',
      icon: 'box',
      isPublic: true,
      updatedAt: new Date('2025-02-01'),
    });
    // Metadata has moved off apps in migrated workspaces.
    await manager.getRepository(AppBase).update([defaultApp.id, featureApp.id], { name: null });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should list feature-only apps while keeping default-branch names ahead of newer feature versions', async () => {
    const resources = await service.getAddableApps(workspaceId);
    expect(resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: defaultApp.id, name: 'Warehouse main' }),
        expect.objectContaining({ id: featureApp.id, name: 'Materials current' }),
      ])
    );
    expect(resources).toHaveLength(2);
  });

  it('should hydrate selected-app permission metadata with the same default-first fallback', async () => {
    const selectedApps = [defaultApp, featureApp].map(({ id }) => ({
      id,
      name: null,
      slug: null,
      icon: null,
      isPublic: false,
    }));
    const permissions = [
      { appsGroupPermissions: { groupApps: selectedApps.map((selectedApp) => ({ app: selectedApp })) } },
    ] as unknown as GranularPermissions[];
    const overlay = service as unknown as {
      overlayGranularPermissionAppMetadata(
        manager: EntityManager,
        permissions: GranularPermissions[],
        organizationId: string
      ): Promise<void>;
    };
    await overlay.overlayGranularPermissionAppMetadata(getDefaultDataSource().manager, permissions, workspaceId);
    expect(selectedApps).toEqual([
      expect.objectContaining({ id: defaultApp.id, name: 'Warehouse main' }),
      expect.objectContaining({
        id: featureApp.id,
        name: 'Materials current',
        slug: 'materials-current',
        icon: 'box',
        isPublic: true,
      }),
    ]);
  });
});
