import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  resetDB,
  createUser,
  createApplication,
  createApplicationVersion,
  createDataSource,
  createDataQuery,
  updateEntity,
  saveEntity,
} from 'test-helper';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Component } from '@entities/component.entity';

/**
 * DataQueryRepository.findPublicParentAppForModuleQuery — regression test for the guard's
 * module -> public-parent-app fallback (QueryAuthGuard), which 401s a module's query even
 * when the parent app embedding it is genuinely public.
 *
 * Root cause: the parent app's is_public flag lives on an app_versions row, not on apps
 * (apps.is_public is never written — see AppsUtilService.update). Resolving which row is
 * canonical must match AppsRepository.resolveMetadataVersion elsewhere in the codebase:
 * the non-stub row on the default branch, is_synced DESC then updated_at DESC. Without the
 * is_stub filter, a stub row touched more recently can outrank the real one and read
 * is_public as false/null, causing the guard to reject a public app's module query.
 */
describe('DataQueryRepository.findPublicParentAppForModuleQuery', () => {
  let nestApp: INestApplication;
  let repository: DataQueryRepository;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    repository = nestApp.get<DataQueryRepository>(DataQueryRepository);
  });

  beforeEach(async () => {
    await resetDB();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  /** Wires a parent app (embedding a ModuleViewer) + module app + module query, mirroring
   * the real component/data-query graph the join traverses. Both apps must share `user` —
   * createApplication() creates its own anonymous org/user when none is passed, which
   * collides with the previous call's default org name. */
  async function setUpParentAndModule(
    user: Parameters<typeof createApplication>[1]['user'],
    {
      canonicalVersionIsPublic,
      addLaterTouchedStub,
    }: { canonicalVersionIsPublic: boolean; addLaterTouchedStub: boolean }
  ) {
    const parentApp = await createApplication(nestApp, {
      name: 'parent',
      isPublic: canonicalVersionIsPublic,
      user,
    } as any);
    const canonicalVersion = await createApplicationVersion(nestApp, parentApp as App & { organizationId: string });
    await updateEntity(AppVersion, canonicalVersion.id, {
      isPublic: canonicalVersionIsPublic,
      isSynced: true,
      isStub: false,
      updatedAt: new Date(Date.now() - 60_000),
    });

    if (addLaterTouchedStub) {
      // A stub row on the same branch, touched after the canonical row, with the opposite
      // is_public — reproduces the exact ordering conflict the fix guards against.
      await saveEntity(AppVersion, {
        appId: parentApp.id,
        name: `stub-${Date.now()}`,
        branchId: canonicalVersion.branchId,
        appName: parentApp.name,
        slug: `stub-${Date.now()}`,
        isStub: true,
        isSynced: false,
        isPublic: !canonicalVersionIsPublic,
        updatedAt: new Date(),
        definition: null,
        globalSettings: {},
        pageSettings: {},
        showViewerNavigation: true,
        currentEnvironmentId: canonicalVersion.currentEnvironmentId,
      } as any);
    }

    await updateEntity(App, parentApp.id, { currentVersionId: canonicalVersion.id });

    const moduleApp = await createApplication(nestApp, { name: 'module', type: 'module', user } as any);
    await updateEntity(App, moduleApp.id, { co_relation_id: moduleApp.id });
    const moduleVersion = await createApplicationVersion(nestApp, moduleApp as App & { organizationId: string });

    await saveEntity(Component, {
      pageId: canonicalVersion.homePageId,
      name: 'module1',
      type: 'ModuleViewer',
      properties: { moduleAppId: { value: moduleApp.id }, moduleVersionId: { value: '' } },
      styles: {},
      validation: {},
    } as any);

    const dataSource = await createDataSource(nestApp, {
      appVersion: moduleVersion,
      name: 'ds',
      kind: 'restapi',
    } as any);
    const dataQuery = await createDataQuery(nestApp, { dataSource, appVersion: moduleVersion, options: {} } as any);

    return { moduleApp, dataQuery };
  }

  it('finds the public parent app when the canonical version row is public, ignoring a later-touched stub row', async () => {
    const { user } = await createUser(nestApp, { email: 'module-guard-canonical-public@tooljet.io' });
    const { moduleApp, dataQuery } = await setUpParentAndModule(user, {
      canonicalVersionIsPublic: true,
      addLaterTouchedStub: true,
    });

    const result = await repository.findPublicParentAppForModuleQuery(moduleApp.id, dataQuery.id);

    expect(result).not.toBeNull();
  });

  it('returns null when the canonical version row is not public, even with a later-touched public stub row', async () => {
    const { user } = await createUser(nestApp, { email: 'module-guard-canonical-private@tooljet.io' });
    const { moduleApp, dataQuery } = await setUpParentAndModule(user, {
      canonicalVersionIsPublic: false,
      addLaterTouchedStub: true,
    });

    const result = await repository.findPublicParentAppForModuleQuery(moduleApp.id, dataQuery.id);

    expect(result).toBeNull();
  });
});
