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
