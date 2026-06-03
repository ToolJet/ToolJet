import { GitObjectCacheService } from '@ee/git-sync/git-object-cache.service';

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
