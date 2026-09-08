/**
 * Regression: creating a data source in a git-configured-but-unlicensed workspace must be BLOCKED,
 * the same way app create/delete are. The route guard GitSyncDataSourceCreateGuard runs
 * assertGitSyncCreateAllowedForOrg → assertNotGitLicenseLocked, throwing ForbiddenException
 * ("Turn off git sync to continue") before any branch-scoping checks.
 *
 * The guard only depends on gitSyncConfigsUtilService (isGitEditLocked + getDetails), so we pass a
 * lightweight stub and a minimal ExecutionContext.
 */
import { ForbiddenException } from '@nestjs/common';
import { GitSyncDataSourceCreateGuard } from '../../../../src/modules/data-sources/guards/git-sync-datasource.guard';

const makeCtx = (request: any): any => ({
  switchToHttp: () => ({ getRequest: () => request }),
});

describe('GitSyncDataSourceCreateGuard — git license lock', () => {
  it('blocks data source creation when git is configured but unlicensed', async () => {
    const util = {
      isGitEditLocked: jest.fn().mockResolvedValue(true),
      getDetails: jest.fn(),
    };
    const guard = new GitSyncDataSourceCreateGuard(util as any);
    const ctx = makeCtx({ user: { organizationId: 'org-1' }, query: {} });

    await expect(guard.canActivate(ctx)).rejects.toThrow('Your plan has expired. Turn off git sync to continue.');
    // Lock short-circuits before the branch-scoping resolution.
    expect(util.getDetails).not.toHaveBeenCalled();
  });

  it('throws a ForbiddenException instance when locked', async () => {
    const util = { isGitEditLocked: jest.fn().mockResolvedValue(true), getDetails: jest.fn() };
    const guard = new GitSyncDataSourceCreateGuard(util as any);
    const ctx = makeCtx({ user: { organizationId: 'org-1' }, query: {} });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows creation when not locked and git sync is off (getDetails → disabled)', async () => {
    const util = {
      isGitEditLocked: jest.fn().mockResolvedValue(false),
      getDetails: jest.fn().mockResolvedValue({ isEnabled: false, isMultiBranchingEnabled: false, options: {} }),
    };
    const guard = new GitSyncDataSourceCreateGuard(util as any);
    const ctx = makeCtx({ user: { organizationId: 'org-1' }, query: {} });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(util.isGitEditLocked).toHaveBeenCalledWith('org-1');
  });

  it('is a no-op (no lock check) when there is no organizationId', async () => {
    const util = { isGitEditLocked: jest.fn(), getDetails: jest.fn() };
    const guard = new GitSyncDataSourceCreateGuard(util as any);
    const ctx = makeCtx({ user: {}, query: {} });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(util.isGitEditLocked).not.toHaveBeenCalled();
  });
});
