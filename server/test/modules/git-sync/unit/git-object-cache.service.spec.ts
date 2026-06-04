import { GitObjectCacheService } from '@ee/git-sync/git-object-cache.service';

// In-memory stand-in for one ioredis connection. Records what the service did
// (subscribed/published/unsubscribed/disconnected) and can replay an inbound
// message to the handler the service registered — no real Redis, no mocks.
class FakeRedis {
  subscribed: string[] = [];
  published: { channel: string; message: string }[] = [];
  unsubscribed: string[] = [];
  disconnected = false;
  private messageHandlers: ((channel: string, message: string) => void)[] = [];

  async subscribe(channel: string) {
    this.subscribed.push(channel);
  }
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
  // test seam: deliver a message as if another pod published it.
  // Returns the handlers' promise so a test can await the real (async) evict.
  deliver(channel: string, message: string) {
    return Promise.all(this.messageHandlers.map((h) => h(channel, message)));
  }
}

// RedisService hands out a subscriber and a publisher; keep them separate so a
// test can assert on each, mirroring how the service uses two connections.
class FakeRedisService {
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
  const svc = new GitObjectCacheService({} as any);

  afterEach(() => {
    delete process.env.GIT_OBJECT_CACHE;
  });

  it('keys by org + clean url, stable + collision-free', () => {
    const a = svc.mirrorPathFor('org1', 'https://github.com/acme/repo.git');
    const b = svc.mirrorPathFor('org1', 'https://github.com/acme/repo.git');
    const c = svc.mirrorPathFor('org2', 'https://github.com/acme/repo.git');
    expect(a).toBe(b);            // stable
    expect(a).not.toBe(c);        // org-scoped
    expect(a).toMatch(/tj-git-cache\/[a-f0-9]{64}\.git$/);
  });

  it('never contains a token from the url', () => {
    const p = svc.mirrorPathFor('org1', 'https://x-access-token:SECRET@github.com/acme/repo.git');
    expect(p).not.toContain('SECRET');
  });

  it('isEnabled reflects GIT_OBJECT_CACHE env', () => {
    process.env.GIT_OBJECT_CACHE = 'false';
    expect(svc.isEnabled()).toBe(false);
    process.env.GIT_OBJECT_CACHE = 'true';
    expect(svc.isEnabled()).toBe(true);
  });
});

describe('GitObjectCacheService.authConfigArgs', () => {
  const svc = new GitObjectCacheService({} as any);
  it('returns ephemeral http.extraHeader with base64 basic creds, no token in plain text', () => {
    const args = svc.authConfigArgs('ghs_TOKEN123');
    expect(args[0]).toBe('-c');
    const header = args[1];
    expect(header).toMatch(/^http\.extraHeader=Authorization: Basic /);
    expect(header).not.toContain('ghs_TOKEN123');                 // raw token not present
    const b64 = header.split('Basic ')[1];
    expect(Buffer.from(b64, 'base64').toString()).toBe('x-access-token:ghs_TOKEN123');
  });
});

describe('GitObjectCacheService root dir resolution', () => {
  afterEach(() => {
    delete process.env.GIT_OBJECT_CACHE_DIR;
    delete (GitObjectCacheService as any).ROOT;
  });

  it('uses GIT_OBJECT_CACHE_DIR/tj-git-cache when env set and no ROOT override', () => {
    process.env.GIT_OBJECT_CACHE_DIR = '/some/base';
    const svc = new GitObjectCacheService({} as any);
    const p = svc.mirrorPathFor('org1', 'https://github.com/acme/repo.git');
    expect(p).toMatch(/^\/some\/base\/tj-git-cache\/[a-f0-9]{64}\.git$/);
  });

  it('falls back to tmpdir/tj-git-cache when GIT_OBJECT_CACHE_DIR unset', () => {
    const os = require('os'); const path = require('path');
    const svc = new GitObjectCacheService({} as any);
    const p = svc.mirrorPathFor('org1', 'https://github.com/acme/repo.git');
    expect(p.startsWith(path.join(os.tmpdir(), 'tj-git-cache'))).toBe(true);
  });
});

describe('GitObjectCacheService eviction', () => {
  const fs = require('fs'); const os = require('os'); const path = require('path');
  let root: string; let svc: GitObjectCacheService;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
    svc = new GitObjectCacheService({} as any);
    (GitObjectCacheService as any).ROOT = root;
  });
  afterEach(() => {
    delete (GitObjectCacheService as any).ROOT;       // restore default ROOT — no cross-test leak
    delete process.env.GIT_OBJECT_CACHE_TTL_DAYS;
    delete process.env.GIT_OBJECT_CACHE_MAX_GB;
    fs.rmSync(root, { recursive: true, force: true });
  });
  const mk = (name: string, ageDays: number, bytes = 10) => {
    const d = path.join(root, name + '.git'); fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'HEAD'), 'x'.repeat(bytes));
    const t = Date.now() - ageDays * 86400_000; fs.utimesSync(d, t / 1000, t / 1000);
    return d;
  };

  it('pruneIdle removes mirrors older than TTL', async () => {
    const fresh = mk('fresh', 1); const stale = mk('stale', 30);
    process.env.GIT_OBJECT_CACHE_TTL_DAYS = '14';
    await svc.pruneIdle();
    expect(fs.existsSync(fresh)).toBe(true);
    expect(fs.existsSync(stale)).toBe(false);
  });

  it('enforceSizeCap evicts least-recently-used until under cap', async () => {
    const old = mk('old', 5, 1_000_000); const recent = mk('recent', 0, 1_000_000);
    process.env.GIT_OBJECT_CACHE_MAX_GB = '0.00143'; // ~1.5MB cap -> must drop one, keep one
    await svc.enforceSizeCap();
    expect(fs.existsSync(old)).toBe(false);
    expect(fs.existsSync(recent)).toBe(true);
  });

  it('evict removes the specific (org,repo) mirror', async () => {
    const p = svc.mirrorPathFor('orgX', 'https://github.com/a/b.git');
    fs.mkdirSync(p, { recursive: true }); fs.writeFileSync(path.join(p, 'HEAD'), 'x');
    await svc.evict('orgX', 'https://github.com/a/b.git');
    expect(fs.existsSync(p)).toBe(false);
  });
});

describe('GitObjectCacheService.cachedSparseClone fallback', () => {
  const fs = require('fs'); const os = require('os'); const path = require('path');
  afterEach(() => {
    delete process.env.GIT_OBJECT_CACHE;
  });

  // Invariant 4 safety net: ANY cache error must fall back to plainClone with the
  // empty-temp-dir precondition restored (callers mkdtemp before cloning).
  it('on cache error, restores an empty temp dir then runs plainClone', async () => {
    process.env.GIT_OBJECT_CACHE = 'true';
    const svc = new GitObjectCacheService({} as any);
    // force the cache path to fail without touching the network
    (svc as any).ensureMirror = async () => { throw new Error('boom'); };

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-fallback-'));
    fs.writeFileSync(path.join(tmpDir, 'leftover'), 'partial-clone debris'); // dirty remnants

    let plainCloneDir: string | undefined;
    let dirEmptyAtCall = false;
    const plainClone = async (d: string) => {
      plainCloneDir = d;
      dirEmptyAtCall = fs.readdirSync(d).length === 0; // precondition: clean dir
    };

    await svc.cachedSparseClone({
      orgId: 'org1', cleanRepoUrl: 'https://github.com/a/b.git', token: 't',
      branch: 'main', tmpDir, paths: ['x'], plainClone,
    });

    expect(plainCloneDir).toBe(tmpDir); // fallback ran
    expect(dirEmptyAtCall).toBe(true);  // empty-dir precondition restored
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('GitObjectCacheService Redis fleet eviction', () => {
  const fs = require('fs'); const os = require('os'); const path = require('path');
  const CHANNEL = 'tj:git-cache:evict';
  let redis: FakeRedisService; let svc: GitObjectCacheService; let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-redis-'));
    (GitObjectCacheService as any).ROOT = root;
    redis = new FakeRedisService();
    svc = new GitObjectCacheService(redis as any);
  });
  afterEach(async () => {
    await svc.onModuleDestroy().catch(() => {});
    delete (GitObjectCacheService as any).ROOT;
    delete process.env.GIT_OBJECT_CACHE;
    fs.rmSync(root, { recursive: true, force: true });
  });
  // let the fire-and-forget publish/evict microtasks settle
  const settle = () => new Promise((r) => setImmediate(r));

  it('subscribes to the evict channel on init when the cache is enabled', async () => {
    process.env.GIT_OBJECT_CACHE = 'true';
    await svc.onModuleInit();
    expect(redis.subscriber.subscribed).toContain(CHANNEL);
  });

  it('touches no Redis connection on init when the cache is disabled', async () => {
    process.env.GIT_OBJECT_CACHE = 'false';
    await svc.onModuleInit();
    expect(redis.subscriber.subscribed).toEqual([]);
  });

  it('removes the matching mirror when an evict message arrives from another pod', async () => {
    process.env.GIT_OBJECT_CACHE = 'true';
    await svc.onModuleInit();
    const mirror = svc.mirrorPathFor('org1', 'https://github.com/a/b.git');
    fs.mkdirSync(mirror, { recursive: true });
    fs.writeFileSync(path.join(mirror, 'HEAD'), 'x');

    await redis.subscriber.deliver(CHANNEL, JSON.stringify({ orgId: 'org1', repoUrl: 'https://github.com/a/b.git' }));

    expect(fs.existsSync(mirror)).toBe(false);
  });

  it('ignores a malformed evict message without throwing', async () => {
    process.env.GIT_OBJECT_CACHE = 'true';
    await svc.onModuleInit();
    expect(() => redis.subscriber.deliver(CHANNEL, 'not-json')).not.toThrow();
  });

  it('publishes the org + repo on the evict channel when evicting everywhere', async () => {
    await svc.evictEverywhere('org1', 'https://github.com/a/b.git');
    await settle();
    expect(redis.publisher.published).toEqual([
      { channel: CHANNEL, message: JSON.stringify({ orgId: 'org1', repoUrl: 'https://github.com/a/b.git' }) },
    ]);
  });

  it('disconnects the publisher after broadcasting (no leaked connection)', async () => {
    await svc.evictEverywhere('org1', 'https://github.com/a/b.git');
    await settle();
    expect(redis.publisher.disconnected).toBe(true);
  });

  it('unsubscribes and disconnects the subscriber on destroy', async () => {
    process.env.GIT_OBJECT_CACHE = 'true';
    await svc.onModuleInit();
    await svc.onModuleDestroy();
    expect(redis.subscriber.unsubscribed).toContain(CHANNEL);
    expect(redis.subscriber.disconnected).toBe(true);
  });
});
