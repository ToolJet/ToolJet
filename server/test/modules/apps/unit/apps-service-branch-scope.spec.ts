const manager = { findOne: jest.fn() };
jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: (fn: (m: unknown) => unknown) => fn(manager),
}));

import { AppsService } from '../../../../src/modules/apps/service';
import { APP_TYPES } from '../../../../src/modules/apps/constants';

const DEFAULT_BRANCH = 'default-branch-id';
const user = { id: 'u1', organizationId: 'org-1' } as never;

const makeSvc = () => {
  const svc = Object.create(AppsService.prototype) as AppsService;
  const create = jest.fn().mockResolvedValue({ id: 'app-1', slug: 'app-1' });
  Object.assign(svc, {
    appsUtilService: { create },
    gitSyncConfigsUtilService: {
      isGitEditLocked: jest.fn().mockResolvedValue(false),
      getDetails: jest.fn().mockResolvedValue({
        isMultiBranchingEnabled: true,
        options: { defaultBranch: { id: DEFAULT_BRANCH } },
      }),
    },
  });
  return { svc, create };
};

/** @group platform */
describe('AppsService.create — default branch', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    manager.findOne.mockResolvedValue({ id: DEFAULT_BRANCH, isDefault: true });
  });

  it('creates workflows on the default branch even when another branch is supplied', async () => {
    const { svc, create } = makeSvc();
    await svc.create(user, { name: 'Workflow', type: APP_TYPES.WORKFLOW, branchId: 'feature-branch' } as never);
    expect(create).toHaveBeenCalledWith(
      'Workflow',
      user,
      APP_TYPES.WORKFLOW,
      false,
      manager,
      DEFAULT_BRANCH,
      undefined
    );
  });

  it('still rejects a front-end app on the default branch under multi-branching', async () => {
    const { svc } = makeSvc();

    await expect(
      svc.create(user, { name: 'App', type: APP_TYPES.FRONT_END, branchId: DEFAULT_BRANCH } as never)
    ).rejects.toThrow('Apps cannot be created on the default branch. Switch to a feature branch.');
  });
});

// Dashboard listing keeps the requested branch when one is supplied.
describe('AppsService dashboard branch', () => {
  const resolve = (svc: AppsService, branchId?: string) =>
    (
      svc as unknown as { resolveDashboardBranchId: (u: unknown, b?: string) => Promise<string | undefined> }
    ).resolveDashboardBranchId(user, branchId);

  beforeEach(() => jest.resetAllMocks());

  it('keeps the requested branch', async () => {
    const { svc } = makeSvc();
    await expect(resolve(svc, 'feature-branch')).resolves.toBe('feature-branch');
  });
});
