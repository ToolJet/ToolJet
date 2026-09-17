import * as fs from 'fs';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createUser, initTestApp, closeTestApp, saveEntity, findEntity, getEntityRepository } from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { AppImportExportService } from '@ee/apps/services/app-import-export.service';
import { APP_TYPES } from '@modules/apps/constants';
import { resolveModuleRef } from '@modules/versions/module-ref.util';

/**
 * Regression: importing two file-exported apps that share the same module into a
 * git-enabled workspace, each onto its own feature branch.
 *
 * The module is deduped (correctly — one App per identity), but the SECOND consumer's
 * branch was left with only an empty `is_stub:true` row for the module. On app-open the
 * module then resolved to that stub and the client attempted a git hydration
 * (hydrateStubApp) — which fails because a file-imported module was never pushed to git,
 * surfacing as a module "hydration error".
 *
 * Fixed by materializing the reused module's real content on the consumer's branch
 * during the (non-git) import, exactly like the create-path does for a brand-new module.
 */
/** @group platform */
describe('Module import — reused module hydrates on a second feature branch', () => {
  let nestApp: INestApplication;
  let importService: AppImportExportService;

  const app1Def = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'common-app-1.json'), 'utf-8'));
  const app2Def = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'common-app-2.json'), 'utf-8'));
  const MODULE_NAME = 'common-module-1';

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

  async function createFeatureBranch(orgId: string, name: string): Promise<WorkspaceBranch> {
    return saveEntity(WorkspaceBranch, {
      organizationId: orgId,
      name,
      isDefault: false,
    } as any);
  }

  async function importAppOnBranch(orgId: string, user: any, fixture: any, appName: string, branchId: string) {
    user.organizationId = orgId;
    // Deep-clone: import() rewrites component properties (moduleAppId/moduleVersionId) IN
    // PLACE, so passing the shared module-scope fixture would leak a rewritten pin into the
    // next import. Production parses fresh JSON per request, so this only matters for tests.
    const definition = JSON.parse(JSON.stringify(fixture.app[0].definition));
    return importService.import(
      user,
      definition,
      appName,
      {},
      false, // isGitApp — device/file import
      fixture.tooljet_version ?? '3.0.0',
      false, // cloning
      undefined,
      branchId
    );
  }

  it('materializes the shared module as a non-stub DRAFT on the second consumer branch', async () => {
    const adminData = await createUser(nestApp, {
      email: `mibh-admin-${Date.now()}@tooljet.io`,
      groups: ['all_users', 'admin'],
    });
    const org = adminData.organization;
    const user = adminData.user;

    await enableGitSync(org.id);
    const branchA = await createFeatureBranch(org.id, `feat-a-${uuidv4().slice(0, 8)}`);
    const branchB = await createFeatureBranch(org.id, `feat-b-${uuidv4().slice(0, 8)}`);

    // App A on feature branch A → creates the module fresh with content on branch A.
    await importAppOnBranch(org.id, user, app1Def, 'Common-app-1', branchA.id);

    // App B on feature branch B → reuses the same module, which has no content on B yet.
    const importB = await importAppOnBranch(org.id, user, app2Def, 'Common-app-2', branchB.id);
    const consumerBId = importB.newApp.id;

    // Exactly one module App exists (deduped, not duplicated).
    const moduleApps = await getEntityRepository(App)
      .createQueryBuilder('app')
      .innerJoin(AppVersion, 'av', 'av.app_id = app.id')
      .where('app.organization_id = :orgId', { orgId: org.id })
      .andWhere('app.type = :type', { type: APP_TYPES.MODULE })
      .andWhere('av.app_name = :name', { name: MODULE_NAME })
      .distinct(true)
      .getMany();
    expect(moduleApps).toHaveLength(1);
    const moduleAppId = moduleApps[0].id;

    // The module must have REAL (non-stub) content on BOTH consumer branches.
    const branchARow = await findEntity(AppVersion, { appId: moduleAppId, branchId: branchA.id, isStub: false });
    const branchBRow = await findEntity(AppVersion, { appId: moduleAppId, branchId: branchB.id, isStub: false });

    expect(branchARow).toBeTruthy();
    expect(branchBRow).toBeTruthy();

    // And there must be no lingering empty stub for the module on branch B (which is what
    // triggered the git hydration attempt before the fix).
    const stubOnB = await findEntity(AppVersion, { appId: moduleAppId, branchId: branchB.id, isStub: true });
    expect(stubOnB).toBeNull();

    // Consumer B's ModuleViewer pin (moduleVersionId) must resolve to a real version for a
    // viewer on branch B — this is exactly what GET /module/by-correlation/:coRel/version
    // does. A null here is the "Module version not found" 404: the pin was rewritten to a
    // module_reference_id that doesn't exist on the consumer's branch or default.
    const viewerB = await getEntityRepository(Component)
      .createQueryBuilder('c')
      .innerJoin(Page, 'p', 'p.id = c.page_id')
      .innerJoin(AppVersion, 'av', 'av.id = p.app_version_id')
      .where('av.app_id = :appId', { appId: consumerBId })
      .andWhere('av.branch_id = :branchId', { branchId: branchB.id })
      .andWhere("c.type = 'ModuleViewer'")
      .getOne();
    expect(viewerB).toBeTruthy();
    const pinB = (viewerB.properties as any).moduleVersionId?.value;

    const manager = getEntityRepository(App).manager;
    const moduleApp = moduleApps[0];
    const resolvedB = await resolveModuleRef(manager, moduleApp, pinB, branchB.id, org.id, true);
    expect(resolvedB).toBeTruthy();
    expect(resolvedB.branchId).toBe(branchB.id);

    // Defense in depth: even an ORPHANED pin (a stale UUID matching no module version —
    // e.g. a pin left over from an import that predates the fixes, the state the user hit)
    // must still resolve to the module's row on the consumer's feature branch, not 404. This
    // mirrors the app-load resolver so the embed never renders empty while the app shows it.
    const orphanResolved = await resolveModuleRef(manager, moduleApp, uuidv4(), branchB.id, org.id, true);
    expect(orphanResolved).toBeTruthy();
    expect(orphanResolved.branchId).toBe(branchB.id);
  });

  it("resolves the module pin on a feature-branch consumer when the module's other copy lives on the default branch", async () => {
    const adminData = await createUser(nestApp, {
      email: `mibh-def-${Date.now()}@tooljet.io`,
      groups: ['all_users', 'admin'],
    });
    const org = adminData.organization;
    const user = adminData.user;

    await enableGitSync(org.id);
    const defaultBranch = await getEntityRepository(WorkspaceBranch).findOne({
      where: { organizationId: org.id, isDefault: true },
    });
    const branchB = await createFeatureBranch(org.id, `feat-def-b-${uuidv4().slice(0, 8)}`);

    // App A on the DEFAULT branch → the module's version lands there as a synced DRAFT
    // (git-native, not PUBLISHED). App B on a feature branch → reuses the module, which is
    // materialized onto branch B with its own module_reference_id.
    await importAppOnBranch(org.id, user, app1Def, 'Common-app-1', defaultBranch.id);
    const importB = await importAppOnBranch(org.id, user, app2Def, 'Common-app-2', branchB.id);
    const consumerBId = importB.newApp.id;

    const moduleApps = await getEntityRepository(App)
      .createQueryBuilder('app')
      .innerJoin(AppVersion, 'av', 'av.app_id = app.id')
      .where('app.organization_id = :orgId', { orgId: org.id })
      .andWhere('app.type = :type', { type: APP_TYPES.MODULE })
      .andWhere('av.app_name = :name', { name: MODULE_NAME })
      .distinct(true)
      .getMany();
    expect(moduleApps).toHaveLength(1);

    const viewerB = await getEntityRepository(Component)
      .createQueryBuilder('c')
      .innerJoin(Page, 'p', 'p.id = c.page_id')
      .innerJoin(AppVersion, 'av', 'av.id = p.app_version_id')
      .where('av.app_id = :appId', { appId: consumerBId })
      .andWhere('av.branch_id = :branchId', { branchId: branchB.id })
      .andWhere("c.type = 'ModuleViewer'")
      .getOne();
    expect(viewerB).toBeTruthy();
    const pinB = (viewerB.properties as any).moduleVersionId?.value;

    // This is the "Module version not found" case: the pin must resolve to the module row on
    // branch B, NOT the default-branch synced DRAFT (which resolveModuleRef refuses to serve
    // for a UUID pin because it isn't PUBLISHED and isn't on the consumer's branch).
    const resolvedB = await resolveModuleRef(
      getEntityRepository(App).manager,
      moduleApps[0],
      pinB,
      branchB.id,
      org.id,
      true
    );
    expect(resolvedB).toBeTruthy();
    expect(resolvedB.branchId).toBe(branchB.id);
  });
});
