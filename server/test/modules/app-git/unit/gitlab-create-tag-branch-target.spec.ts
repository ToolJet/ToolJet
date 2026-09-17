/**
 * GitLabAppGitService.createGitTag — branch-target + tag-name override.
 *
 * Proves the override actually reaches the git transport: a feature-branch save passes
 * { targetBranch, tagVersionName } and the created tag must (a) be named after the saved version and
 * (b) point at the FEATURE BRANCH ref — while a plain save (no options) still tags the configured
 * default branch under the row's own name. Constructed via Object.create so no NestJS DI is needed;
 * only the collaborators createGitTag actually touches are stubbed. BranchingBusinessUtil is the real
 * (pure) implementation so the asserted tag names are the ones production would build.
 *
 * @group gitsync
 */
import { GitLabAppGitService } from '@ee/app-git/providers/gitlab/service';
import { BranchingBusinessUtil } from '@ee/app-git/shared/branching-business.util';

const user = { organizationId: 'org-1', id: 'user-1', email: 'a@b.c', firstName: 'A', lastName: 'B' } as any;
const orgGit = { id: 'orggit-1' };

const buildService = (appVersionName: string) => {
  const svc: any = Object.create(GitLabAppGitService.prototype);
  svc.appsUtilService = {
    findByAppId: jest.fn().mockResolvedValue({
      id: 'app-1',
      co_relation_id: 'co-1',
      organizationId: 'org-1',
      name: 'MyApp',
    }),
  };
  svc.appVersionRepository = { findOne: jest.fn().mockResolvedValue({ id: 'ver-1', name: appVersionName }) };
  svc.gitLabAppGitUtilityService = { findOrgGitByOrganizationId: jest.fn().mockResolvedValue(orgGit) };
  svc.gitLabGitSyncUtilService = {
    resolveGitLabConfigs: jest.fn().mockResolvedValue({ gitlabBranch: 'main' }),
    getTag: jest.fn().mockResolvedValue(null), // tag does not exist yet
    createTag: jest.fn().mockResolvedValue({}),
  };
  svc.branchingBusinessUtil = new (BranchingBusinessUtil as any)();
  return svc;
};

describe('GitLabAppGitService.createGitTag — feature-branch targeting', () => {
  it('tags the FEATURE BRANCH ref under the saved version name when options are supplied', async () => {
    const svc = buildService('feat/login'); // the BRANCH-draft row name

    const result = await svc.createGitTag('app-1', 'ver-1', user, 'shipping login', {
      targetBranch: 'feat/login',
      tagVersionName: 'v2',
    });

    expect(svc.gitLabGitSyncUtilService.createTag).toHaveBeenCalledTimes(1);
    const [passedOrgGit, tagName, ref, message] = svc.gitLabGitSyncUtilService.createTag.mock.calls[0];
    expect(passedOrgGit).toBe(orgGit);
    expect(tagName).toBe('co-1/v2'); // named after the saved version, not the branch
    expect(ref).toBe('feat/login'); // points at the FEATURE BRANCH, not 'main'
    expect(message).toContain('MyApp/v2');
    expect(result).toEqual({ success: true, tagName: 'co-1/v2', message: expect.stringContaining('MyApp/v2') });
  });

  it('tags the default branch under the row name when no options are supplied (unchanged)', async () => {
    const svc = buildService('v3');

    await svc.createGitTag('app-1', 'ver-1', user, 'release');

    const [, tagName, ref] = svc.gitLabGitSyncUtilService.createTag.mock.calls[0];
    expect(tagName).toBe('co-1/v3');
    expect(ref).toBe('main'); // configured default branch
  });

  it('still rejects when a tag with the resolved name already exists', async () => {
    const svc = buildService('feat/login');
    svc.gitLabGitSyncUtilService.getTag.mockResolvedValue({ name: 'co-1/v2' });

    await expect(
      svc.createGitTag('app-1', 'ver-1', user, 'msg', { targetBranch: 'feat/login', tagVersionName: 'v2' })
    ).rejects.toThrow(/already exists/);
    expect(svc.gitLabGitSyncUtilService.createTag).not.toHaveBeenCalled();
  });
});
