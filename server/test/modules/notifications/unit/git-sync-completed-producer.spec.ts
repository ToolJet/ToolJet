/** @group platform */
import { GitSyncQueueProcessor } from '@ee/workspace-branches/git-sync-queue.processor';
import { GIT_SYNC_JOBS } from '@modules/workspace-branches/constants';

type ProcessorDeps = ConstructorParameters<typeof GitSyncQueueProcessor>;

const makeJob = (over: Record<string, unknown> = {}) => ({
  id: 'job-1',
  name: GIT_SYNC_JOBS.CREATE_BRANCH,
  processedOn: 1751400000000,
  data: { organizationId: 'org1', userId: 'u1', name: 'feature-x' },
  ...over,
});

describe('GitSyncQueueProcessor.onCompleted | success notification producer', () => {
  let notify: jest.Mock;
  let processor: GitSyncQueueProcessor;

  beforeEach(() => {
    notify = jest.fn().mockResolvedValue(undefined);
    // ctor: (workspaceBranchService, redisService, notificationService)
    processor = new GitSyncQueueProcessor(
      {} as unknown as ProcessorDeps[0],
      {} as unknown as ProcessorDeps[1],
      { notify } as unknown as ProcessorDeps[2]
    );
  });
  afterEach(() => jest.resetAllMocks());

  it('notifies success with toast on create-branch completion', async () => {
    await processor.onCompleted(makeJob() as Parameters<typeof processor.onCompleted>[0]);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toMatchObject({
      type: 'success',
      userId: 'u1',
      organizationId: 'org1',
      title: 'Branch created',
      body: 'Branch feature-x is ready and available in the branch list.',
      toast: true,
      dedupeKey: 'job-1:completed:1751400000000',
    });
  });

  it('uses per-job copy: pull and delete branch', async () => {
    await processor.onCompleted(
      makeJob({ name: GIT_SYNC_JOBS.PULL_BRANCH, data: { organizationId: 'o', userId: 'u', branchName: 'main' } }) as Parameters<
        typeof processor.onCompleted
      >[0]
    );
    await processor.onCompleted(
      makeJob({ name: GIT_SYNC_JOBS.DELETE_BRANCH, data: { organizationId: 'o', userId: 'u', branchName: 'old' } }) as Parameters<
        typeof processor.onCompleted
      >[0]
    );
    expect(notify.mock.calls[0][0].title).toBe('Pull completed');
    expect(notify.mock.calls[1][0].title).toBe('Branch deleted');
  });

  it('stays silent for housekeeping jobs (push-app-deletion)', async () => {
    await processor.onCompleted(
      makeJob({ name: GIT_SYNC_JOBS.PUSH_APP_DELETION, data: { organizationId: 'o', userId: 'u', branchId: 'b' } }) as Parameters<
        typeof processor.onCompleted
      >[0]
    );
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not notify without a userId and does not throw on undefined job', async () => {
    await processor.onCompleted(
      makeJob({ data: { organizationId: 'o', name: 'x' } }) as Parameters<typeof processor.onCompleted>[0]
    );
    await expect(processor.onCompleted(undefined)).resolves.not.toThrow();
    expect(notify).not.toHaveBeenCalled();
  });

  it('swallows a notify() throw (must not crash the worker)', async () => {
    notify.mockRejectedValue(new Error('db down'));
    await expect(processor.onCompleted(makeJob() as Parameters<typeof processor.onCompleted>[0])).resolves.not.toThrow();
  });
});
