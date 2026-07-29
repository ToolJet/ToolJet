import Redis from 'ioredis';
import { GitObjectCacheService } from '@ee/git-sync-configs/services/git-object-cache.service';
import { RedisService } from '@modules/redis/service';

/**
 * The narrow slice of a Redis pub/sub connection this service actually uses.
 * The fakes below `implements` this so their method shapes are checked while
 * authoring (and by `tsc`/IDE). NOTE: jest here runs ts-jest with
 * `diagnostics: false`, so type errors do NOT fail `npm test` — that's why the
 * `as any` injection is the repo convention. The contract is instead enforced
 * at RUNTIME by the "real Redis surface" test at the bottom of this file, which
 * fails if RedisService or ioredis drops a method the fake stands in for.
 */
interface RedisPubSubConnection {
  subscribe(channel: string): Promise<unknown>;
  on(event: 'message', handler: (channel: string, message: string) => void): unknown;
  publish(channel: string, message: string): Promise<unknown>;
  unsubscribe(channel: string): Promise<unknown>;
  disconnect(): void;
}
interface RedisPubSubFactory {
  createSubscriber(): RedisPubSubConnection;
  createPublisher(): RedisPubSubConnection;
}

/**
 * WHAT IS THIS SERVICE?
 * ---------------------
 * Git-sync normally runs a full `git clone` from GitHub on every action
 * (create branch, pull, push, open an app). That re-downloads the repo every
 * time and is slow. GitObjectCacheService keeps ONE local copy of each repo
 * (called a "mirror") and reuses it, so later clones only download what changed.
 *
 * Because pods (server instances) don't share disk, each pod keeps its own
 * mirror. When a repo is disconnected on one pod, it tells all the other pods
 * to delete their copy too — using Redis publish/subscribe (a message bus).
 *
 * These are pure unit tests — no real git, no real Redis, no database.
 */

/**
 * A fake stand-in for ONE Redis connection.
 *
 * We don't want a real Redis server in a unit test, so this class just RECORDS
 * what the service asked it to do (what channels it subscribed to, what it
 * published, whether it disconnected). Tests then read those records to confirm
 * the service behaved correctly. `deliver()` lets a test pretend a message
 * arrived from another pod.
 */
class FakeRedis implements RedisPubSubConnection {
  subscribed: string[] = []; // channels the service subscribed to
  published: { channel: string; message: string }[] = []; // messages the service sent
  unsubscribed: string[] = []; // channels the service left
  disconnected = false; // did the service close this connection?

  // The service registers a callback to run whenever a message arrives.
  // We hold onto it so a test can trigger it via deliver().
  private messageHandlers: ((channel: string, message: string) => void)[] = [];

  async subscribe(channel: string) {
    this.subscribed.push(channel);
  }

  // Real ioredis uses .on('message', cb). We only care about 'message'.
  on(event: string, handler: (channel: string, message: string) => void) {
    if (event === 'message') this.messageHandlers.push(handler);
    return this;
  }

  async publish(channel: string, message: string) {
    this.published.push({ channel, message });
    return 1;
  }

  async unsubscribe(channel: string) {
    this.unsubscribed.push(channel);
  }

  disconnect() {
    this.disconnected = true;
  }

  // Test helper: pretend another pod published this message. The service's
  // handler is async (it deletes a folder from disk), so we return its promise
  // and let the test `await` it — that way the deletion is finished before we
  // check the result.
  deliver(channel: string, message: string) {
    return Promise.all(this.messageHandlers.map((h) => h(channel, message)));
  }
}

/**
 * The real RedisService hands out two separate connections: one to LISTEN for
 * messages (subscriber) and one to SEND them (publisher). Our fake does the
 * same, so a test can inspect each side independently.
 */
class FakeRedisService implements RedisPubSubFactory {
  subscriber = new FakeRedis();
  publisher = new FakeRedis();
  createSubscriber() {
    return this.subscriber;
  }
  createPublisher() {
    return this.publisher;
  }
}

describe('GitObjectCacheService.mirrorPathFor', () => {
  // This group does NOT use Redis, so we pass an empty object as the Redis
  // dependency. `{} as any` means "ignore the type — we won't call Redis here".
  const svc = new GitObjectCacheService({} as any);

  afterEach(() => {
    // Clear EVERY knob a test (or a prior spec file) could leave set. ROOT is a
    // static on the class — process-global across spec files — so the path-shape
    // assertions below would silently change if it leaked in. Reset all four.
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    delete process.env.GIT_OBJECT_CACHE_DIR;
    delete (GitObjectCacheService as any).ROOT;
  });

  it('gives the same repo the same folder, and different orgs different folders', () => {
    // Same org + same repo url -> must always map to the SAME folder (so the
    // mirror is reused). A different org -> a DIFFERENT folder (orgs are isolated).
    const a = svc.mirrorPathFor('org1', 'https://github.com/acme/repo.git');
    const b = svc.mirrorPathFor('org1', 'https://github.com/acme/repo.git');
    const c = svc.mirrorPathFor('org2', 'https://github.com/acme/repo.git');

    expect(a).toBe(b); // same inputs -> same path (reusable)
    expect(a).not.toBe(c); // different org -> different path (isolated)
    // The folder name is a 64-char hash (sha256) ending in .git.
    expect(a).toMatch(/tj-git-cache\/[a-f0-9]{64}\.git$/);
  });

  it('never puts the auth token into the folder path', () => {
    // A repo url can contain a secret token. The mirror path is derived from a
    // hash of the CLEANED url, so the secret must not appear on disk anywhere.
    const p = svc.mirrorPathFor('org1', 'https://x-access-token:SECRET@github.com/acme/repo.git');
    expect(p).not.toContain('SECRET');
  });

  it('is on by default, off only when DISABLE_GIT_OBJECT_CACHE=true', () => {
    // Feature defaults ON. Opt out with DISABLE_GIT_OBJECT_CACHE=true.
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    expect(svc.isEnabled()).toBe(true);
    process.env.DISABLE_GIT_OBJECT_CACHE = 'true';
    expect(svc.isEnabled()).toBe(false);
  });
});

describe('GitObjectCacheService.authConfigArgs', () => {
  const svc = new GitObjectCacheService({} as any);

  afterEach(() => {
    // Defensive: this block sets nothing, but a leaked ROOT/env from another
    // spec file in the same worker shouldn't survive past here.
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    delete process.env.GIT_OBJECT_CACHE_DIR;
    delete (GitObjectCacheService as any).ROOT;
  });

  it('passes the token to git as a one-time header, never written to disk', () => {
    // We hand git the token via a `-c http.extraHeader=...` flag that lives only
    // for that single command — git never saves it to a config file.
    const args = svc.authConfigArgs('ghs_TOKEN123');

    expect(args[0]).toBe('-c'); // git's "use this config for this command only" flag
    const header = args[1];
    expect(header).toMatch(/^http\.extraHeader=Authorization: Basic /);

    // The raw token must not appear in plain text...
    expect(header).not.toContain('ghs_TOKEN123');
    // ...because it's base64-encoded as `x-access-token:<token>`. Decode it to
    // prove the right value is in there (base64 is encoding, not encryption —
    // the point here is format, not secrecy).
    const b64 = header.split('Basic ')[1];
    expect(Buffer.from(b64, 'base64').toString()).toBe('x-access-token:ghs_TOKEN123');
  });
});

describe('GitObjectCacheService root dir resolution', () => {
  afterEach(() => {
    delete process.env.GIT_OBJECT_CACHE_DIR;
    // ROOT is a hidden "test seam" we set to force a specific folder. Clear it
    // so it doesn't leak into other test files.
    delete (GitObjectCacheService as any).ROOT;
  });

  it('uses GIT_OBJECT_CACHE_DIR when that env var is set', () => {
    // Ops can point the cache at a specific volume (e.g. a sized disk in k8s).
    process.env.GIT_OBJECT_CACHE_DIR = '/some/base';
    const svc = new GitObjectCacheService({} as any);
    const p = svc.mirrorPathFor('org1', 'https://github.com/acme/repo.git');
    expect(p).toMatch(/^\/some\/base\/tj-git-cache\/[a-f0-9]{64}\.git$/);
  });

  it('falls back to the OS temp folder when no dir is configured', () => {
    const os = require('os');
    const path = require('path');
    const svc = new GitObjectCacheService({} as any);
    const p = svc.mirrorPathFor('org1', 'https://github.com/acme/repo.git');
    expect(p.startsWith(path.join(os.tmpdir(), 'tj-git-cache'))).toBe(true);
  });
});

describe('GitObjectCacheService eviction', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  let root: string;
  let svc: GitObjectCacheService;

  beforeEach(() => {
    // Give each test a fresh, empty temp folder to act as the cache root, and
    // point the service at it via the ROOT test seam.
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
    svc = new GitObjectCacheService({} as any);
    (GitObjectCacheService as any).ROOT = root;
  });

  afterEach(() => {
    delete (GitObjectCacheService as any).ROOT; // reset the seam — no cross-test leak
    delete process.env.GIT_OBJECT_CACHE_TTL_DAYS;
    delete process.env.GIT_OBJECT_CACHE_MAX_GB;
    fs.rmSync(root, { recursive: true, force: true }); // clean up the temp folder
  });

  // Helper: create a fake mirror folder named "<name>.git", `bytes` big, and
  // backdate its "last used" time by `ageDays`. We backdate by setting the
  // folder's modified-time (mtime) — the service treats mtime as "last used".
  const makeMirror = (name: string, ageDays: number, bytes = 10) => {
    const dir = path.join(root, name + '.git');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'HEAD'), 'x'.repeat(bytes)); // give it some size
    const whenSeconds = (Date.now() - ageDays * 86400_000) / 1000; // days -> ms -> seconds
    fs.utimesSync(dir, whenSeconds, whenSeconds); // pretend it was last used `ageDays` ago
    return dir;
  };

  it('deletes mirrors that have been idle longer than the TTL', async () => {
    const fresh = makeMirror('fresh', 1); // used yesterday -> keep
    const stale = makeMirror('stale', 30); // untouched for 30 days -> delete
    process.env.GIT_OBJECT_CACHE_TTL_DAYS = '14'; // anything older than 14 days goes

    await svc.pruneIdle();

    expect(fs.existsSync(fresh)).toBe(true);
    expect(fs.existsSync(stale)).toBe(false);
  });

  it('when over the size cap, deletes the least-recently-used mirror first', async () => {
    const old = makeMirror('old', 5, 1_000_000); // ~1MB, last used 5 days ago
    const recent = makeMirror('recent', 0, 1_000_000); // ~1MB, used today
    // 0.00143 GB ≈ 1.53 MB: enough for ONE ~1MB mirror but not two (~2MB total),
    // so exactly one must be dropped — and it should be the least-recently-used one.
    process.env.GIT_OBJECT_CACHE_MAX_GB = '0.00143';

    await svc.enforceSizeCap();

    expect(fs.existsSync(old)).toBe(false); // evicted
    expect(fs.existsSync(recent)).toBe(true); // kept
  });

  it('deletes exactly the mirror for one (org, repo) on demand', async () => {
    const p = svc.mirrorPathFor('orgX', 'https://github.com/a/b.git');
    fs.mkdirSync(p, { recursive: true });
    fs.writeFileSync(path.join(p, 'HEAD'), 'x');

    await svc.evict('orgX', 'https://github.com/a/b.git');

    expect(fs.existsSync(p)).toBe(false);
  });
});

describe('GitObjectCacheService.cachedSparseClone fallback', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  afterEach(() => {
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
  });

  // The most important safety property: if ANYTHING in the cache path fails, the
  // user's operation must still succeed by doing a normal clone instead. And the
  // temp folder must be clean first, because a normal clone expects an empty dir.
  it('on any cache error, cleans the temp dir and runs a normal clone instead', async () => {
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    const svc = new GitObjectCacheService({} as any);

    // Force the cache step to blow up, WITHOUT touching the network: we overwrite
    // the private ensureMirror method so it always throws.
    (svc as any).ensureMirror = async () => {
      throw new Error('boom');
    };

    // Simulate a half-finished cache attempt that left junk in the temp dir.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-fallback-'));
    fs.writeFileSync(path.join(tmpDir, 'leftover'), 'partial-clone debris');

    // `plainClone` is the normal-clone function the caller passes in. We don't
    // really clone here — we just record that it was called and whether the dir
    // was empty (clean) at that moment.
    let plainCloneDir: string | undefined;
    let dirWasEmpty = false;
    const plainClone = async (dir: string) => {
      plainCloneDir = dir;
      dirWasEmpty = fs.readdirSync(dir).length === 0;
    };

    await svc.cachedSparseClone({
      orgId: 'org1',
      cleanRepoUrl: 'https://github.com/a/b.git',
      token: 't',
      branch: 'main',
      tmpDir,
      paths: ['x'],
      plainClone,
    });

    expect(plainCloneDir).toBe(tmpDir); // the fallback actually ran
    expect(dirWasEmpty).toBe(true); // and the junk was cleared first

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // The flag-OFF path is the byte-for-byte "today's behavior" guarantee (and what
  // the CE stub does): go straight to plainClone WITHOUT building a mirror and
  // WITHOUT wiping the temp dir. Contrast with the error path above, which wipes.
  it('when the flag is off, calls plainClone directly and leaves the temp dir untouched', async () => {
    process.env.DISABLE_GIT_OBJECT_CACHE = 'true'; // off
    const svc = new GitObjectCacheService({} as any);

    // If the cache path were entered, this would throw — proving OFF skips it.
    (svc as any).ensureMirror = async () => {
      throw new Error('cache must not run when the flag is off');
    };

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-off-'));
    fs.writeFileSync(path.join(tmpDir, 'keep'), 'caller-prepared content');

    let plainCloneDir: string | undefined;
    let dirUntouched = false;
    const plainClone = async (dir: string) => {
      plainCloneDir = dir;
      dirUntouched = fs.existsSync(path.join(dir, 'keep')); // OFF must NOT wipe the dir
    };

    await svc.cachedSparseClone({
      orgId: 'org1',
      cleanRepoUrl: 'https://github.com/a/b.git',
      token: 't',
      branch: 'main',
      tmpDir,
      paths: ['x'],
      plainClone,
    });

    expect(plainCloneDir).toBe(tmpDir); // plainClone ran
    expect(dirUntouched).toBe(true); // and the dir was left exactly as the caller made it

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('GitObjectCacheService per-repo locking (withLock)', () => {
  // The cache must never run two git operations against the SAME mirror at once
  // (one clone reading while another fetch/evict writes = corruption). withLock
  // serializes per key. Different keys (different repos) must still run in parallel.
  let svc: GitObjectCacheService;
  beforeEach(() => {
    svc = new GitObjectCacheService({} as any);
  });

  // wait a few event-loop turns so queued lock work can progress
  const tick = () => new Promise((resolve) => setImmediate(resolve));

  it('runs two operations on the SAME key strictly one-after-another', async () => {
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstHoldsTheLock = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    // First op grabs the lock and HOLDS it until we release it.
    const first = (svc as any).withLock('repoA', async () => {
      events.push('A-start');
      await firstHoldsTheLock;
      events.push('A-end');
    });
    // Second op on the SAME key must wait for the first to fully finish.
    const second = (svc as any).withLock('repoA', async () => {
      events.push('B-start');
      events.push('B-end');
    });

    await tick(); // let the event loop run; B must still be blocked
    expect(events).toEqual(['A-start']); // B has not started

    releaseFirst(); // let A finish
    await Promise.all([first, second]);

    expect(events).toEqual(['A-start', 'A-end', 'B-start', 'B-end']); // strict order
  });

  it('runs operations on DIFFERENT keys concurrently', async () => {
    const events: string[] = [];
    let releaseA!: () => void;
    const aHoldsTheLock = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    const a = (svc as any).withLock('repoA', async () => {
      events.push('A-start');
      await aHoldsTheLock; // keep repoA's lock held
      events.push('A-end');
    });
    const b = (svc as any).withLock('repoB', async () => {
      events.push('B-start'); // different repo -> should not be blocked by A
      events.push('B-end');
    });

    await tick();
    expect(events).toContain('B-end'); // B finished while A is still holding repoA

    releaseA();
    await Promise.all([a, b]);
  });
});

describe('GitObjectCacheService Redis fleet eviction', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const CHANNEL = 'tj:git-cache:evict'; // the Redis channel pods talk on
  let redis: FakeRedisService;
  let svc: GitObjectCacheService;
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-redis-'));
    (GitObjectCacheService as any).ROOT = root;
    redis = new FakeRedisService(); // inject our fake instead of real Redis
    svc = new GitObjectCacheService(redis as any);
  });

  afterEach(async () => {
    await svc.onModuleDestroy().catch(() => {}); // close connections the test opened
    delete (GitObjectCacheService as any).ROOT;
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    fs.rmSync(root, { recursive: true, force: true });
  });

  // Some service work is "fire-and-forget" (it doesn't await the Redis publish so
  // a slow Redis can't slow the user down). Rather than guess how many event-loop
  // turns that takes, poll until the expected effect appears (or give up). This is
  // robust even if the publish->disconnect chain grows more async hops.
  const flushUntil = async (done: () => boolean, tries = 50) => {
    for (let i = 0; i < tries && !done(); i++) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  };

  it('starts listening on the evict channel when the cache is enabled', async () => {
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    await svc.onModuleInit(); // NestJS calls this when the service boots
    expect(redis.subscriber.subscribed).toContain(CHANNEL);
  });

  it('does not open any Redis connection when the cache is disabled', async () => {
    process.env.DISABLE_GIT_OBJECT_CACHE = 'true';
    await svc.onModuleInit();
    expect(redis.subscriber.subscribed).toEqual([]); // never subscribed
  });

  it('deletes its local mirror when another pod broadcasts an evict', async () => {
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    await svc.onModuleInit();

    // Arrange: this pod has a mirror on disk for org1's repo.
    const mirror = svc.mirrorPathFor('org1', 'https://github.com/a/b.git');
    fs.mkdirSync(mirror, { recursive: true });
    fs.writeFileSync(path.join(mirror, 'HEAD'), 'x');

    // Act: pretend another pod published "evict org1's repo". We await because
    // handling the message deletes the folder asynchronously.
    await redis.subscriber.deliver(CHANNEL, JSON.stringify({ orgId: 'org1', repoUrl: 'https://github.com/a/b.git' }));

    // Assert: this pod removed its copy too.
    expect(fs.existsSync(mirror)).toBe(false);
  });

  it('ignores a garbage message safely and does not evict anything', async () => {
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    await svc.onModuleInit();

    // A real mirror exists. A non-JSON message must be swallowed (the handler
    // promise RESOLVES, not rejects) AND must not delete the mirror.
    const mirror = svc.mirrorPathFor('org1', 'https://github.com/a/b.git');
    fs.mkdirSync(mirror, { recursive: true });
    fs.writeFileSync(path.join(mirror, 'HEAD'), 'x');

    // deliver() returns the handler's promise. `.resolves` actually exercises the
    // async path — a missing try/catch in the handler would REJECT and fail here.
    await expect(redis.subscriber.deliver(CHANNEL, 'not-json')).resolves.toBeDefined();

    expect(fs.existsSync(mirror)).toBe(true); // nothing was evicted on bad input
  });

  it('broadcasts the exact org + repo when evicting everywhere', async () => {
    await svc.evictEverywhere('org1', 'https://github.com/a/b.git');
    await flushUntil(() => redis.publisher.published.length > 0);
    expect(redis.publisher.published).toEqual([
      { channel: CHANNEL, message: JSON.stringify({ orgId: 'org1', repoUrl: 'https://github.com/a/b.git' }) },
    ]);
  });

  it('closes the publisher connection after broadcasting (no connection leak)', async () => {
    await svc.evictEverywhere('org1', 'https://github.com/a/b.git');
    await flushUntil(() => redis.publisher.disconnected);
    expect(redis.publisher.disconnected).toBe(true);
  });

  it('still broadcasts to the fleet even when the LOCAL evict fails', async () => {
    // If deleting this pod's own mirror fails (e.g. disk error), the other pods
    // must STILL be told to drop theirs — otherwise they serve a stale/revoked
    // repo. (Regression guard for the unconditional-broadcast fix.)
    (svc as any).evict = async () => {
      throw new Error('local disk boom');
    };

    await svc.evictEverywhere('org1', 'https://github.com/a/b.git');
    await flushUntil(() => redis.publisher.published.length > 0);

    expect(redis.publisher.published).toEqual([
      { channel: CHANNEL, message: JSON.stringify({ orgId: 'org1', repoUrl: 'https://github.com/a/b.git' }) },
    ]);
  });

  it('stops listening and closes the connection on shutdown', async () => {
    delete process.env.DISABLE_GIT_OBJECT_CACHE;
    await svc.onModuleInit();
    await svc.onModuleDestroy(); // NestJS calls this when the service shuts down
    expect(redis.subscriber.unsubscribed).toContain(CHANNEL);
    expect(redis.subscriber.disconnected).toBe(true);
  });
});

/**
 * The fakes above only help if they mirror the REAL Redis API. Because jest does
 * not type-check this file (ts-jest diagnostics are off), these RUNTIME checks
 * are what actually catch drift: if RedisService renames a factory method, or an
 * ioredis upgrade renames a connection method the fake stubs, a test here fails.
 * We assert against prototypes — no Redis server is contacted.
 */
describe('FakeRedis stays faithful to the real Redis API', () => {
  it('RedisService still exposes the factory methods the service calls', () => {
    expect(typeof RedisService.prototype.createSubscriber).toBe('function');
    expect(typeof RedisService.prototype.createPublisher).toBe('function');
  });

  it('an ioredis connection exposes every method the fake stands in for', () => {
    const used = ['subscribe', 'on', 'publish', 'unsubscribe', 'disconnect'];
    for (const method of used) {
      expect(typeof (Redis.prototype as any)[method]).toBe('function');
    }
  });
});
