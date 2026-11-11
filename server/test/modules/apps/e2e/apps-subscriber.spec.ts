import { INestApplication } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';
import { findEntityOrFail, getDefaultDataSource } from 'test-helper';
import { AppsSubscriber } from '@modules/apps/subscribers/apps.subscriber';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';

/** @group platform */
describe('AppsSubscriber', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('afterInsert', () => {
    it('should NOT auto-fill apps.slug for a newly inserted workflow app', async () => {
      const admin = await createAdmin(app, 'subscriber-admin@tooljet.io');
      const workflow = await createApplication(app, {
        name: 'No Auto Slug Workflow',
        user: { ...admin.user, organizationId: admin.workspace.id } as any,
        type: 'workflow',
      });

      const reloaded = await findEntityOrFail(App, { id: workflow.id });
      expect(reloaded.slug).toBeNull();
    });
  });

  // Regression: afterLoad opened fresh pooled connections (getDetails transaction + AppVersion
  // lookup) while the loading query still held its own, once per loaded App and in parallel —
  // enough to exhaust the pool when one query loaded many Apps. It now reads on the loading
  // query's own manager (TypeORM's LoadEvent.manager, bound to that connection).
  describe('afterLoad', () => {
    let getDetailsSpy: jest.SpyInstance;

    beforeEach(() => {
      const subscriber = getDefaultDataSource().subscribers.find((s) => s instanceof AppsSubscriber) as unknown as {
        gitSyncConfigsUtilService: GitSyncConfigsUtilService;
      };
      expect(subscriber).toBeDefined();
      getDetailsSpy = jest.spyOn(subscriber.gitSyncConfigsUtilService, 'getDetails');
    });

    afterEach(() => {
      getDetailsSpy.mockRestore();
    });

    it('should hydrate editingVersion using the loading query manager for git-sync detection', async () => {
      const admin = await createAdmin(app, 'subscriber-afterload@tooljet.io');
      const frontEndApp = (await createApplication(app, {
        name: 'Afterload Manager App',
        user: admin.user,
      })) as App & { organizationId: string };
      const version = await createApplicationVersion(app, frontEndApp);

      const loaded = await getDefaultDataSource()
        .getRepository(App)
        .findOne({ where: { id: frontEndApp.id } });

      expect(getDetailsSpy).toHaveBeenCalledWith(frontEndApp.organizationId, undefined, {
        manager: expect.objectContaining({ queryRunner: expect.anything() }),
      });
      expect(loaded).toMatchObject({ isStub: false, editingVersion: { id: version.id } });
    });
  });
});
