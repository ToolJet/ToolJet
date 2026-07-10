import { INestApplication } from '@nestjs/common';
import { BranchingBusinessUtil } from '@ee/app-git/shared/branching-business.util';
import { AppGitFileOperationsUtil } from '@ee/app-git/shared/app-git-file-operations.util';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion, updateEntity, getDefaultDataSource } from 'test-helper';

/** @group platform */
describe('BranchingBusinessUtil.orchestrateBranchingPull — workflow rename handling', () => {
  let app: INestApplication;
  let branchingBusinessUtil: BranchingBusinessUtil;
  let fileOpsUtil: AppGitFileOperationsUtil;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    branchingBusinessUtil = app.get(BranchingBusinessUtil);
    fileOpsUtil = app.get(AppGitFileOperationsUtil);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should write a git-detected workflow rename to app_versions.app_name, not apps.name', async () => {
    const admin = await createAdmin(app, 'branching-rename-admin@tooljet.io');
    const workflowApp = await createApplication(app, {
      user: { ...admin.user, organizationId: admin.workspace.id } as any,
      type: 'workflow',
    });
    const version = await createApplicationVersion(app, workflowApp as any);
    await updateEntity(AppVersion, version.id, { appName: 'Old Workflow Name' });

    // Re-fetch the raw row so co_relation_id (DB-generated on insert) is populated --
    // createApplication's in-memory return value doesn't carry it.
    const persistedApp = await getDefaultDataSource().getRepository(App).findOne({ where: { id: workflowApp.id } });

    // Short-circuit the file-system-dependent parts of the pull -- this test only
    // asserts on the rename-detection/write-back step, not the full pull pipeline.
    jest
      .spyOn(fileOpsUtil, 'resolvedAppName')
      .mockReturnValue({ resolvedAppName: 'New Workflow Name', folderName: null });
    const stopSentinel = new Error('stop-after-rename-write');
    jest.spyOn(fileOpsUtil, 'readAppFromDistributedStructure').mockRejectedValue(stopSentinel);

    persistedApp.name = null; // matches production: apps.name is always null post-migration

    await expect(
      branchingBusinessUtil.orchestrateBranchingPull(
        admin.user as any,
        persistedApp as any,
        { gitAppName: 'New Workflow Name', gitVersionName: 'v1', gitBranchName: 'definitely-nonexistent-branch-xyz' } as any,
        workflowApp.id,
        '/tmp/branching-business-util-workflow-rename-test',
        admin.workspace.id
      )
    ).rejects.toThrow(stopSentinel);

    const updatedVersion = await getDefaultDataSource().getRepository(AppVersion).findOne({ where: { id: version.id } });
    expect(updatedVersion.appName).toBe('New Workflow Name');

    const rawApp = await getDefaultDataSource().getRepository(App).findOne({ where: { id: workflowApp.id } });
    expect(rawApp.name).toBeNull(); // must NOT have written to apps.name
  });
});
