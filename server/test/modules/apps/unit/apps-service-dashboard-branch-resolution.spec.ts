/**
 * Phase 5 Step 5.3b (workflow-git-sync): the dashboard branch fallback must apply to every app type.
 *
 * It used to run only for FRONT_END and MODULE, so a workflow list request with no branch_id resolved
 * to `undefined`. That mattered on a hard reload: whenBranchResolved() returns immediately when the URL
 * carries no ?branch, so the first fetch goes out before the branches store has initialised, and with no
 * branchId the server skips stampIsAppSynced entirely — `is_app_synced` never reaches the payload and
 * AppCard's `!app?.is_app_synced` renders a false "not synced" badge on every workflow card.
 *
 * The type guard listing all three APP_TYPES members was a tautology, so the fix removed it (and the
 * now-unused `type` parameter) rather than adding WORKFLOW to it. These tests pin the resulting contract:
 * an explicitly supplied branch always wins, and otherwise the org default is resolved for any type.
 *
 * resolveDashboardBranchId is private and reads only gitSyncConfigsUtilService, so the real method is
 * driven off the prototype with just that set. Same approach as apps-service-delete-git-lock.spec.ts.
 *
 * @group platform
 */
import { AppsService } from '@modules/apps/service';
import { APP_TYPES } from '@modules/apps/constants';
import { User } from '@entities/user.entity';

const DEFAULT_BRANCH_ID = 'branch-default';

type ResolveFn = (user: User, providedBranchId?: string) => Promise<string | undefined>;

const makeUser = () => ({ id: 'user-1', organizationId: 'org-1' }) as User;

const makeSvc = (defaultBranchId?: string) => {
  const getDetails = jest.fn().mockResolvedValue({
    options: { defaultBranch: defaultBranchId ? { id: defaultBranchId } : undefined },
  });
  const svc = Object.create(AppsService.prototype) as AppsService;
  (svc as any).gitSyncConfigsUtilService = { getDetails };
  const resolve = (svc as any).resolveDashboardBranchId.bind(svc) as ResolveFn;
  return { resolve, getDetails };
};

describe('AppsService | resolveDashboardBranchId', () => {
  afterEach(() => jest.resetAllMocks());

  it('should return the caller-supplied branch id untouched', async () => {
    const { resolve, getDetails } = makeSvc(DEFAULT_BRANCH_ID);

    await expect(resolve(makeUser(), 'branch-feature-1')).resolves.toBe('branch-feature-1');
    // An explicit branch wins outright — no config read at all.
    expect(getDetails).not.toHaveBeenCalled();
  });

  // Kept per-type so the change is pinned as a widening, not a swap: the two types that already had
  // the fallback must keep it, and the third must gain it.
  it.each([
    ['front-end', APP_TYPES.FRONT_END],
    ['module', APP_TYPES.MODULE],
    ['workflow', APP_TYPES.WORKFLOW],
  ])('should fall back to the org default branch for a %s listing', async (_label, _type) => {
    const { resolve, getDetails } = makeSvc(DEFAULT_BRANCH_ID);

    await expect(resolve(makeUser())).resolves.toBe(DEFAULT_BRANCH_ID);
    expect(getDetails).toHaveBeenCalledWith('org-1');
  });

  it('should return undefined when the workspace has no default branch', async () => {
    const { resolve } = makeSvc(undefined);

    await expect(resolve(makeUser())).resolves.toBeUndefined();
  });
});
