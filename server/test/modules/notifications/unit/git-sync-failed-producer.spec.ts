/** @group platform */
import { GitSyncQueueProcessor } from '@ee/workspace-branches/git-sync-queue.processor';
import { GIT_SYNC_JOBS } from '@modules/workspace-branches/constants';

const makeJob = (over: any = {}) => ({
  id: 'job-1',
  name: GIT_SYNC_JOBS.CREATE_BRANCH,
  attemptsMade: 3,
  opts: { attempts: 3 },
  data: { organizationId: 'org1', userId: 'u1', name: 'feature-x' },
  ...over,
});

describe('GitSyncQueueProcessor.onFailed | error notification producer', () => {
  let notify: jest.Mock;
  let processor: GitSyncQueueProcessor;

  beforeEach(() => {
    notify = jest.fn().mockResolvedValue(undefined);
    // ctor: (workspaceBranchService, redisService, notificationService)
    processor = new GitSyncQueueProcessor({} as any, {} as any, { notify } as any);
  });
  afterEach(() => jest.resetAllMocks());

  it('notifies once on the FINAL attempt with a safe (token-free) payload', async () => {
    await processor.onFailed(makeJob() as any, new Error('Authentication failed for https://x-access-token:ghp_LEAKLEAKLEAKLEAKLEAK1234@github.com/o/r'));
    expect(notify).toHaveBeenCalledTimes(1);
    const arg = notify.mock.calls[0][0];
    expect(arg).toMatchObject({ type: 'error', userId: 'u1', organizationId: 'org1', title: 'Branch creation failed' });
    expect(JSON.stringify(arg)).not.toMatch(/ghp_LEAK/);   // no raw token anywhere in payload
    expect(arg.dedupeKey).toBe('job-1:3');
  });

  it('does NOT notify on a non-final attempt', async () => {
    await processor.onFailed(makeJob({ attemptsMade: 1 }) as any, new Error('x'));
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not throw and does not notify when job is undefined', async () => {
    await expect(processor.onFailed(undefined as any, new Error('worker died'))).resolves.not.toThrow();
    expect(notify).not.toHaveBeenCalled();
  });

  it('swallows a notify() throw (must not crash the worker)', async () => {
    notify.mockRejectedValue(new Error('db down'));
    await expect(processor.onFailed(makeJob() as any, new Error('x'))).resolves.not.toThrow();
  });

  it('does not notify when userId is absent (per-user only; e.g. delete-branch without user)', async () => {
    await processor.onFailed(makeJob({ name: GIT_SYNC_JOBS.DELETE_BRANCH, data: { organizationId: 'org1', branchName: 'b' } }) as any, new Error('x'));
    expect(notify).not.toHaveBeenCalled();
  });

  it('deep-links to the git-sync UI, not Bull Board', async () => {
    await processor.onFailed(makeJob() as any, new Error('x'));
    const link = notify.mock.calls[0][0].link;
    expect(link).not.toMatch(/bull|queues/i);
    expect(link).toBe('git-sync-modal'); // sentinel — frontend opens the workspace modal via store action
  });
});
