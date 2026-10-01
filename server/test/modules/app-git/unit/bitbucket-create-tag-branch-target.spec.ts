/**
 * BitbucketAppGitService.createGitTag / renameGitTag — Bitbucket mirror of
 * gitlab-create-tag-branch-target.spec.ts.
 *
 * createGitTag: a feature-branch save passes { targetBranch, tagVersionName } and the tag must be
 * named after the saved version and point at the FEATURE BRANCH; a plain save tags the configured
 * default branch under the row's own name. renameGitTag: Bitbucket has no tag-rename API, so the
 * service deletes the old tag and recreates it at the same commit.
 *
 * Constructed via Object.create so no NestJS DI is needed; only the collaborators these methods touch
 * are stubbed. BranchingBusinessUtil is the real (pure) implementation so tag names match production.
 *
 * @group gitsync
 */
import { BitbucketAppGitService } from '@ee/app-git/providers/bitbucket/service';
import { BranchingBusinessUtil } from '@ee/app-git/shared/branching-business.util';
import { User } from '@entities/user.entity';

const user = { organizationId: 'org-1', id: 'user-1', email: 'a@b.c', firstName: 'A', lastName: 'B' } as User;
const orgGit = { id: 'orggit-1' };

const buildService = (appVersionName: string) => {
  const svc: unknown = Object.create(BitbucketAppGitService.prototype);
  const stubs = {
    appsUtilService: {
      findByAppId: jest.fn().mockResolvedValue({
        id: 'app-1',
        co_relation_id: 'co-1',
        organizationId: 'org-1',
        name: 'MyApp',
      }),
    },
    appVersionRepository: { findOne: jest.fn().mockResolvedValue({ id: 'ver-1', name: appVersionName }) },
    bitbucketAppGitUtilityService: { findOrgGitByOrganizationId: jest.fn().mockResolvedValue(orgGit) },
    bitbucketGitSyncUtilService: {
      resolveBitbucketConfigs: jest.fn().mockResolvedValue({ bitbucketBranch: 'main' }),
      getTag: jest.fn().mockResolvedValue(null), // tag does not exist yet
      createTag: jest.fn().mockResolvedValue(undefined),
      deleteTag: jest.fn().mockResolvedValue(undefined),
    },
    branchingBusinessUtil: new (BranchingBusinessUtil as unknown as new () => BranchingBusinessUtil)(),
  };
  // The stubbed collaborators are private on the real class; expose them to the test.
  return Object.assign(svc as object, stubs) as Omit<BitbucketAppGitService, keyof typeof stubs> & typeof stubs;
};

describe('BitbucketAppGitService.createGitTag — feature-branch targeting', () => {
  it('tags the FEATURE BRANCH ref under the saved version name when options are supplied', async () => {
    const svc = buildService('feat/login'); // the BRANCH-draft row name

    const result = await svc.createGitTag('app-1', 'ver-1', user, 'shipping login', {
      targetBranch: 'feat/login',
      tagVersionName: 'v2',
    });

    expect(svc.bitbucketGitSyncUtilService.createTag).toHaveBeenCalledTimes(1);
    const [passedOrgGit, tagName, ref] = svc.bitbucketGitSyncUtilService.createTag.mock.calls[0];
    expect(passedOrgGit).toBe(orgGit);
    expect(tagName).toBe('co-1/v2'); // named after the saved version, not the branch
    expect(ref).toBe('feat/login'); // points at the FEATURE BRANCH, not 'main'
    expect(result).toEqual({ success: true, tagName: 'co-1/v2', message: expect.stringContaining('MyApp/v2') });
  });

  it('tags the default branch under the row name when no options are supplied (unchanged)', async () => {
    const svc = buildService('v3');

    await svc.createGitTag('app-1', 'ver-1', user, 'release');

    const [, tagName, ref] = svc.bitbucketGitSyncUtilService.createTag.mock.calls[0];
    expect(tagName).toBe('co-1/v3');
    expect(ref).toBe('main'); // configured default branch
  });

  it('still rejects when a tag with the resolved name already exists', async () => {
    const svc = buildService('feat/login');
    svc.bitbucketGitSyncUtilService.getTag.mockResolvedValue({ name: 'co-1/v2' });

    await expect(
      svc.createGitTag('app-1', 'ver-1', user, 'msg', { targetBranch: 'feat/login', tagVersionName: 'v2' })
    ).rejects.toThrow(/already exists/);
    expect(svc.bitbucketGitSyncUtilService.createTag).not.toHaveBeenCalled();
  });

  it('rejects when the app or the version does not exist', async () => {
    const noApp = buildService('v1');
    noApp.appsUtilService.findByAppId.mockResolvedValue(null);
    await expect(noApp.createGitTag('app-1', 'ver-1', user)).rejects.toThrow('App not found');

    const noVersion = buildService('v1');
    noVersion.appVersionRepository.findOne.mockResolvedValue(null);
    await expect(noVersion.createGitTag('app-1', 'ver-1', user)).rejects.toThrow('Version not found');
  });
});

describe('BitbucketAppGitService.renameGitTag', () => {
  it('deletes the old tag and recreates it under the new name at the same commit', async () => {
    const svc = buildService('v1');
    svc.bitbucketGitSyncUtilService.getTag.mockResolvedValue({ name: 'co-1/v1', target: { hash: 'abc123' } });

    await expect(svc.renameGitTag('app-1', 'v1', 'v1-final', user)).resolves.toEqual({
      success: true,
      oldTagName: 'co-1/v1',
      newTagName: 'co-1/v1-final',
    });
    expect(svc.bitbucketGitSyncUtilService.deleteTag).toHaveBeenCalledWith(orgGit, 'co-1/v1');
    expect(svc.bitbucketGitSyncUtilService.createTag).toHaveBeenCalledWith(orgGit, 'co-1/v1-final', 'abc123');
  });

  it('is a no-op when the old tag does not exist', async () => {
    const svc = buildService('v1');

    await expect(svc.renameGitTag('app-1', 'v1', 'v2', user)).resolves.toBeUndefined();
    expect(svc.bitbucketGitSyncUtilService.deleteTag).not.toHaveBeenCalled();
    expect(svc.bitbucketGitSyncUtilService.createTag).not.toHaveBeenCalled();
  });

  it('rejects (without deleting anything) when the old tag has no commit hash', async () => {
    const svc = buildService('v1');
    svc.bitbucketGitSyncUtilService.getTag.mockResolvedValue({ name: 'co-1/v1' });

    await expect(svc.renameGitTag('app-1', 'v1', 'v2', user)).rejects.toThrow(/no resolvable commit/);
    expect(svc.bitbucketGitSyncUtilService.deleteTag).not.toHaveBeenCalled();
  });
});
