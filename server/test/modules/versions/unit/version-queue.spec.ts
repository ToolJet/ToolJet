import { Job } from 'bullmq';
import { BadRequestException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { VersionQueueService, CreateVersionJobPayload } from '@ee/versions/queue/version-queue.service';
import { VersionQueueProcessor } from '@ee/versions/queue/version-queue.processor';

jest.mock('@helpers/database.helper', () => ({
  getConnectionInstance: jest.fn(),
}));
import { getConnectionInstance } from '@helpers/database.helper';

/** The narrow slice of a BullMQ Queue the enqueue service uses. */
interface QueueLike {
  add(name: string, data: unknown, opts?: Record<string, unknown>): Promise<{ id?: string; timestamp: number }>;
  getJob(jobId: string): Promise<{ timestamp: number } | undefined>;
  getWorkers(): Promise<unknown[]>;
}

/**
 * Records every add() so tests can assert name / payload / jobId / opts (copied from
 * git-sync-queue.spec.ts), plus a minimal getJob/removeJob so tests can simulate BullMQ's real
 * dedupe-by-custom-jobId behaviour:
 *  - add() to a brand new jobId stores it and returns a Job with a fresh timestamp.
 *  - add() to an already-live jobId is a no-op at the data layer (the stored entry is untouched)
 *    but — matching real BullMQ, which never re-reads Redis after a dedup no-op — still returns a
 *    freshly constructed Job object with its OWN (different, unreliable) timestamp. Only getJob()
 *    reflects the true, persisted timestamp.
 *  - removeJob simulates removeOnComplete/removeOnFail sweeping a finished job, after which the
 *    same jobId is treated as brand new (fresh timestamp) on the next add().
 */
class FakeQueue implements QueueLike {
  added: { name: string; data: any; opts: any }[] = [];
  workers: unknown[] = [{}]; // default: one worker present, no warning path
  private jobs = new Map<string, { timestamp: number }>();
  private clock = 0;

  async add(name: string, data: any, opts?: any) {
    this.added.push({ name, data, opts });
    const jobId: string | undefined = opts?.jobId;
    const freshTimestamp = ++this.clock;
    if (jobId && this.jobs.has(jobId)) {
      return { id: jobId, timestamp: freshTimestamp }; // dedup no-op; stored entry is untouched
    }
    if (jobId) this.jobs.set(jobId, { timestamp: freshTimestamp });
    return { id: jobId, timestamp: freshTimestamp };
  }

  async getJob(jobId: string) {
    return this.jobs.get(jobId);
  }

  removeJob(jobId: string) {
    this.jobs.delete(jobId);
  }

  async getWorkers() {
    return this.workers;
  }
}

describe('VersionQueueService.enqueueCreateVersion', () => {
  let queue: FakeQueue;
  let notify: jest.Mock;
  let service: VersionQueueService;

  beforeEach(() => {
    queue = new FakeQueue();
    notify = jest.fn().mockResolvedValue(undefined);
    service = new VersionQueueService(queue as any, { notify } as any);
  });

  it("adds a create job with a jobId that fits BullMQ's 3-segment custom-id rule, no retries, and a panel-only started notification", async () => {
    await service.enqueueCreateVersion({
      organizationId: 'o',
      userId: 'u',
      appId: 'a',
      appName: 'App',
      dto: { versionName: 'v2', branchId: 'b' } as any,
    });
    const { name, opts } = queue.added[0];
    expect(name).toBe('version-create');
    expect(opts).toMatchObject({ attempts: 1, removeOnComplete: true, removeOnFail: true });
    // BullMQ's Job.validateOptions throws "Custom Id cannot contain :" for a jobId containing ':'
    // unless it splits into exactly 3 segments — branch+name must collapse into one opaque part.
    expect(opts.jobId.split(':')).toHaveLength(3);
    expect(opts.jobId.startsWith('version-create:a:')).toBe(true);
    expect(opts.jobId).not.toContain('v2'); // no raw version name leaked into the id
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        toast: false,
        userId: 'u',
        metadata: expect.objectContaining({
          source: 'app-version',
          action: 'version-create',
          appId: 'a',
          versionName: 'v2',
        }),
      })
    );
  });

  it("the jobId passes BullMQ's real custom-id validation (no Redis needed — validateOptions is pure)", async () => {
    await service.enqueueCreateVersion({
      organizationId: 'o',
      userId: 'u',
      appId: 'a',
      appName: 'App',
      dto: { versionName: 'v2', branchId: 'b' } as any,
    });
    const opts = queue.added[0].opts;
    // validateOptions only reads this.opts/this.toKey/this.queueQualifiedName at construction — no
    // Redis client is ever touched, so a bare stand-in queue is enough to run BullMQ's real check.
    const fakeQueueForJob = { toKey: (k: string) => k, qualifiedName: 'test', keys: {} } as any;
    const probe = new Job(fakeQueueForJob, 'version-create', {}, opts);
    expect(() => probe.validateOptions({ data: '{}' } as any)).not.toThrow();
  });

  it('different versionName/branchId produce different jobIds (fingerprint is not a constant)', async () => {
    await service.enqueueCreateVersion({
      organizationId: 'o',
      userId: 'u',
      appId: 'a',
      appName: 'App',
      dto: { versionName: 'v2', branchId: 'b' } as any,
    });
    await service.enqueueCreateVersion({
      organizationId: 'o',
      userId: 'u',
      appId: 'a',
      appName: 'App',
      dto: { versionName: 'v3', branchId: 'b' } as any,
    });
    expect(queue.added[0].opts.jobId).not.toBe(queue.added[1].opts.jobId);
  });

  it('dedupes identical submits: same jobId, same started dedupeKey while the job is still live', async () => {
    const p: CreateVersionJobPayload = {
      organizationId: 'o',
      userId: 'u',
      appId: 'a',
      appName: 'App',
      dto: { versionName: 'v2', branchId: 'b' } as any,
    };
    await service.enqueueCreateVersion(p);
    await service.enqueueCreateVersion(p);
    const jobIds = queue.added.map((j) => j.opts.jobId);
    expect(new Set(jobIds).size).toBe(1);
    // both "started" notifications carry the same dedupeKey → NotificationService inserts one row
    const keys = notify.mock.calls.map(([params]) => params.dedupeKey);
    expect(keys[0]).toEqual(keys[1]);
    expect(keys[0]).toMatch(new RegExp(`^${jobIds[0]}:\\d+:started$`));
  });

  it('concurrent double-submit (Promise.all) still dedupes to one started notification — no check-then-act race', async () => {
    const p: CreateVersionJobPayload = {
      organizationId: 'o',
      userId: 'u',
      appId: 'a',
      appName: 'App',
      dto: { versionName: 'v2', branchId: 'b' } as any,
    };
    // Both calls race to add() the same jobId; the fake models BullMQ's dedup no-op returning its
    // own fresh (and therefore untrustworthy) timestamp on the losing call — the fix reads the
    // real, persisted timestamp back via getJob() *after* add() resolves, so both converge on the
    // same value regardless of which call actually won the insert.
    await Promise.all([service.enqueueCreateVersion(p), service.enqueueCreateVersion(p)]);
    const jobIds = queue.added.map((j) => j.opts.jobId);
    expect(new Set(jobIds).size).toBe(1);
    const keys = notify.mock.calls.map(([params]) => params.dedupeKey);
    expect(keys[0]).toEqual(keys[1]);
  });

  it('notify rejects → enqueueCreateVersion still resolves (job is already added)', async () => {
    notify.mockRejectedValue(new Error('redis down'));
    await expect(
      service.enqueueCreateVersion({
        organizationId: 'o',
        userId: 'u',
        appId: 'a',
        appName: 'App',
        dto: { versionName: 'v2', branchId: 'b' } as any,
      })
    ).resolves.toBeUndefined();
    expect(queue.added).toHaveLength(1);
  });

  it('a retry after the previous job was swept (removeOnFail) gets a distinct started dedupeKey', async () => {
    const p: CreateVersionJobPayload = {
      organizationId: 'o',
      userId: 'u',
      appId: 'a',
      appName: 'App',
      dto: { versionName: 'v2', branchId: 'b' } as any,
    };
    await service.enqueueCreateVersion(p);
    const firstJobId = queue.added[0].opts.jobId;
    queue.removeJob(firstJobId); // simulate removeOnFail having swept the finished job
    await service.enqueueCreateVersion(p);

    expect(queue.added[1].opts.jobId).toBe(firstJobId); // jobId is deterministic and reused
    const keys = notify.mock.calls.map(([params]) => params.dedupeKey);
    expect(keys[0]).not.toEqual(keys[1]); // but the retry gets its own notification row
  });
});

describe('VersionQueueProcessor', () => {
  const payload: CreateVersionJobPayload = {
    organizationId: 'o',
    userId: 'u',
    appId: 'a',
    appName: 'App',
    dto: { versionName: 'v2', branchId: 'b' } as any,
  };

  let appsRepo: { findById: jest.Mock };
  let versionService: { createVersion: jest.Mock };
  let notify: jest.Mock;
  let userRepoFindOne: jest.Mock;
  let processor: VersionQueueProcessor;

  beforeEach(() => {
    appsRepo = { findById: jest.fn() };
    versionService = { createVersion: jest.fn() };
    notify = jest.fn().mockResolvedValue(undefined);
    userRepoFindOne = jest.fn();
    (getConnectionInstance as jest.Mock).mockReturnValue({ manager: { findOneOrFail: userRepoFindOne } });
    processor = new VersionQueueProcessor(versionService as any, appsRepo as any, { notify } as any);
  });

  it('processor hydrates app via AppsRepository.findById and sets user.organizationId', async () => {
    appsRepo.findById.mockResolvedValue({ id: 'a', type: 'front-end' });
    userRepoFindOne.mockResolvedValue({ id: 'u' });
    versionService.createVersion.mockResolvedValue({ id: 'v-new', name: 'v2' });
    const out = await processor.process({ name: 'version-create', data: payload } as any);
    expect(appsRepo.findById).toHaveBeenCalledWith('a', 'o', undefined, 'b');
    expect(versionService.createVersion).toHaveBeenCalledWith(
      { id: 'a', type: 'front-end' },
      expect.objectContaining({ id: 'u', organizationId: 'o', branchId: 'b' }),
      payload.dto
    );
    expect(out).toEqual({ versionId: 'v-new' });
  });

  it('onCompleted emits success notification with versionId, toast:false, and a timestamp-scoped dedupeKey', async () => {
    await processor.onCompleted({ id: 'j1', data: payload, timestamp: 111 } as any, { versionId: 'v-new' });
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        toast: false,
        title: 'Version created',
        dedupeKey: 'j1:111:completed',
        metadata: expect.objectContaining({
          source: 'app-version',
          action: 'version-create',
          appId: 'a',
          versionId: 'v-new',
        }),
      })
    );
  });

  it('onCompleted dedupeKey differs for a retried job (same id, new timestamp — dedupeKeys persist forever)', async () => {
    await processor.onCompleted({ id: 'j1', data: payload, timestamp: 111 } as any, { versionId: 'v-new' });
    await processor.onCompleted({ id: 'j1', data: payload, timestamp: 222 } as any, { versionId: 'v-new-2' });
    const keys = notify.mock.calls.map(([p]) => p.dedupeKey);
    expect(keys[0]).not.toEqual(keys[1]);
  });

  it('raw (non-HTTP) worker error → generic curated body + metadata.error, keeps "Please try again"', async () => {
    await processor.onFailed(
      { id: 'j1', data: payload, attemptsMade: 1, opts: { attempts: 1 }, timestamp: 111 } as any,
      new Error('Only one draft version is allowed when branching is enabled.')
    );
    const call = notify.mock.calls[0][0];
    expect(call).toMatchObject({
      type: 'error',
      toast: true,
      body: "Couldn't create version v2. Please try again.",
      dedupeKey: 'j1:111:failed',
      metadata: expect.objectContaining({ error: 'Unexpected error while creating the version.' }),
    });
    expect(call.body).not.toContain('Only one draft');
  });

  it('HttpException failure → curated body drops "Please try again", metadata.error is the exception message', async () => {
    await processor.onFailed(
      { id: 'j1', data: payload, timestamp: 111 } as any,
      new BadRequestException('Version name already exists.')
    );
    const call = notify.mock.calls[0][0];
    expect(call).toMatchObject({
      body: "Couldn't create version v2.",
      metadata: expect.objectContaining({ error: 'Version name already exists.' }),
    });
  });

  it('QueryFailedError 23505 on the single-draft index → curated deterministic message', async () => {
    const driverError = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: DataBaseConstraints.APP_VERSION_APP_DEFAULT_BRANCH_DRAFT_UNIQUE,
    });
    await processor.onFailed(
      { id: 'j1', data: payload, timestamp: 111 } as any,
      new QueryFailedError('insert', [], driverError as any)
    );
    const call = notify.mock.calls[0][0];
    expect(call).toMatchObject({
      body: "Couldn't create version v2.",
      metadata: expect.objectContaining({
        error: 'Only one draft version is allowed when branching is enabled.',
      }),
    });
  });

  it('QueryFailedError 23505 on the name index → curated deterministic message', async () => {
    const driverError = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: DataBaseConstraints.APP_VERSION_NAME_UNIQUE,
    });
    await processor.onFailed(
      { id: 'j1', data: payload, timestamp: 111 } as any,
      new QueryFailedError('insert', [], driverError as any)
    );
    const call = notify.mock.calls[0][0];
    expect(call).toMatchObject({
      body: "Couldn't create version v2.",
      metadata: expect.objectContaining({ error: 'Version name already exists.' }),
    });
  });

  it('QueryFailedError 23505 on an unrecognized constraint → generic, keeps "Please try again"', async () => {
    const driverError = Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'some_other_index' });
    await processor.onFailed(
      { id: 'j1', data: payload, timestamp: 111 } as any,
      new QueryFailedError('insert', [], driverError as any)
    );
    const call = notify.mock.calls[0][0];
    expect(call).toMatchObject({
      body: "Couldn't create version v2. Please try again.",
      metadata: expect.objectContaining({ error: 'Unexpected error while creating the version.' }),
    });
  });

  it('onFailed dedupeKey differs for a retried job (same id, new timestamp — dedupeKeys persist forever)', async () => {
    await processor.onFailed({ id: 'j1', data: payload, attemptsMade: 1, timestamp: 111 } as any, new Error('e1'));
    await processor.onFailed({ id: 'j1', data: payload, attemptsMade: 1, timestamp: 222 } as any, new Error('e2'));
    const keys = notify.mock.calls.map(([p]) => p.dedupeKey);
    expect(keys[0]).not.toEqual(keys[1]);
  });

  it('onCompleted/onFailed never throw when notify fails', async () => {
    notify.mockRejectedValue(new Error('db down'));
    await expect(
      processor.onCompleted({ id: 'j1', data: payload, timestamp: 111 } as any, { versionId: 'x' })
    ).resolves.toBeUndefined();
  });
});
