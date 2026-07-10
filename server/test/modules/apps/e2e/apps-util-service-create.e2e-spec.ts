import { INestApplication } from '@nestjs/common';
// The test app boots with edition: 'ee', so the DI container registers the EE
// subclass (server/ee/apps/util.service.ts) as the AppsUtilService provider —
// a different class reference than the CE base class. app.get() matches by
// class-reference identity, so we must import the same class reference the
// container actually instantiated (mirrors how ee/apps/service.ts itself
// resolves AppsUtilService via a relative import). The EE subclass does not
// override create(), so this still exercises the CE create() logic under test.
import { AppsUtilService } from '@ee/apps/util.service';
import { VersionRepository } from '@modules/versions/repository';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, ensureAppEnvironments } from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { getDefaultDataSource } from 'test-helper';

/** @group platform */
describe('AppsUtilService.create — workflow metadata routing', () => {
  let app: INestApplication;
  let appsUtilService: AppsUtilService;
  let versionRepository: VersionRepository;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    appsUtilService = app.get(AppsUtilService);
    versionRepository = app.get(VersionRepository);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should write name/icon onto the AppVersion, not the App, for a new workflow', async () => {
    const admin = await createAdmin(app, 'create-workflow-admin@tooljet.io');
    // createAdmin/createUser create the org via a bare repository.save, bypassing
    // the production signup flow that auto-seeds AppEnvironment rows — calling
    // AppsUtilService.create directly (skipping the app-creation HTTP endpoint)
    // needs them seeded explicitly, same as createApplication() does internally.
    await ensureAppEnvironments(app, admin.workspace.id);
    const ds = getDefaultDataSource();

    const createdApp = await ds.transaction(async (manager) => {
      return appsUtilService.create(
        'My New Workflow',
        { ...admin.user, organizationId: admin.workspace.id } as any,
        APP_TYPES.WORKFLOW,
        false,
        manager,
        undefined,
        'workflow-icon.svg'
      );
    });

    expect(createdApp.name).toBeNull();
    expect(createdApp.icon).toBeUndefined();

    const versions = await versionRepository.find({ where: { appId: createdApp.id } });
    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({
      appName: 'My New Workflow',
      slug: createdApp.id,
      icon: 'workflow-icon.svg',
      isPublic: false,
    });
  });
});
