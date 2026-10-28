/**
 * AppsService.create for `query_library`: one per workspace, and it behaves like a workflow on
 * branches (always the default branch, never hits "Apps cannot be created on the default branch").
 * The e2e spec in ee/test covers the HTTP + DB round trip; this pins the branch rule without
 * needing a git provider or licence.
 */
import { BadRequestException } from '@nestjs/common';

const manager = { count: jest.fn(), findOne: jest.fn() };
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

describe('AppsService.create — query library', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    manager.findOne.mockResolvedValue({ id: DEFAULT_BRANCH, isDefault: true });
  });

  it('rejects a second query library in the workspace', async () => {
    manager.count.mockResolvedValue(1);
    const { svc, create } = makeSvc();

    const result = svc.create(user, { name: 'Lib', type: APP_TYPES.QUERY_LIBRARY } as never);

    await expect(result).rejects.toBeInstanceOf(BadRequestException);
    await expect(result).rejects.toThrow('This workspace already has a query library');
    expect(manager.count).toHaveBeenCalledWith(expect.anything(), {
      where: { organizationId: 'org-1', type: APP_TYPES.QUERY_LIBRARY },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates on the default branch under multi-branching, ignoring the DTO branchId', async () => {
    manager.count.mockResolvedValue(0);
    const { svc, create } = makeSvc();

    await svc.create(user, { name: 'Lib', type: APP_TYPES.QUERY_LIBRARY, branchId: 'some-feature-branch' } as never);

    expect(create).toHaveBeenCalledWith(
      'Lib',
      user,
      APP_TYPES.QUERY_LIBRARY,
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
    expect(manager.count).not.toHaveBeenCalled();
  });
});

// The library has one version on the default branch, so a feature-branch listing must not scope it out.
describe('AppsService dashboard branch — query library', () => {
  const resolve = (svc: AppsService, type: string, branchId?: string) =>
    (
      svc as unknown as { resolveDashboardBranchId: (u: unknown, t: string, b?: string) => Promise<string> }
    ).resolveDashboardBranchId(user, type, branchId);

  beforeEach(() => jest.resetAllMocks());

  it('lists the query library without a branch scope, even from a feature branch', async () => {
    const { svc } = makeSvc();
    await expect(resolve(svc, APP_TYPES.QUERY_LIBRARY, 'feature-branch')).resolves.toBeUndefined();
    await expect(resolve(svc, APP_TYPES.QUERY_LIBRARY)).resolves.toBeUndefined();
  });

  it('keeps modules on the requested branch', async () => {
    const { svc } = makeSvc();
    await expect(resolve(svc, APP_TYPES.MODULE, 'feature-branch')).resolves.toBe('feature-branch');
  });
});
