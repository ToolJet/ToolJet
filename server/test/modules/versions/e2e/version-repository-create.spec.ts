import { INestApplication } from '@nestjs/common';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { AppsSubscriber } from '@modules/apps/subscribers/apps.subscriber';
import { VersionRepository } from '@modules/versions/repository';
import {
  closeTestApp,
  createAdmin,
  createApplication,
  findEntityOrFail,
  initTestApp,
  resolveOrSeedDefaultBranch,
} from 'test-helper';

/** @group platform */
describe('VersionRepository.createOne', () => {
  let app: INestApplication;
  let repository: VersionRepository;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    repository = app.get(VersionRepository);
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it.each([APP_TYPES.FRONT_END, APP_TYPES.MODULE, APP_TYPES.WORKFLOW])(
    'should create a %s version without hydrating the parent app',
    async (type) => {
      const admin = await createAdmin(app, `version-${type}@orchard.example`);
      const application = await createApplication(app, {
        name: 'Orchard inventory',
        user: Object.assign(admin.user, { organizationId: admin.workspace.id }),
        type,
      });
      const environment = await findEntityOrFail(AppEnvironment, { organizationId: admin.workspace.id, priority: 1 });
      const branch = await resolveOrSeedDefaultBranch(admin.workspace.id);
      const hydration = jest.spyOn(app.get(AppsSubscriber), 'afterLoad').mockImplementation(async () => {
        throw new Error('A type-only lookup must not load app editor state');
      });

      const version = await repository.createOne('v1', application.id, environment.id, {}, undefined, branch.id, {
        appName: application.name,
        slug: application.id,
        isPublic: false,
      });

      expect(hydration).not.toHaveBeenCalled();
      hydration.mockRestore();
      const persisted = await findEntityOrFail(AppVersion, { id: version.id });
      expect(persisted).toMatchObject({
        appId: application.id,
        branchId: branch.id,
        currentEnvironmentId: environment.id,
        appName: 'Orchard inventory',
        status: AppVersionStatus.DRAFT,
        moduleReferenceId: type === APP_TYPES.MODULE ? expect.any(String) : null,
      });
    }
  );
});
