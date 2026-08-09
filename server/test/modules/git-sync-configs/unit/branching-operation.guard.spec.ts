/**
 * BranchingOperationGuard — gates branch-scoped operations in single-branch mode.
 *
 * Pure guard logic: the one dependency (GitSyncConfigsUtilService.getDetails) is a fake, and the
 * ExecutionContext is a minimal stub exposing request.user. No Nest app / DB.
 *
 * @group gitsync
 */
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { BranchingOperationGuard } from '@modules/git-sync-configs/guards/branching-operation.guard';

describe('BranchingOperationGuard', () => {
  const makeGuard = (details: any) => {
    const getDetails = jest.fn().mockResolvedValue(details);
    const guard = new BranchingOperationGuard({ getDetails } as any);
    return { guard, getDetails };
  };

  const ctx = (user: any): ExecutionContext => ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as any;

  it('allows any branch context when multi-branching is enabled (no-op)', async () => {
    const { guard, getDetails } = makeGuard({ isMultiBranchingEnabled: true, options: {} });
    await expect(guard.canActivate(ctx({ organizationId: 'org1', branchId: 'feature-branch' }))).resolves.toBe(true);
    expect(getDetails).toHaveBeenCalledWith('org1');
  });

  it('rejects a non-default branch in single-branch mode', async () => {
    const { guard } = makeGuard({
      isMultiBranchingEnabled: false,
      options: { defaultBranch: { id: 'default-1' } },
    });
    await expect(guard.canActivate(ctx({ organizationId: 'o', branchId: 'feature-1' }))).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('allows the default branch in single-branch mode', async () => {
    const { guard } = makeGuard({
      isMultiBranchingEnabled: false,
      options: { defaultBranch: { id: 'default-1' } },
    });
    await expect(guard.canActivate(ctx({ organizationId: 'o', branchId: 'default-1' }))).resolves.toBe(true);
  });

  it('allows when the request carries no branchId (single-branch mode)', async () => {
    const { guard } = makeGuard({
      isMultiBranchingEnabled: false,
      options: { defaultBranch: { id: 'default-1' } },
    });
    await expect(guard.canActivate(ctx({ organizationId: 'o' }))).resolves.toBe(true);
  });

  it('allows when the default branch id is unresolved (single-branch mode)', async () => {
    const { guard } = makeGuard({ isMultiBranchingEnabled: false, options: {} });
    await expect(guard.canActivate(ctx({ organizationId: 'o', branchId: 'anything' }))).resolves.toBe(true);
  });

  it('tolerates a missing user (passes organizationId undefined to getDetails)', async () => {
    const { guard, getDetails } = makeGuard({ isMultiBranchingEnabled: true, options: {} });
    await expect(guard.canActivate(ctx(undefined))).resolves.toBe(true);
    expect(getDetails).toHaveBeenCalledWith(undefined);
  });
});
