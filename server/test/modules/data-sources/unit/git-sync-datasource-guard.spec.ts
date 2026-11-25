import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';

// The guard resolves entities through dbTransactionWrap and delegates the lock decision to
// assertGitSyncEditAllowedForOrg. Mock both so the test can assert which data source version's
// lock state the guard forwards when the request omits branch_id.
const mockManager = { findOne: jest.fn() };
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: (fn: any) => fn(mockManager),
}));
const assertGitSyncEditAllowedForOrg = jest.fn();
jest.mock('@modules/git-sync-configs/guards/git-sync-edit-guard', () => ({
  assertGitSyncEditAllowedForOrg: (...args: any[]) => assertGitSyncEditAllowedForOrg(...args),
  assertGitSyncCreateAllowedForOrg: jest.fn(),
}));

import { GitSyncDataSourceEditGuard } from '@modules/data-sources/guards/git-sync-datasource.guard';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';

const ORG = 'org-1';
const DS = 'ds-1';
const DEFAULT_BRANCH = 'branch-default';

function makeContext() {
  const request = { user: { organizationId: ORG }, params: { id: DS }, query: {}, body: {} };
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('GitSyncDataSourceEditGuard | default-branch lock when branch_id is omitted', () => {
  beforeEach(() => jest.clearAllMocks());

  it('checks the default-branch version (synced), not an arbitrary feature-branch version', async () => {
    mockManager.findOne.mockImplementation((entity: any, opts: any) => {
      if (entity === WorkspaceBranch) return Promise.resolve({ id: DEFAULT_BRANCH });
      if (entity === DataSourceVersion) {
        // The fix must scope by the resolved default branch; an unscoped read would return the
        // unsynced feature version and bypass the lock.
        if (opts?.where?.branchId === DEFAULT_BRANCH) {
          return Promise.resolve({ id: 'dsv-default', branchId: DEFAULT_BRANCH, isSynced: true });
        }
        return Promise.resolve({ id: 'dsv-feature', branchId: 'branch-feature', isSynced: false });
      }
      return Promise.resolve(null);
    });

    const guard = new GitSyncDataSourceEditGuard({} as any, {} as any);
    await guard.canActivate(makeContext());

    expect(assertGitSyncEditAllowedForOrg).toHaveBeenCalledWith(
      expect.anything(),
      ORG,
      expect.objectContaining({ branchId: DEFAULT_BRANCH, isSynced: true }),
      'data source'
    );
  });
});
