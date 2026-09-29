/**
 * BitbucketAppGitService.getPullRequests — maps Bitbucket REST /2.0 pull requests onto the
 * provider-agnostic PullRequestSummary the App Builder PR list renders. The REST call itself
 * (pagination, state params) is pinned in bitbucket-util.service.spec.ts; here the utility
 * service is a fake.
 *
 * @group gitsync
 */
import { BitbucketAppGitService } from '@ee/app-git/providers/bitbucket/service';

const orgGit = { id: 'orggit-1' };

const bitbucketPr = (overrides: Record<string, unknown> = {}) => ({
  id: 42,
  title: 'Add login page',
  state: 'OPEN',
  created_on: '2026-09-01T10:00:00Z',
  updated_on: '2026-09-02T10:00:00Z',
  author: { display_name: 'Dev One' },
  source: { branch: { name: 'feat/login' } },
  destination: { branch: { name: 'main' } },
  links: { html: { href: 'https://bitbucket.org/acme/web-app/pull-requests/42' } },
  ...overrides,
});

const buildService = () => {
  const svc: unknown = Object.create(BitbucketAppGitService.prototype);
  const stubs = {
    bitbucketAppGitUtilityService: { findOrgGitByOrganizationId: jest.fn().mockResolvedValue(orgGit) },
    bitbucketGitSyncUtilService: { listPullRequests: jest.fn().mockResolvedValue([]) },
  };
  // The stubbed collaborators are private on the real class; expose them to the test.
  return Object.assign(svc as object, stubs) as Omit<BitbucketAppGitService, keyof typeof stubs> & typeof stubs;
};

describe('BitbucketAppGitService.getPullRequests', () => {
  it("lists the workspace's pull requests using its git sync config", async () => {
    const svc = buildService();

    await svc.getPullRequests('app-1', 'org-1');

    expect(svc.bitbucketAppGitUtilityService.findOrgGitByOrganizationId).toHaveBeenCalledWith('org-1');
    expect(svc.bitbucketGitSyncUtilService.listPullRequests).toHaveBeenCalledWith(orgGit);
  });

  it('maps an open Bitbucket PR onto the provider-agnostic summary (no mergedAt)', async () => {
    const svc = buildService();
    svc.bitbucketGitSyncUtilService.listPullRequests.mockResolvedValue([bitbucketPr()]);

    await expect(svc.getPullRequests('app-1', 'org-1')).resolves.toEqual({
      pullRequests: [
        {
          number: '42', // numeric Bitbucket id → string, like the other providers
          title: 'Add login page',
          sourceBranch: 'feat/login',
          targetBranch: 'main',
          status: 'OPEN',
          author: 'Dev One',
          createdAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-02T10:00:00Z',
          mergedAt: null,
          url: 'https://bitbucket.org/acme/web-app/pull-requests/42',
        },
      ],
    });
  });

  it('uses updated_on as mergedAt for a MERGED PR', async () => {
    const svc = buildService();
    svc.bitbucketGitSyncUtilService.listPullRequests.mockResolvedValue([bitbucketPr({ state: 'MERGED' })]);

    const { pullRequests } = await svc.getPullRequests('app-1', 'org-1');

    expect(pullRequests[0]).toMatchObject({ status: 'MERGED', mergedAt: '2026-09-02T10:00:00Z' });
  });

  it("falls back to 'Unknown' author and tolerates missing branch/link fields", async () => {
    const svc = buildService();
    svc.bitbucketGitSyncUtilService.listPullRequests.mockResolvedValue([
      bitbucketPr({ author: undefined, source: undefined, destination: {}, links: undefined }),
    ]);

    const { pullRequests } = await svc.getPullRequests('app-1', 'org-1');

    expect(pullRequests[0]).toMatchObject({
      author: 'Unknown',
      sourceBranch: undefined,
      targetBranch: undefined,
      url: undefined,
    });
  });

  it('returns an empty list when the repository has no pull requests', async () => {
    const svc = buildService();
    await expect(svc.getPullRequests('app-1', 'org-1')).resolves.toEqual({ pullRequests: [] });
  });
});
