import * as fs from 'fs';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createUser, initTestApp, closeTestApp, saveEntity, findEntity, getEntityRepository } from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { AppImportExportService } from '@ee/apps/services/app-import-export.service';
import { APP_TYPES } from '@modules/apps/constants';
import { Component } from '@entities/component.entity';
import { Page } from '@entities/page.entity';
import { resolveModuleRef } from '@modules/versions/module-ref.util';

/**
 * Regression: an app (with a module) exists before multi-branching, is exported and deleted,
 * then multi-branching is enabled and the export is imported onto a new feature branch.
 * Branch creation stubs git-backed apps/modules onto the branch (pullModules/pullApps), so the
 * import meets `is_stub` rows sharing app_name — which used to surface as a raw "Already exists!".
 */
/** @group platform */
describe('App import — exported-then-deleted app onto a new feature branch', () => {
  let nestApp: INestApplication;
  let importService: AppImportExportService;

  const appDef = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'common-app-1.json'), 'utf-8'));
  const APP_NAME = 'Common-app-1';

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    importService = nestApp.get(AppImportExportService, { strict: false });
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  async function enableGitSync(orgId: string) {
    const orgGitSync = await saveEntity(OrganizationGitSync, {
      organizationId: orgId,
      autoCommit: false,
      isBranchingEnabled: true,
    });
    await saveEntity(OrganizationGitHttps, {
      configId: orgGitSync.id,
      httpsUrl: 'https://github.com/tooljet-test/e2e-fixture',
      githubBranch: 'main',
      githubAppId: 'test-app-id',
      githubInstallationId: 'test-installation-id',
      githubPrivateKey: 'dummy-key-not-dereferenced-in-this-test',
      isEnabled: true,
      isFinalized: true,
    } as any);
  }

  // Mirrors the stub row pullModules/pullApps write when a branch is created from git.
  function saveBranchStub(appId: string, branchId: string, appName: string, isModule: boolean) {
    return saveEntity(AppVersion, {
      name: uuidv4(),
      appId,
      branchId,
      versionType: AppVersionType.BRANCH,
      status: AppVersionStatus.DRAFT,
      isStub: true,
      definition: {},
      globalSettings: {},
      pageSettings: {},
      showViewerNavigation: false,
      moduleReferenceId: isModule ? uuidv4() : null,
      appName,
      isSynced: true,
      slug: uuidv4(),
    } as any);
  }

  function importApp(user: any, branchId?: string) {
    return importService.import(
      user,
      JSON.parse(JSON.stringify(appDef.app[0].definition)),
      APP_NAME,
      {},
      false,
      appDef.tooljet_version ?? '3.0.0',
      false,
      undefined,
      branchId
    );
  }

  // Pre-branching workspace: app imported then deleted (its module stays), then
  // multi-branching enabled and a feature branch created.
  async function setupDeletedAppAndBranch() {
    const { organization: org, user } = await createUser(nestApp, {
      email: `idafb-${uuidv4().slice(0, 8)}@tooljet.io`,
      groups: ['all_users', 'admin'],
    });
    user.organizationId = org.id;

    const original = await importApp(user);
    const deletedApp = await findEntity(App, { id: original.newApp.id });
    await getEntityRepository(App).delete({ id: deletedApp.id });

    await enableGitSync(org.id);
    const branch = await saveEntity(WorkspaceBranch, {
      organizationId: org.id,
      name: `feat-${uuidv4().slice(0, 8)}`,
      isDefault: false,
    } as any);
    const module = await getEntityRepository(App).findOneOrFail({
      where: { organizationId: org.id, type: APP_TYPES.MODULE },
    });
    return { org, user, branch, module, deletedApp };
  }

  it('keeps the git stub of the reused module and resolves the pin once it hydrates', async () => {
    const { org, user, branch, module } = await setupDeletedAppAndBranch();
    const moduleRow = await findEntity(AppVersion, { appId: module.id, isStub: false });
    // The module was pushed to git (that's why branch creation stubbed it).
    await getEntityRepository(AppVersion).update({ id: moduleRow.id }, { isSynced: true });
    const stub = await saveBranchStub(module.id, branch.id, moduleRow.appName, true);

    const result = await importApp(user, branch.id);

    expect(await findEntity(AppVersion, { appId: result.newApp.id, branchId: branch.id })).toBeTruthy();
    expect(await findEntity(AppVersion, { appId: module.id, branchId: branch.id, isStub: true })).toMatchObject({
      id: stub.id,
    });
    expect(await findEntity(AppVersion, { appId: module.id, branchId: branch.id, isStub: false })).toBeNull();

    // Simulate hydrateStubApp: stub replaced by a real row carrying a fresh module_reference_id.
    await getEntityRepository(AppVersion).delete({ id: stub.id });
    const hydrated = await saveEntity(AppVersion, {
      name: uuidv4(),
      appId: module.id,
      branchId: branch.id,
      versionType: AppVersionType.BRANCH,
      status: AppVersionStatus.DRAFT,
      isStub: false,
      definition: {},
      globalSettings: {},
      pageSettings: {},
      showViewerNavigation: false,
      moduleReferenceId: uuidv4(),
      appName: moduleRow.appName,
      isSynced: true,
      slug: uuidv4(),
    } as any);

    const viewer = await getEntityRepository(Component)
      .createQueryBuilder('c')
      .innerJoin(Page, 'p', 'p.id = c.page_id')
      .innerJoin(AppVersion, 'av', 'av.id = p.app_version_id')
      .where('av.app_id = :appId', { appId: result.newApp.id })
      .andWhere("c.type = 'ModuleViewer'")
      .getOneOrFail();
    const pin = (viewer.properties as any).moduleVersionId?.value;
    const resolved = await resolveModuleRef(getEntityRepository(App).manager, module, pin, branch.id, org.id, true);
    expect(resolved).toMatchObject({ id: hydrated.id });
  });

  it('rejects with an app-name-exists error when the deleted app is still stubbed on the branch from git', async () => {
    const { org, user, branch, deletedApp } = await setupDeletedAppAndBranch();
    const gitApp = await saveEntity(App, {
      type: APP_TYPES.FRONT_END,
      organizationId: org.id,
      userId: user.id,
      co_relation_id: deletedApp.co_relation_id,
      creationMode: 'GIT',
    } as any);
    await saveBranchStub(gitApp.id, branch.id, APP_NAME, false);

    await expect(importApp(user, branch.id)).rejects.toThrow(
      `An app named "${APP_NAME}" already exists on this branch.`
    );
  });
});
