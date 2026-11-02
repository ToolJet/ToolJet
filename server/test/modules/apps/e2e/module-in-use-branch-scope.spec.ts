import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  createApplicationVersion,
  findEntityOrFail,
  saveEntity,
  updateEntity,
  getDefaultDataSource,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { AppVersion } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { AppsUtilService } from '@modules/apps/util.service';

/**
 * The module delete-in-use guard (AppsUtilService.checkModuleInUseByApps) must match
 * the branch-scoped delete it gates.
 *
 * Deleting a module removes only the current branch's version; other branches keep
 * their copy. The guard, though, scanned every branch and read the legacy `app.name`
 * column — NULL for apps created/pulled after names moved to app_versions — then
 * dropped empty names. So whether a delete was blocked depended on the consuming
 * app's age, not on the branch: an older app on another branch blocked it (listed by
 * its stale name), while a newer app slipped through. The fix scopes the check to the
 * delete's branch and reads app_versions.app_name.
 */
/** @group platform */
describe('Module delete-in-use guard — branch scoping and current name', () => {
  let nestApp: INestApplication;
  let service: AppsUtilService;

  let defaultBranchId: string; // "master"
  let featureBranchId: string; // "edge"

  // Scenario A — consumer on the feature branch (same branch as the delete).
  let moduleUsedOnFeatureBranch: App;
  // Scenario B — consumer on the default branch only.
  let moduleUsedOnDefaultBranch: App;

  async function addModuleViewer(appVersionId: string, moduleCoRelationId: string) {
    const page = await findEntityOrFail(Page, { appVersionId } as any);
    await saveEntity(Component, {
      name: 'moduleViewer1',
      type: 'ModuleViewer',
      pageId: page.id,
      properties: { moduleAppId: { value: moduleCoRelationId }, moduleVersionId: { value: '' } },
      general: {},
      styles: {},
      generalStyles: {},
      validation: {},
    } as any);
  }

  // Creates a module (with a co_relation_id) and a consumer app whose only version
  // lives on `branchId` and embeds the module. `legacyNamed` chooses the era:
  //   false (newer app) — apps.name NULL, real name on app_versions.app_name (the
  //          case the buggy guard dropped, so its delete slipped through).
  //   true  (older app) — apps.name populated (pre name-migration), the case the
  //          buggy guard counted across every branch.
  async function seedModuleAndConsumer(
    user: (App & { organizationId: string }) | any,
    branchId: string,
    consumerName: string,
    legacyNamed: boolean
  ) {
    const coRelationId = uuidv4();
    const module = await createApplication(nestApp, {
      name: `Shared module ${uuidv4()}`,
      user,
      type: APP_TYPES.MODULE,
    });
    await updateEntity(App, module.id, { co_relation_id: coRelationId });
    module.co_relation_id = coRelationId;

    const consumer = await createApplication(nestApp, { name: consumerName, user, type: APP_TYPES.FRONT_END });
    const version = await createApplicationVersion(nestApp, consumer as App & { organizationId: string });
    await updateEntity(AppVersion, version.id, { branchId, appName: consumerName });
    // app_versions.branch_id carries a NOT-NULL app_name, so the newer-app case only
    // clears the legacy apps.name column — exactly the post-migration shape.
    if (!legacyNamed) await updateEntity(App, consumer.id, { name: null });
    await addModuleViewer(version.id, coRelationId);

    return module;
  }

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
    service = nestApp.get(AppsUtilService);

    const { user } = await createUser(nestApp, {
      email: 'branchscope@tooljet.com',
      organizationName: 'Branch scope WS',
    });

    const branchRepo = getDefaultDataSource().getRepository(WorkspaceBranch);
    // createApplicationVersion seeds the org's default branch; grab it, then add a feature branch.
    const defaultBranch =
      (await branchRepo.findOne({ where: { organizationId: user.organizationId, isDefault: true } })) ??
      (await branchRepo.save(
        branchRepo.create({ organizationId: user.organizationId, name: 'master', isDefault: true })
      ));
    defaultBranchId = defaultBranch.id;
    const featureBranch = await branchRepo.save(
      branchRepo.create({ organizationId: user.organizationId, name: 'edge', isDefault: false })
    );
    featureBranchId = featureBranch.id;

    // Newer app on the feature branch — exercises the app_versions.app_name read.
    moduleUsedOnFeatureBranch = await seedModuleAndConsumer(user, featureBranchId, 'edge-consumer-current', false);
    // Older app on the default branch — legacy apps.name set, so the old guard counted it
    // across branches; exercises the branch scoping.
    moduleUsedOnDefaultBranch = await seedModuleAndConsumer(user, defaultBranchId, 'master-consumer-old', true);
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('blocks the delete when a consumer on the SAME branch embeds the module, listing its current name', async () => {
    await expect(
      service.checkModuleInUseByApps(moduleUsedOnFeatureBranch, getDefaultDataSource().manager, featureBranchId)
    ).rejects.toThrow('edge-consumer-current');
  });

  it('does NOT block the delete when the only consumer lives on a DIFFERENT branch', async () => {
    // Deleting on the feature branch leaves the default branch's module version — and its
    // consumer — untouched, so the default-branch consumer must not block it.
    await expect(
      service.checkModuleInUseByApps(moduleUsedOnDefaultBranch, getDefaultDataSource().manager, featureBranchId)
    ).resolves.toBeUndefined();
  });

  it('still blocks the delete on the consumer’s own branch (control)', async () => {
    await expect(
      service.checkModuleInUseByApps(moduleUsedOnDefaultBranch, getDefaultDataSource().manager, defaultBranchId)
    ).rejects.toThrow('master-consumer-old');
  });
});
