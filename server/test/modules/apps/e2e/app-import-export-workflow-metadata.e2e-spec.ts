import { INestApplication } from '@nestjs/common';
// The test app boots with edition: 'ee', so the DI container registers the EE
// subclass (server/ee/apps/services/app-import-export.service.ts) as the
// AppImportExportService provider — a different class reference than the CE
// base class. app.get() matches by class-reference identity, so we must import
// the same class reference the container actually instantiated. The EE
// subclass overrides createImportedAppForUser (the method under test), so this
// exercises the EE override, not the CE base method.
import { AppImportExportService } from '@ee/apps/services/app-import-export.service';
import { AppsUtilService } from '@ee/apps/util.service';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, ensureAppEnvironments, findEntityOrFail } from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { getDefaultDataSource } from 'test-helper';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { v4 as uuidv4 } from 'uuid';

/** @group platform */
describe('App import/export — workflow metadata unification', () => {
  let app: INestApplication;
  let importExportService: AppImportExportService;
  let appsUtilService: AppsUtilService;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    importExportService = app.get(AppImportExportService);
    appsUtilService = app.get(AppsUtilService);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should stage __importMetadata for a workflow during createImportedAppForUser', async () => {
    const admin = await createAdmin(app, 'import-export-admin@tooljet.io');
    const ds = getDefaultDataSource();

    const importedApp = await ds.transaction((manager) =>
      importExportService.createImportedAppForUser(
        manager,
        { type: APP_TYPES.WORKFLOW, name: 'Imported Workflow', icon: 'import-icon.svg', isPublic: true },
        { ...admin.user, organizationId: admin.workspace.id } as any
      )
    );

    expect(importedApp.name).toBeNull();
    expect((importedApp as any).__importMetadata).toMatchObject({
      appName: 'Imported Workflow',
      icon: 'import-icon.svg',
      isPublic: true,
    });
  });

  it('should round-trip a workflow through export then import with matching metadata', async () => {
    const admin = await createAdmin(app, 'import-export-admin-2@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const ds = getDefaultDataSource();
    // createAdmin creates the org via a bare repository.save, bypassing the
    // production signup flow that auto-seeds AppEnvironment rows — needed by
    // AppsUtilService.create's AppEnvironmentUtilService.get lookup.
    await ensureAppEnvironments(app, admin.workspace.id);

    const created = await ds.transaction((manager) =>
      appsUtilService.create('Round Trip Workflow', orgUser, APP_TYPES.WORKFLOW, false, manager, undefined, 'rt-icon.svg')
    );

    // export() resolves to { appV2: App } (single exported app), not { app: App[] }
    // as an earlier draft of this test assumed — corrected against the actual
    // AppImportExportService.export() signature.
    const exported = await importExportService.export(orgUser, created.id);
    expect(exported.appV2).toMatchObject({ name: 'Round Trip Workflow', icon: 'rt-icon.svg' });
    // Per-version rows should NOT duplicate the metadata (matches front-end/module shape).
    for (const v of (exported.appV2 as any).appVersions ?? []) {
      expect(v.appName).toBeUndefined();
      expect(v.slug).toBeUndefined();
    }
  });

  // Covers the resolved design decision this whole __importMetadata.slug mechanism exists
  // for: a git-sync workflow re-import must keep its slug identity across pulls instead of
  // minting a fresh one every time. Exercises both halves of the mechanism end-to-end:
  // (1) EE's createImportedAppForUser stages appParams.slug into __importMetadata.slug only
  //     when isWorkflow && isGitApp; (2) the CE base's createAppVersionsForImportedApp reads
  //     it back via resolvedSlug = appVersion.slug ?? importMeta?.slug ?? uuid() and writes it
  //     onto the real app_versions row.
  it('preserves a git-sync workflow slug across import via __importMetadata.slug', async () => {
    const admin = await createAdmin(app, 'import-export-admin-3@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const ds = getDefaultDataSource();
    await ensureAppEnvironments(app, admin.workspace.id);

    const appParams = {
      type: APP_TYPES.WORKFLOW,
      name: 'Git Workflow',
      slug: 'my-git-tracked-slug',
    };

    const importedApp = await ds.transaction((manager) =>
      importExportService.createImportedAppForUser(manager, appParams, orgUser, /* isGitApp */ true)
    );

    // Staging half: the git-sync slug is captured on __importMetadata, not written
    // directly to apps.slug (which stays null per the metadata-lives-on-app_versions
    // invariant this migration establishes).
    expect(importedApp.slug).toBeNull();
    expect((importedApp as any).__importMetadata.slug).toBe('my-git-tracked-slug');

    // Resolution half: drive the staged metadata through to a real app_versions row,
    // the same way performLegacyAppImport/the wider import pipeline would.
    await ds.transaction((manager) =>
      importExportService.createAppVersionsForImportedApp(
        manager,
        orgUser,
        importedApp,
        [{ id: uuidv4(), status: AppVersionStatus.DRAFT, definition: {} }] as any,
        { appVersionMapping: {}, appDefaultEnvironmentMapping: {} } as any,
        false,
        true
      )
    );

    const version = await findEntityOrFail(AppVersion, { appId: importedApp.id });
    expect(version.slug).toBe('my-git-tracked-slug');
  });

  it('does NOT preserve appParams.slug for a non-git-sync workflow import (gating check)', async () => {
    const admin = await createAdmin(app, 'import-export-admin-4@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const ds = getDefaultDataSource();
    await ensureAppEnvironments(app, admin.workspace.id);

    const appParams = {
      type: APP_TYPES.WORKFLOW,
      name: 'Non Git Workflow',
      slug: 'should-not-be-preserved',
    };

    // isGitApp omitted (defaults to false) — proves the `isGitApp &&` gate matters, not
    // just that a slug value happens to flow through unconditionally.
    const importedApp = await ds.transaction((manager) =>
      importExportService.createImportedAppForUser(manager, appParams, orgUser)
    );

    expect((importedApp as any).__importMetadata.slug).toBeNull();
  });
});
