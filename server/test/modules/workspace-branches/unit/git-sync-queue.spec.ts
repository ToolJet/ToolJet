import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { GitSyncQueueService, GIT_SYNC_JOBS } from '@ee/workspace-branches/git-sync-queue.service';
import { GitSyncQueueProcessor } from '@ee/workspace-branches/git-sync-queue.processor';
import { WorkspaceBranchService } from '@ee/workspace-branches/service';
import { RedisService } from '@modules/redis/service';

/**
 * Unit tests for the git-sync queue plumbing (no real Redis/BullMQ/git/DB):
 *  - GitSyncQueueService: enqueue side — deterministic jobIds dedup double-clicks.
 *  - GitSyncQueueProcessor: worker side — dispatches by job name under a per-org
 *    Redis lease so two replicas never run git ops for the same org at once.
 */

/** The narrow slice of a BullMQ Queue the enqueue service uses. */
interface QueueLike {
  add(name: string, data: unknown, opts?: Record<string, unknown>): Promise<unknown>;
  getWorkers(): Promise<unknown[]>;
}

/** Records every add() so tests can assert name / payload / jobId / opts. */
class FakeQueue implements QueueLike {
  added: { name: string; data: any; opts: any }[] = [];
  workers: unknown[] = [{}]; // default: one worker present, no warning path
  async add(name: string, data: any, opts?: any) {
    this.added.push({ name, data, opts });
    return { id: opts?.jobId };
  }
  async getWorkers() {
    return this.workers;
  }
}

/**
 * The narrow slice of an ioredis client the processor's org-lease uses.
 * set(key, value, 'PX', ttl, 'NX') -> 'OK' when free, null when held.
 */
class FakeRedisClient {
  store = new Map<string, string>();
  ops: string[] = []; // interleaving log: lease ops + (test-pushed) service calls

  async set(key: string, value: string, _px: string, _ttl: number, _nx: string): Promise<'OK' | null> {
    if (this.store.has(key)) return null;
    this.store.set(key, value);
    this.ops.push(`acquire:${key}`);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async del(key: string): Promise<number> {
    const had = this.store.delete(key);
    if (had) this.ops.push(`release:${key}`);
    return had ? 1 : 0;
  }
}

class FakeRedisService {
  client = new FakeRedisClient();
  getClient() {
    return this.client;
  }
}

/** Records which execute* method the processor dispatched to. */
class FakeWorkspaceBranchService {
  calls: { method: string; payload: any }[] = [];
  executeCreateBranch = async (payload: any) => {
    this.calls.push({ method: 'executeCreateBranch', payload });
  };
  executePullBranch = async (payload: any) => {
    this.calls.push({ method: 'executePullBranch', payload });
  };
  executeDeleteBranch = async (payload: any) => {
    this.calls.push({ method: 'executeDeleteBranch', payload });
  };
  executePushAppDeletion = async (payload: any) => {
    this.calls.push({ method: 'executePushAppDeletion', payload });
  };
}

const makeJob = (name: string, data: any) => ({ name, data }) as any;

describe('GitSyncQueueService (enqueue side)', () => {
  let queue: FakeQueue;
  let svc: GitSyncQueueService;
  let notify: jest.Mock;

  beforeEach(() => {
    queue = new FakeQueue();
    notify = jest.fn().mockResolvedValue(undefined);
    svc = new GitSyncQueueService(
      queue as unknown as ConstructorParameters<typeof GitSyncQueueService>[0],
      { notify } as unknown as ConstructorParameters<typeof GitSyncQueueService>[1]
    );
  });

  it('should enqueue git-create-branch with a deterministic org+name jobId', async () => {
    await svc.enqueueCreateBranch({
      organizationId: 'org1',
      name: 'feature-x',
      sourceBranchId: 'src-branch-id',
      userId: 'user1',
    });

    expect(queue.added).toHaveLength(1);
    expect(queue.added[0]).toMatchObject({
      name: GIT_SYNC_JOBS.CREATE_BRANCH,
      data: {
        organizationId: 'org1',
        name: 'feature-x',
        sourceBranchId: 'src-branch-id',
        userId: 'user1',
      },
      opts: {
        jobId: 'git-create-branch:org1:feature-x',
        attempts: 3,
        backoff: { type: 'exponential', delay: expect.any(Number) },
        removeOnComplete: true,
        // Failed jobs must release their jobId so the user can simply retry.
        removeOnFail: true,
      },
    });
  });

  it('should emit a panel-only (toast:false) info notification when a create-branch job is enqueued', async () => {
    await svc.enqueueCreateBranch({
      organizationId: 'org1',
      name: 'feature-x',
      sourceBranchId: 'src-branch-id',
      userId: 'user1',
    });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toMatchObject({
      type: 'info',
      userId: 'user1',
      organizationId: 'org1',
      title: 'Branch creation started',
      body: 'Creating branch feature-x. It will appear in the branch list once ready.',
      toast: false,
    });
  });

  it('should emit a panel-only info notification when a pull-branch job is enqueued', async () => {
    await svc.enqueuePullBranch({
      organizationId: 'org1',
      branchId: 'branch-uuid',
      branchName: 'main',
      userId: 'user1',
    });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toMatchObject({
      type: 'info',
      title: 'Pull started',
      body: 'Pulling the latest changes. They will be available in a moment.',
      toast: false,
    });
  });

  it('should not fail the enqueue when the started notification throws', async () => {
    notify.mockRejectedValue(new Error('db down'));
    await expect(
      svc.enqueueCreateBranch({ organizationId: 'org1', name: 'x', sourceBranchId: 's', userId: 'u' })
    ).resolves.not.toThrow();
    expect(queue.added).toHaveLength(1);
  });

  it('should enqueue git-pull-branch keyed by org+branchId', async () => {
    await svc.enqueuePullBranch({
      organizationId: 'org1',
      branchId: 'branch-uuid',
      branchName: 'main',
      userId: 'user1',
    });

    expect(queue.added[0]).toMatchObject({
      name: GIT_SYNC_JOBS.PULL_BRANCH,
      opts: { jobId: 'git-pull-branch:org1:branch-uuid' },
    });
  });

  it('should enqueue git-delete-branch keyed by org+branchId', async () => {
    await svc.enqueueDeleteBranch({
      organizationId: 'org1',
      branchId: 'branch-uuid',
      branchName: 'feature-x',
      userId: 'u',
    });

    expect(queue.added[0]).toMatchObject({
      name: GIT_SYNC_JOBS.DELETE_BRANCH,
      data: { organizationId: 'org1', branchId: 'branch-uuid', branchName: 'feature-x' },
      opts: { jobId: 'git-delete-branch:org1:branch-uuid' },
    });
  });

  it('should enqueue git-push-app-deletion with a coalescing delay', async () => {
    // The worker diffs DB vs git meta, so one delayed job sweeps every app
    // deleted in a burst — jobId dedup + delay make the coalescing window.
    await svc.enqueuePushAppDeletion({ organizationId: 'org1', branchId: 'branch-uuid', userId: 'u' });

    expect(queue.added[0]).toMatchObject({
      name: GIT_SYNC_JOBS.PUSH_APP_DELETION,
      opts: {
        jobId: 'git-push-app-deletion:org1:branch-uuid',
        delay: expect.any(Number),
      },
    });
    expect(queue.added[0].opts.delay).toBeGreaterThan(0);
  });

  it('should produce the same jobId for the same inputs (dedup key)', async () => {
    // BullMQ ignores add() for a jobId that is already waiting/active —
    // determinism here IS the double-click guard.
    await svc.enqueueCreateBranch({ organizationId: 'org1', name: 'b', sourceBranchId: 's', userId: 'u' });
    await svc.enqueueCreateBranch({ organizationId: 'org1', name: 'b', sourceBranchId: 's', userId: 'u' });
    expect(queue.added[0].opts.jobId).toBe(queue.added[1].opts.jobId);
  });

  it('should never put tokens or secrets into a job payload', async () => {
    // The worker re-resolves git credentials from org config at run time.
    // Job payloads live in Redis — secrets must not.
    await svc.enqueueCreateBranch({
      organizationId: 'org1',
      name: 'b',
      sourceBranchId: 's',
      userId: 'u',
    } as any);
    await svc.enqueuePullBranch({ organizationId: 'org1', branchId: 'b1', branchName: 'main', userId: 'u' } as any);
    await svc.enqueueDeleteBranch({ organizationId: 'org1', branchName: 'b' } as any);

    for (const { data } of queue.added) {
      const keys = Object.keys(data).map((k) => k.toLowerCase());
      expect(keys.some((k) => k.includes('token') || k.includes('secret') || k.includes('password'))).toBe(false);
    }
  });
});

describe('GitSyncQueueProcessor dispatch', () => {
  let service: FakeWorkspaceBranchService;
  let redis: FakeRedisService;
  let processor: GitSyncQueueProcessor;

  beforeEach(() => {
    service = new FakeWorkspaceBranchService();
    redis = new FakeRedisService();
    processor = new GitSyncQueueProcessor(service as any, redis as any);
    (GitSyncQueueProcessor as any).LEASE_RETRY_MS = 1; // fast contention retries in tests
  });

  afterEach(() => {
    delete (GitSyncQueueProcessor as any).LEASE_RETRY_MS;
  });

  it('should route git-create-branch jobs to executeCreateBranch', async () => {
    const payload = { organizationId: 'org1', name: 'b', sourceBranchId: 's', userId: 'u' };
    await processor.process(makeJob(GIT_SYNC_JOBS.CREATE_BRANCH, payload));
    expect(service.calls).toEqual([{ method: 'executeCreateBranch', payload }]);
  });

  it('should route git-pull-branch jobs to executePullBranch', async () => {
    const payload = { organizationId: 'org1', branchId: 'b1', branchName: 'main', userId: 'u' };
    await processor.process(makeJob(GIT_SYNC_JOBS.PULL_BRANCH, payload));
    expect(service.calls).toEqual([{ method: 'executePullBranch', payload }]);
  });

  it('should route git-delete-branch jobs to executeDeleteBranch', async () => {
    const payload = { organizationId: 'org1', branchId: 'b1', branchName: 'b', userId: 'u' };
    await processor.process(makeJob(GIT_SYNC_JOBS.DELETE_BRANCH, payload));
    expect(service.calls).toEqual([{ method: 'executeDeleteBranch', payload }]);
  });

  it('should route git-push-app-deletion jobs to executePushAppDeletion', async () => {
    const payload = { organizationId: 'org1', branchId: 'b1', userId: 'u' };
    await processor.process(makeJob(GIT_SYNC_JOBS.PUSH_APP_DELETION, payload));
    expect(service.calls).toEqual([{ method: 'executePushAppDeletion', payload }]);
  });

  it('should ignore an unknown job name without throwing', async () => {
    await expect(processor.process(makeJob('not-a-real-job', {}))).resolves.toBeUndefined();
    expect(service.calls).toEqual([]);
  });
});

describe('GitSyncQueueProcessor per-org lease', () => {
  // Two worker replicas must never run git ops for the SAME org concurrently
  // (workspace git-sync is one repo per org). The object cache's withLock only
  // serializes within one process — this Redis lease covers the fleet.
  let service: FakeWorkspaceBranchService;
  let redis: FakeRedisService;
  let processor: GitSyncQueueProcessor;

  beforeEach(() => {
    service = new FakeWorkspaceBranchService();
    redis = new FakeRedisService();
    processor = new GitSyncQueueProcessor(service as any, redis as any);
    (GitSyncQueueProcessor as any).LEASE_RETRY_MS = 1;
  });

  afterEach(() => {
    delete (GitSyncQueueProcessor as any).LEASE_RETRY_MS;
  });

  it('should acquire the org lease before the service call and release it after', async () => {
    service.executeCreateBranch = async () => {
      redis.client.ops.push('service-ran');
    };

    await processor.process(makeJob(GIT_SYNC_JOBS.CREATE_BRANCH, { organizationId: 'org1' }));

    const leaseKey = redis.client.ops.find((o) => o.startsWith('acquire:'))?.slice('acquire:'.length);
    expect(leaseKey).toContain('org1');
    expect(redis.client.ops).toEqual([`acquire:${leaseKey}`, 'service-ran', `release:${leaseKey}`]);
  });

  it('should wait for a held lease and run once it is released', async () => {
    // Simulate another replica holding org1's lease, then releasing it.
    const leaseKeyOf = (org: string) =>
      [...redis.client.store.keys()].find((k) => k.includes(org)) ?? `tj:git-sync:lease:${org}`;
    await redis.client.set(`tj:git-sync:lease:org1`, 'other-replica', 'PX', 60000, 'NX');

    const run = processor.process(makeJob(GIT_SYNC_JOBS.CREATE_BRANCH, { organizationId: 'org1' }));

    // Give the processor a few retry cycles — it must still be waiting.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(service.calls).toEqual([]);

    await redis.client.del(leaseKeyOf('org1')); // other replica finishes
    await run;
    expect(service.calls).toHaveLength(1);
  });

  it('should release the lease even when the service call throws (job then retries)', async () => {
    service.executeCreateBranch = async () => {
      throw new Error('hydrate blew up');
    };

    // The rejection must propagate (that's what makes BullMQ retry the job)...
    await expect(processor.process(makeJob(GIT_SYNC_JOBS.CREATE_BRANCH, { organizationId: 'org1' }))).rejects.toThrow(
      'hydrate blew up'
    );

    // ...but the lease must NOT stay held — otherwise every later job for this
    // org waits out the full TTL.
    expect(redis.client.store.size).toBe(0);
  });

  it('should serialize same-org jobs but not block a different org', async () => {
    let releaseFirst!: () => void;
    const firstHolds = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const order: string[] = [];

    service.executeCreateBranch = async (p: any) => {
      order.push(`start:${p.organizationId}:${p.name}`);
      if (p.name === 'slow') await firstHolds;
      order.push(`end:${p.organizationId}:${p.name}`);
    };

    const slow = processor.process(makeJob(GIT_SYNC_JOBS.CREATE_BRANCH, { organizationId: 'org1', name: 'slow' }));
    const sameOrg = processor.process(makeJob(GIT_SYNC_JOBS.CREATE_BRANCH, { organizationId: 'org1', name: 'queued' }));
    const otherOrg = processor.process(makeJob(GIT_SYNC_JOBS.CREATE_BRANCH, { organizationId: 'org2', name: 'free' }));

    await otherOrg; // org2 must finish while org1's first job still holds the lease
    expect(order).toContain('end:org2:free');
    expect(order).not.toContain('start:org1:queued');

    releaseFirst();
    await Promise.all([slow, sameOrg]);
    expect(order.indexOf('start:org1:queued')).toBeGreaterThan(order.indexOf('end:org1:slow'));
  });
});

describe('GitSyncQueueProcessor failed-event hook', () => {
  // removeOnFail erases dead jobs from Bull Board — the onFailed log line is the
  // only durable trail. It must never itself throw, even with a missing job.
  it('should survive a failed event with an undefined job', () => {
    const processor = new GitSyncQueueProcessor(new FakeWorkspaceBranchService() as any, new FakeRedisService() as any);
    expect(() => processor.onFailed(undefined, new Error('worker died'))).not.toThrow();
  });
});

describe('WorkspaceBranchService.executeDeleteRemoteBranch (remote-ref helper)', () => {
  // executeDeleteBranch (remote + DB) delegates the remote half here. Retries on
  // an already-deleted remote branch would loop pointlessly — "gone" must count
  // as success, which is also what lets executeDeleteBranch proceed to the DB
  // delete. Only the first two constructor deps (provider, logger) are touched.
  const makeService = (deleteGitBranch?: (orgId: string, name: string) => Promise<void>) => {
    const provider = {
      getSourceControlService: async () => (deleteGitBranch ? { deleteGitBranch } : {}),
    };
    const logger = { log: jest.fn() };
    const rest = Array(12).fill({});
    return new (WorkspaceBranchService as any)(provider, logger, ...rest) as InstanceType<
      typeof WorkspaceBranchService
    >;
  };

  it('should treat a 404 from the provider as success', async () => {
    const svc = makeService(async () => {
      const err: any = new Error('Branch not found');
      err.status = 404;
      throw err;
    });
    await expect(svc.executeDeleteRemoteBranch({ organizationId: 'org1', branchName: 'b' })).resolves.toBeUndefined();
  });

  it('should treat "Reference does not exist" as success', async () => {
    const svc = makeService(async () => {
      throw new Error('Reference does not exist');
    });
    await expect(svc.executeDeleteRemoteBranch({ organizationId: 'org1', branchName: 'b' })).resolves.toBeUndefined();
  });

  it('should rethrow other errors so BullMQ retries', async () => {
    const svc = makeService(async () => {
      throw new Error('rate limited');
    });
    await expect(svc.executeDeleteRemoteBranch({ organizationId: 'org1', branchName: 'b' })).rejects.toThrow(
      'rate limited'
    );
  });

  it('should no-op when the provider has no deleteGitBranch', async () => {
    const svc = makeService(undefined);
    await expect(svc.executeDeleteRemoteBranch({ organizationId: 'org1', branchName: 'b' })).resolves.toBeUndefined();
  });
});

/**
 * The fakes only help if they mirror the REAL APIs (ts-jest diagnostics are off,
 * so these RUNTIME checks are what catch drift — same pattern as the
 * git-object-cache spec).
 */
describe('fakes stay faithful to the real APIs', () => {
  it('RedisService still exposes getClient', () => {
    expect(typeof RedisService.prototype.getClient).toBe('function');
  });

  it('a BullMQ Queue exposes every method the enqueue service uses', () => {
    for (const method of ['add', 'getWorkers']) {
      expect(typeof (Queue.prototype as any)[method]).toBe('function');
    }
  });

  it('an ioredis client exposes every method the lease uses', () => {
    for (const method of ['set', 'get', 'del']) {
      expect(typeof (Redis.prototype as any)[method]).toBe('function');
    }
  });
});
