/**
 * GitSyncConfigsService (CE stub) — git sync is EE-only, so every method throws
 * NotImplementedException on the community edition. Only reached by instantiating the CE
 * class directly (the EE class overrides it in real runs). One assertion per method.
 *
 * @group gitsync
 */
import { NotImplementedException } from '@nestjs/common';
import { GitSyncConfigsService } from '@modules/git-sync-configs/service';

describe('GitSyncConfigsService (CE stub)', () => {
  const svc = new GitSyncConfigsService();

  const calls: Array<[string, () => Promise<unknown>]> = [
    ['getOrgGitByOrgId', () => svc.getOrgGitByOrgId('u', 'org')],
    ['getOrgGitStatusById', () => svc.getOrgGitStatusById('u', 'org')],
    ['createOrganizationGit', () => svc.createOrganizationGit({} as any, 'u')],
    ['updateOrgGit', () => svc.updateOrgGit('u', 'id', {} as any, 'github_https')],
    ['updateOrgGitStatus', () => svc.updateOrgGitStatus('org', 'id', {} as any)],
    ['updateBranchingEnabled', () => svc.updateBranchingEnabled('u', 'id', true)],
    ['deleteConfig', () => svc.deleteConfig('org', 'id', 'github_https')],
  ];

  it.each(calls)('%s throws NotImplementedException on CE', async (_label, invoke) => {
    await expect(invoke()).rejects.toBeInstanceOf(NotImplementedException);
  });
});
