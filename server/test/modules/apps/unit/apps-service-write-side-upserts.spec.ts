/**
 * AppsService.getOne — fire-and-forget write-side bookkeeping (last-active branch + version).
 * @group platform
 */
// jest.Mock's call signature is a rest parameter, so the mock factory below can
// spread `...args` into it — a plain inferred function type requires a tuple instead.
const updateMock = jest.fn().mockResolvedValue(undefined);
const dbTransactionWrap: jest.Mock = jest.fn((cb: any) => cb({ update: updateMock }));
jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: (...args: any[]) => dbTransactionWrap(...args),
}));

import { AppsService } from '../../../../src/modules/apps/service';
import { OrganizationUser } from '../../../../src/entities/organization_user.entity';

const makeSvc = () => {
  const svc = Object.create(AppsService.prototype) as any;
  svc.userAppVersionStateRepository = { upsertLastActiveVersion: jest.fn().mockResolvedValue(undefined) };
  return svc;
};

// Fire-and-forget writes swallow their own failures via .catch — assertions below wait one
// microtask tick so that rejection has actually settled before checking nothing escaped.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('AppsService — write-side bookkeeping', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    dbTransactionWrap.mockImplementation((cb: any) => cb({ update: updateMock }));
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => consoleErrorSpy.mockRestore());

  it('does not upsert last_branch_id when the branch was explicit (deep link)', async () => {
    const svc = makeSvc();
    await (svc as any).persistActiveBranchIfImplicit(
      { id: 'user-1', organizationId: 'org-1', branchIdExplicit: true },
      'branch-1'
    );
    expect(dbTransactionWrap).not.toHaveBeenCalled();
  });

  it('upserts last_branch_id (fire-and-forget, own transaction) when resolution was implicit', async () => {
    const svc = makeSvc();
    await (svc as any).persistActiveBranchIfImplicit(
      { id: 'user-1', organizationId: 'org-1', branchIdExplicit: false },
      'branch-1'
    );
    expect(dbTransactionWrap).toHaveBeenCalledTimes(1);
    // no manager arg passed -> escapes any caller transaction, per database.helper.ts:18-28
    expect(dbTransactionWrap.mock.calls[0].length).toBe(1);
  });

  it('does not upsert last_branch_id when there is no resolved branch', async () => {
    const svc = makeSvc();
    await (svc as any).persistActiveBranchIfImplicit({ id: 'user-1', organizationId: 'org-1' }, undefined);
    expect(dbTransactionWrap).not.toHaveBeenCalled();
  });

  it('upserts user_app_version_state only for the default-branch (version-only) context', async () => {
    const svc = makeSvc();
    await (svc as any).persistActiveVersion({ id: 'user-1' }, { id: 'app-1', editingVersion: { id: 'v-1' } }, true);
    expect(svc.userAppVersionStateRepository.upsertLastActiveVersion).toHaveBeenCalledWith('user-1', 'app-1', 'v-1');
  });

  it('does not upsert user_app_version_state for a feature-branch open', async () => {
    const svc = makeSvc();
    await (svc as any).persistActiveVersion({ id: 'user-1' }, { id: 'app-1', editingVersion: { id: 'v-1' } }, false);
    expect(svc.userAppVersionStateRepository.upsertLastActiveVersion).not.toHaveBeenCalled();
  });

  it('does not upsert user_app_version_state when no version resolved', async () => {
    const svc = makeSvc();
    await (svc as any).persistActiveVersion({ id: 'user-1' }, { id: 'app-1' }, true);
    expect(svc.userAppVersionStateRepository.upsertLastActiveVersion).not.toHaveBeenCalled();
  });

  it('does not upsert last_branch_id for a PAT session, even when resolution was implicit', async () => {
    const svc = makeSvc();
    await (svc as any).persistActiveBranchIfImplicit(
      { id: 'user-1', organizationId: 'org-1', branchIdExplicit: false, isPATLogin: true },
      'branch-1'
    );
    expect(dbTransactionWrap).not.toHaveBeenCalled();
  });

  it("updates the requesting user's own organization_user row with the resolved branch", async () => {
    const svc = makeSvc();
    await (svc as any).persistActiveBranchIfImplicit(
      { id: 'user-1', organizationId: 'org-1', branchIdExplicit: false },
      'branch-1'
    );
    expect(updateMock).toHaveBeenCalledWith(
      OrganizationUser,
      { userId: 'user-1', organizationId: 'org-1' },
      { lastBranchId: 'branch-1' }
    );
  });

  it('swallows a failed branch write instead of throwing', async () => {
    dbTransactionWrap.mockImplementation(() => Promise.reject(new Error('write failed')));
    const svc = makeSvc();
    expect(() =>
      (svc as any).persistActiveBranchIfImplicit(
        { id: 'user-1', organizationId: 'org-1', branchIdExplicit: false },
        'branch-1'
      )
    ).not.toThrow();
    await flush();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('swallows a failed version write instead of throwing', async () => {
    const svc = makeSvc();
    svc.userAppVersionStateRepository.upsertLastActiveVersion.mockRejectedValue(new Error('write failed'));
    expect(() =>
      (svc as any).persistActiveVersion({ id: 'user-1' }, { id: 'app-1', editingVersion: { id: 'v-1' } }, true)
    ).not.toThrow();
    await flush();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
