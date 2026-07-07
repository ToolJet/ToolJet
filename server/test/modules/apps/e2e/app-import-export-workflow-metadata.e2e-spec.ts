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
import { createAdmin, ensureAppEnvironments } from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { getDefaultDataSource } from 'test-helper';

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
});
