/**
 * AppGitVersionService.saveVersion → createGitTagOnSave.
 *
 * Focus: when multi-branch git sync is enabled and a version is saved/published from a FEATURE
 * branch, a git tag must be created pointing at the FEATURE BRANCH HEAD (not the default branch),
 * named after the version being saved. Also guards the pre-existing skip conditions (non-publish,
 * workflow, git disabled, unsynced) so this change doesn't regress default-branch tagging.
 *
 * The DB save (versionService.update) and the remote tag call (appGitService.createGitTag) are both
 * mocked — this asserts the orchestration/branching decision, not the git transport.
 *
 * @group gitsync
 */
import { AppGitVersionService } from '@ee/app-git/services/versions.service';
import { AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';

describe('AppGitVersionService — git tag on save', () => {
  let versionService: any;
  let versionRepository: any;
  let gitSyncConfigsUtilService: any;
  let appGitService: any;
  let transactionLogger: any;
  let service: AppGitVersionService;

  const user = { organizationId: 'org-1', id: 'user-1', email: 'a@b.c', firstName: 'A', lastName: 'B' } as any;

  const buildApp = (over: Record<string, any> = {}) =>
    ({ id: 'app-1', type: APP_TYPES.FRONT_END, appVersions: [{ id: 'ver-1' }], ...over }) as any;

  const publish = (over: Record<string, any> = {}) =>
    ({ name: 'v2', status: AppVersionStatus.PUBLISHED, description: 'my description', ...over }) as any;

  beforeEach(() => {
    versionService = { update: jest.fn().mockResolvedValue(undefined) };
    // manager.findOne resolves the WORKSPACE branch a feature-branch version lives on (branch_id →
    // WorkspaceBranch). Defaults to null so tests that don't set branchId keep using version.name.
    versionRepository = { getAppVersionById: jest.fn(), manager: { findOne: jest.fn().mockResolvedValue(null) } };
    gitSyncConfigsUtilService = { getDetails: jest.fn().mockResolvedValue({ isEnabled: true }) };
    appGitService = { createGitTag: jest.fn().mockResolvedValue({ success: true }) };
    transactionLogger = { warn: jest.fn(), log: jest.fn() };
    service = new AppGitVersionService(
      versionService,
      versionRepository,
      gitSyncConfigsUtilService,
      appGitService,
      transactionLogger
    );
  });

  it('tags the FEATURE BRANCH HEAD, named after the saved version, on a branch-draft publish', async () => {
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      // app-git single-branch: the BRANCH row's own name IS the per-app git branch, and it sits on
      // the DEFAULT workspace branch — so resolution falls back to version.name (see the workspace-
      // branch case below, where the branch is non-default and version.name is an internal UUID).
      name: 'feat/login',
      branchId: 'wb-default',
      versionType: AppVersionType.BRANCH,
      isSynced: true,
    });
    versionRepository.manager.findOne.mockResolvedValue({ id: 'wb-default', name: 'main', isDefault: true });

    await service.saveVersion(buildApp(), user, publish({ name: 'v2' }));

    expect(appGitService.createGitTag).toHaveBeenCalledTimes(1);
    expect(appGitService.createGitTag).toHaveBeenCalledWith('app-1', 'ver-1', user, 'my description', {
      targetBranch: 'feat/login',
      tagVersionName: 'v2',
    });
  });

  it('targets the WORKSPACE branch name (not the UUID version.name) for a multi-branch save', async () => {
    // Multi-branch (platform-git-sync): the sub-branch draft's own name is an internal UUID; the
    // remote git branch is the non-default WORKSPACE branch it lives on. Regression test for tags
    // silently never created because getBranch(<uuid>) 404'd.
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      name: '7f3c2a10-0000-4000-8000-000000000000', // internal UUID, NOT a remote ref
      branchId: 'wb-feature',
      versionType: AppVersionType.BRANCH,
      isSynced: true,
    });
    versionRepository.manager.findOne.mockResolvedValue({ id: 'wb-feature', name: 'feat/login', isDefault: false });

    await service.saveVersion(buildApp(), user, publish({ name: 'v2' }));

    expect(versionRepository.manager.findOne).toHaveBeenCalledWith(WorkspaceBranch, {
      where: { id: 'wb-feature' },
    });
    expect(appGitService.createGitTag).toHaveBeenCalledWith('app-1', 'ver-1', user, 'my description', {
      targetBranch: 'feat/login',
      tagVersionName: 'v2',
    });
  });

  it('falls back to the branch name for the tag name when the save carries no name', async () => {
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      name: 'feat/login',
      versionType: AppVersionType.BRANCH,
      isSynced: true,
    });

    await service.saveVersion(buildApp(), user, publish({ name: undefined }));

    expect(appGitService.createGitTag).toHaveBeenCalledWith(
      'app-1',
      'ver-1',
      user,
      'my description',
      expect.objectContaining({ targetBranch: 'feat/login', tagVersionName: 'feat/login' })
    );
  });

  it('tags a default-branch (VERSION-type) save with NO branch/name override (unchanged behavior)', async () => {
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      name: 'v2',
      versionType: AppVersionType.VERSION,
      isSynced: true,
    });

    await service.saveVersion(buildApp(), user, publish({ name: 'v2', description: undefined }));

    expect(appGitService.createGitTag).toHaveBeenCalledTimes(1);
    // 4 args only — no 5th options object → provider defaults to the configured default branch.
    const call = appGitService.createGitTag.mock.calls[0];
    expect(call).toEqual(['app-1', 'ver-1', user, 'Version v2 created']);
    expect(call.length).toBe(4);
  });

  it('does NOT tag when the save is not a publish (rename / description-only edit)', async () => {
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      name: 'feat/login',
      versionType: AppVersionType.BRANCH,
      isSynced: true,
    });

    await service.saveVersion(buildApp(), user, publish({ status: AppVersionStatus.DRAFT }));

    expect(appGitService.createGitTag).not.toHaveBeenCalled();
    expect(versionRepository.getAppVersionById).not.toHaveBeenCalled();
  });

  it('does NOT tag workflows', async () => {
    await service.saveVersion(buildApp({ type: APP_TYPES.WORKFLOW }), user, publish());
    expect(appGitService.createGitTag).not.toHaveBeenCalled();
  });

  it('does NOT tag when git sync is disabled for the workspace', async () => {
    gitSyncConfigsUtilService.getDetails.mockResolvedValue({ isEnabled: false });
    await service.saveVersion(buildApp(), user, publish());
    expect(appGitService.createGitTag).not.toHaveBeenCalled();
  });

  it('does NOT tag an unsynced branch (never pushed → no commit to tag)', async () => {
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      name: 'feat/login',
      versionType: AppVersionType.BRANCH,
      isSynced: false,
    });

    await service.saveVersion(buildApp(), user, publish());
    expect(appGitService.createGitTag).not.toHaveBeenCalled();
  });

  it('always persists the version first, then tags', async () => {
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      name: 'feat/login',
      versionType: AppVersionType.BRANCH,
      isSynced: true,
    });
    const order: string[] = [];
    versionService.update.mockImplementation(async () => {
      order.push('db-save');
    });
    appGitService.createGitTag.mockImplementation(async () => {
      order.push('git-tag');
    });

    await service.saveVersion(buildApp(), user, publish());
    expect(order).toEqual(['db-save', 'git-tag']);
  });

  it('swallows an "already exists" tag error without logging a warning', async () => {
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      name: 'feat/login',
      versionType: AppVersionType.BRANCH,
      isSynced: true,
    });
    appGitService.createGitTag.mockRejectedValue(new Error("Tag 'x' already exists."));

    await expect(service.saveVersion(buildApp(), user, publish())).resolves.toBeUndefined();
    expect(transactionLogger.warn).not.toHaveBeenCalled();
  });

  it('logs (does not throw) when tagging fails for any other reason — the saved version stands', async () => {
    versionRepository.getAppVersionById.mockResolvedValue({
      id: 'ver-1',
      name: 'feat/login',
      versionType: AppVersionType.BRANCH,
      isSynced: true,
    });
    appGitService.createGitTag.mockRejectedValue(new Error('network exploded'));

    await expect(service.saveVersion(buildApp(), user, publish())).resolves.toBeUndefined();
    expect(transactionLogger.warn).toHaveBeenCalledTimes(1);
    expect(transactionLogger.warn.mock.calls[0][0]).toContain('network exploded');
  });
});
