/**
 * Unit tests for WorkspaceBranchService.createBranch's inline-vs-enqueue split (tj-ee#5486).
 * Below the background-job thresholds, and with the org git lease free, branch creation now
 * runs inline on the web pod and returns the created branch instead of always enqueueing.
 *
 * @group gitsync
 */
import { BadRequestException, ConflictException } from '@nestjs/common';

jest.mock('@helpers/database.helper', () => ({ dbTransactionWrap: jest.fn() }));
jest.mock('@modules/request-context/service', () => ({
  RequestContext: { setLocals: jest.fn() },
}));

import { dbTransactionWrap } from '@helpers/database.helper';
import { WorkspaceBranchService } from '@ee/workspace-branches/service';

describe('WorkspaceBranchService.createBranch — inline vs enqueue', () => {
  let svc: WorkspaceBranchService;
  let manager: { findOneOrFail: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    manager = {
      findOneOrFail: jest.fn().mockResolvedValue({ id: 'src', name: 'main' }),
      findOne: jest.fn().mockResolvedValue(null),
    };
    (dbTransactionWrap as jest.Mock).mockImplementation((cb: (m: unknown) => Promise<unknown>) => cb(manager));

    svc = Object.create(WorkspaceBranchService.prototype) as WorkspaceBranchService;
    (svc as any).preCheckCreateBranchConflicts = jest.fn().mockResolvedValue(false);
    (svc as any).executeCreateBranch = jest.fn().mockResolvedValue({ id: 'b-new', name: 'feat' });
    (svc as any).countBranchEntities = jest.fn();
    (svc as any).gitSyncQueue = { tryWithOrgLease: jest.fn(), enqueueCreateBranch: jest.fn() };
    (svc as any).notificationService = { notify: jest.fn() };
  });

  afterEach(() => jest.resetAllMocks());

  it('below threshold → runs inline under the lease and returns the branch', async () => {
    (svc as any).countBranchEntities = jest.fn().mockResolvedValue({ apps: 10, modules: 30, dataSources: 100 });
    (svc as any).gitSyncQueue.tryWithOrgLease = jest.fn(async (_o: string, fn: () => Promise<unknown>) => ({
      acquired: true,
      result: await fn(),
    }));
    const res = await svc.createBranch('org-1', { name: 'feat', sourceBranchId: 'src' } as any, { id: 'u1' } as any);
    expect(res).toEqual({ enqueued: false, isImport: false, branch: { id: 'b-new', name: 'feat' } });
    expect((svc as any).gitSyncQueue.enqueueCreateBranch).not.toHaveBeenCalled();
    expect((svc as any).notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ toast: false, type: 'success' })
    );
  });

  it.each([
    [{ apps: 11, modules: 0, dataSources: 0 }],
    [{ apps: 0, modules: 31, dataSources: 0 }],
    [{ apps: 0, modules: 0, dataSources: 101 }],
  ])('over threshold %p → enqueues', async (counts) => {
    (svc as any).countBranchEntities = jest.fn().mockResolvedValue(counts);
    (svc as any).gitSyncQueue.tryWithOrgLease = jest.fn();
    const res = await svc.createBranch('org-1', { name: 'feat', sourceBranchId: 'src' } as any, { id: 'u1' } as any);
    expect(res).toEqual({ enqueued: true, isImport: false });
    expect((svc as any).gitSyncQueue.tryWithOrgLease).not.toHaveBeenCalled();
    expect((svc as any).gitSyncQueue.enqueueCreateBranch).toHaveBeenCalled();
  });

  it('lease busy → enqueues', async () => {
    (svc as any).countBranchEntities = jest.fn().mockResolvedValue({ apps: 1, modules: 0, dataSources: 0 });
    (svc as any).gitSyncQueue.tryWithOrgLease = jest.fn().mockResolvedValue({ acquired: false });
    const res = await svc.createBranch('org-1', { name: 'feat', sourceBranchId: 'src' } as any, { id: 'u1' } as any);
    expect(res.enqueued).toBe(true);
    expect((svc as any).gitSyncQueue.enqueueCreateBranch).toHaveBeenCalled();
  });

  it('inline failure → curated BadRequest, no notify', async () => {
    (svc as any).countBranchEntities = jest.fn().mockResolvedValue({ apps: 1, modules: 0, dataSources: 0 });
    (svc as any).executeCreateBranch = jest
      .fn()
      .mockRejectedValue(new Error('fatal: Authentication failed for https://x:token@github'));
    (svc as any).gitSyncQueue.tryWithOrgLease = jest.fn(async (_o: string, fn: () => Promise<unknown>) => ({
      acquired: true,
      result: await fn(),
    }));
    const p = svc.createBranch('org-1', { name: 'feat', sourceBranchId: 'src' } as any, { id: 'u1' } as any);
    await expect(p).rejects.toBeInstanceOf(BadRequestException);
    await expect(p).rejects.not.toThrow(/token@/);
    expect((svc as any).notificationService.notify).not.toHaveBeenCalled();
  });

  it('inline ConflictException is rethrown unchanged', async () => {
    (svc as any).countBranchEntities = jest.fn().mockResolvedValue({ apps: 1, modules: 0, dataSources: 0 });
    (svc as any).executeCreateBranch = jest.fn().mockRejectedValue(new ConflictException('conflict'));
    (svc as any).gitSyncQueue.tryWithOrgLease = jest.fn(async (_o: string, fn: () => Promise<unknown>) => ({
      acquired: true,
      result: await fn(),
    }));
    await expect(
      svc.createBranch('org-1', { name: 'feat', sourceBranchId: 'src' } as any, { id: 'u1' } as any)
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('notify rejects → createBranch still returns {enqueued:false, branch}', async () => {
    (svc as any).countBranchEntities = jest.fn().mockResolvedValue({ apps: 10, modules: 30, dataSources: 100 });
    (svc as any).gitSyncQueue.tryWithOrgLease = jest.fn(async (_o: string, fn: () => Promise<unknown>) => ({
      acquired: true,
      result: await fn(),
    }));
    (svc as any).notificationService.notify = jest.fn().mockRejectedValue(new Error('redis down'));
    (svc as any).transactionLogger = { error: jest.fn() };
    const res = await svc.createBranch('org-1', { name: 'feat', sourceBranchId: 'src' } as any, { id: 'u1' } as any);
    expect(res).toEqual({ enqueued: false, isImport: false, branch: { id: 'b-new', name: 'feat' } });
    expect((svc as any).transactionLogger.error).toHaveBeenCalled();
  });

  it('inline BadRequestException is rethrown unchanged', async () => {
    (svc as any).countBranchEntities = jest.fn().mockResolvedValue({ apps: 1, modules: 0, dataSources: 0 });
    (svc as any).executeCreateBranch = jest.fn().mockRejectedValue(new BadRequestException('x'));
    (svc as any).gitSyncQueue.tryWithOrgLease = jest.fn(async (_o: string, fn: () => Promise<unknown>) => ({
      acquired: true,
      result: await fn(),
    }));
    await expect(
      svc.createBranch('org-1', { name: 'feat', sourceBranchId: 'src' } as any, { id: 'u1' } as any)
    ).rejects.toThrow('x');
  });
});
