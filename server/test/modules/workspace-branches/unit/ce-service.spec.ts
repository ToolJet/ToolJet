/**
 * WorkspaceBranchService (CE stub) — git sync is EE-only, so every method throws
 * NotFoundException on the community edition. The EE class overrides this in real runs, so
 * these lines are only reached by instantiating the CE class directly. One assertion per method.
 *
 * @group gitsync
 */
import { NotFoundException } from '@nestjs/common';
import { WorkspaceBranchService } from '@modules/workspace-branches/service';

describe('WorkspaceBranchService (CE stub)', () => {
  const svc = new WorkspaceBranchService();

  // [label, invocation] — each must reject with NotFoundException on CE.
  const calls: Array<[string, () => Promise<unknown>]> = [
    ['list', () => svc.list('org')],
    ['createBranch', () => svc.createBranch('org', {} as any)],
    ['switchBranch', () => svc.switchBranch('org', 'b')],
    ['deleteWorkspaceBranch', () => svc.deleteWorkspaceBranch('org', 'b')],
    ['pushWorkspace', () => svc.pushWorkspace('org', {} as any)],
    ['pullWorkspace', () => svc.pullWorkspace('org')],
    ['resolveConflicts', () => svc.resolveConflicts('org', [])],
    ['pullModule', () => svc.pullModule('org', {} as any, 'm')],
    ['pullApp', () => svc.pullApp('org', {} as any, 'a')],
    ['ensureAppDraft', () => svc.ensureAppDraft('org', 'a', undefined, {} as any)],
    ['checkForUpdates', () => svc.checkForUpdates('org')],
    ['listRemoteBranches', () => svc.listRemoteBranches('org')],
    ['getPullRequests', () => svc.getPullRequests('org')],
    ['getEntityTags', () => svc.getEntityTags('org', 'corel')],
  ];

  it.each(calls)('%s throws NotFoundException on CE', async (_label, invoke) => {
    await expect(invoke()).rejects.toBeInstanceOf(NotFoundException);
  });
});
