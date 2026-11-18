/**
 * @group platform
 */
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createGroupPermission,
  grantAppPermission,
  getDefaultDataSource,
} from 'test-helper';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { AppsSubscriber } from '@modules/apps/subscribers/apps.subscriber';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { ResourceType } from '@modules/group-permissions/constants';

// initTestApp() can exceed 60s when Jest restarts the worker to free memory
jest.setTimeout(120_000);

describe('GroupPermissionsRepository', () => {
  // Regression: getAllGranularPermissions loads one App per individually granted app, and
  // AppsSubscriber.afterLoad ran a git-sync lookup for each of them. Callers only read app
  // columns (role checks, group duplication, external API group sync), so it is skipped.
  describe('getAllGranularPermissions() on a group granted many individual apps', () => {
    const GRANTED_APP_COUNT = 15;
    let nestApp: INestApplication;
    let repository: GroupPermissionsRepository;
    let organizationId: string;
    let groupId: string;
    let getDetailsSpy: jest.SpyInstance;

    beforeAll(async () => {
      ({ app: nestApp } = await initTestApp());
      repository = nestApp.get<GroupPermissionsRepository>(GroupPermissionsRepository);

      const admin = await createAdmin(nestApp, 'group-perms-many-apps@tooljet.io');
      organizationId = admin.user.organizationId;
      const group = await createGroupPermission(nestApp, { organizationId, name: 'many-apps-group' });
      groupId = group.id;

      for (let i = 0; i < GRANTED_APP_COUNT; i++) {
        const app = await createApplication(nestApp, { name: `granted-app-${i}`, user: admin.user });
        await grantAppPermission(nestApp, app, groupId, { read: true });
      }
    });

    beforeEach(() => {
      // Spy on the exact util instance the registered subscriber holds (edition-agnostic).
      const subscriber = getDefaultDataSource().subscribers.find((s) => s instanceof AppsSubscriber) as unknown as {
        gitSyncConfigsUtilService: GitSyncConfigsUtilService;
      };
      expect(subscriber).toBeDefined();
      getDetailsSpy = jest.spyOn(subscriber.gitSyncConfigsUtilService, 'getDetails');
    });

    afterEach(() => {
      getDetailsSpy.mockRestore();
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60000);

    it('should return every granted app without per-app afterLoad hydration', async () => {
      const permissions = await repository.getAllGranularPermissions(
        { groupId },
        organizationId,
        getDefaultDataSource().manager
      );

      const appPermission = permissions.find((p) => p.type === ResourceType.APP);
      expect(appPermission?.appsGroupPermissions?.groupApps).toHaveLength(GRANTED_APP_COUNT);
      expect(appPermission?.appsGroupPermissions?.groupApps[0].app).toMatchObject({ id: expect.any(String) });
      expect(getDetailsSpy).not.toHaveBeenCalled();
    });
  });
});
