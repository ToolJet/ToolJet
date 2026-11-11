import { BadRequestException, INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  createApplicationVersion,
  createWorkflowDataQuery,
  updateEntity,
  getDefaultDataSource,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { DRAFT_SENTINEL } from '@modules/versions/ref-sentinels';
import { VersionUtilService } from '@modules/versions/util.service';
import { AppsUtilService } from '@modules/apps/util.service';

/**
 * A workflow blocked by its nested workflows gets the structured error the editor shows as a
 * dialog. Anything else keeps the plain error only.
 *
 * @group workflows
 */
describe('Nested workflow pin gates', () => {
  let nestApp: INestApplication;
  let service: VersionUtilService;
  let appsUtilService: AppsUtilService;
  let user: { id: string; organizationId: string };
  let defaultBranchId: string;
  let workflowDataSource: DataSourceEntity;

  const seedVersion = async (name: string, type: string, status = AppVersionStatus.DRAFT) => {
    const app = await createApplication(nestApp, { name, user, type });
    const version = await createApplicationVersion(nestApp, app as App & { organizationId: string });
    await updateEntity(AppVersion, version.id, {
      name: 'v1',
      branchId: defaultBranchId,
      status,
      versionType: AppVersionType.VERSION,
      isStub: false,
      appName: name,
    });
    await updateEntity(App, app.id, { co_relation_id: uuidv4() });
    const { co_relation_id } = await getDefaultDataSource().getRepository(App).findOneByOrFail({ id: app.id });
    return { app, version, coRelationId: co_relation_id };
  };

  const seedConsumer = async (type: string, pin: string | null, nestedStatus: AppVersionStatus, released = false) => {
    const { version } = await seedVersion(`${type} consumer ${uuidv4()}`, type);
    for (const name of ['Nested A', 'Nested B']) {
      const nested = await seedVersion(name, APP_TYPES.WORKFLOW, nestedStatus);
      if (released) await updateEntity(App, nested.app.id, { currentVersionId: nested.version.id });
      await createWorkflowDataQuery(nestApp, version, workflowDataSource, {
        name: `call-${name}-${uuidv4()}`,
        options: { workflowId: nested.coRelationId, workflowVersionId: pin },
      });
    }
    return version;
  };

  const responseMessage = async (run: () => Promise<void>) => {
    const thrown = await run().catch((error) => error);
    expect(thrown).toBeInstanceOf(BadRequestException);
    return (thrown.getResponse() as { message: Record<string, unknown> }).message;
  };

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
    service = nestApp.get(VersionUtilService, { strict: false });
    appsUtilService = nestApp.get(AppsUtilService, { strict: false });
  });

  beforeEach(async () => {
    ({ user } = await createUser(nestApp, {
      email: `pin-gates-${uuidv4()}@tooljet.com`,
      organizationName: `Pin gates ${uuidv4()}`,
    }));
    const dataSource = getDefaultDataSource();
    const branchRepo = dataSource.getRepository(WorkspaceBranch);
    const branch =
      (await branchRepo.findOneBy({ organizationId: user.organizationId, isDefault: true })) ??
      (await branchRepo.save(
        branchRepo.create({ organizationId: user.organizationId, name: 'main', isDefault: true })
      ));
    defaultBranchId = branch.id;
    for (const target of [service, appsUtilService]) {
      jest
        .spyOn(target['gitSyncConfigsUtilService'], 'getDetails')
        .mockResolvedValue({ options: { defaultBranch: { id: defaultBranchId } } } as never);
    }

    const dataSourceRepo = dataSource.getRepository(DataSourceEntity);
    workflowDataSource = await dataSourceRepo.save(
      dataSourceRepo.create({
        id: uuidv4(),
        name: 'workflows',
        kind: 'workflows',
        type: 'default',
        scope: 'global',
        appVersionId: null,
        organizationId: user.organizationId,
      })
    );
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('lists draft-pinned nested workflows once when saving a workflow', async () => {
    const parent = await seedConsumer(APP_TYPES.WORKFLOW, DRAFT_SENTINEL, AppVersionStatus.DRAFT);

    const message = await responseMessage(() =>
      service.checkDraftWorkflowsInApp(parent.id, user.organizationId, getDefaultDataSource().manager)
    );

    expect(message).toMatchObject({
      code: 'NESTED_WORKFLOW_PINS_BLOCKED',
      action: 'save',
      error: expect.stringContaining('Save blocked - 2 workflows need saving.'),
    });
    expect(message.workflows).toEqual(expect.arrayContaining([{ name: 'Nested A' }, { name: 'Nested B' }]));
    expect(message.workflows).toHaveLength(2);
  });

  it('still lists a nested workflow pinned to its draft after that draft was saved', async () => {
    const parent = await seedConsumer(APP_TYPES.WORKFLOW, DRAFT_SENTINEL, AppVersionStatus.PUBLISHED);

    const message = await responseMessage(() =>
      service.checkDraftWorkflowsInApp(parent.id, user.organizationId, getDefaultDataSource().manager)
    );

    expect(message).toMatchObject({ code: 'NESTED_WORKFLOW_PINS_BLOCKED', action: 'save' });
    expect(message.workflows).toHaveLength(2);
  });

  it('keeps only the plain error when saving an app', async () => {
    const parent = await seedConsumer(APP_TYPES.FRONT_END, DRAFT_SENTINEL, AppVersionStatus.DRAFT);

    const message = await responseMessage(() =>
      service.checkDraftWorkflowsInApp(parent.id, user.organizationId, getDefaultDataSource().manager)
    );

    expect(message.error).toEqual(expect.stringContaining('Save blocked'));
    expect(message).not.toHaveProperty('code');
  });

  it('lists not-promoted nested workflows with their versions when promoting a workflow', async () => {
    const parent = await seedConsumer(APP_TYPES.WORKFLOW, 'v1', AppVersionStatus.PUBLISHED);

    const message = await responseMessage(() =>
      service.checkWorkflowsPromotableToEnvironment(
        parent.id,
        'production',
        99,
        user.organizationId,
        getDefaultDataSource().manager
      )
    );

    expect(message).toMatchObject({
      code: 'NESTED_WORKFLOW_PINS_BLOCKED',
      action: 'promote',
      environment: 'production',
    });
    expect(message.workflows).toEqual(
      expect.arrayContaining([
        { name: 'Nested A', versionName: 'v1' },
        { name: 'Nested B', versionName: 'v1' },
      ])
    );
  });

  describe('on release', () => {
    const checkReleased = (versionId: string) =>
      appsUtilService.checkWorkflowsReleasedInApp(versionId, user.organizationId, getDefaultDataSource().manager);

    it('lists pinned nested workflows that are not released when releasing a workflow', async () => {
      const parent = await seedConsumer(APP_TYPES.WORKFLOW, 'v1', AppVersionStatus.PUBLISHED);

      const message = await responseMessage(() => checkReleased(parent.id));

      expect(message).toMatchObject({ code: 'NESTED_WORKFLOW_PINS_BLOCKED', action: 'release' });
      expect(message.workflows).toEqual(
        expect.arrayContaining([
          { name: 'Nested A', versionName: 'v1' },
          { name: 'Nested B', versionName: 'v1' },
        ])
      );
    });

    it('blocks an app with the plain error only', async () => {
      const parent = await seedConsumer(APP_TYPES.FRONT_END, 'v1', AppVersionStatus.PUBLISHED);

      const message = await responseMessage(() => checkReleased(parent.id));

      expect(message.error).toEqual(expect.stringContaining('Release blocked - 2 workflows need attention.'));
      expect(message).not.toHaveProperty('code');
    });

    it('allows pins released at that version', async () => {
      const parent = await seedConsumer(APP_TYPES.FRONT_END, 'v1', AppVersionStatus.PUBLISHED, true);

      await expect(checkReleased(parent.id)).resolves.toBeUndefined();
    });

    it('allows unpinned queries', async () => {
      const parent = await seedConsumer(APP_TYPES.FRONT_END, null, AppVersionStatus.PUBLISHED);

      await expect(checkReleased(parent.id)).resolves.toBeUndefined();
    });
  });
});
