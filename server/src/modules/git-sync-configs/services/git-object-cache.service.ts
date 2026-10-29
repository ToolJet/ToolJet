import { Injectable } from '@nestjs/common';

// CE stub. The git object cache is an EE-only clone optimisation (mirror reuse +
// fleet eviction over Redis). Community edition has no mirror: every git-sync op
// plain-clones, exactly as it did before the cache existed. Methods are inert
// pass-throughs (NOT throwers) so any caller behaves like the flag-off path.
@Injectable()
export class GitObjectCacheService {
  isEnabled(): boolean {
    return false;
  }

  async cachedSparseClone(args: { tmpDir: string; plainClone: (tmpDir: string) => Promise<void> }): Promise<void> {
    return args.plainClone(args.tmpDir);
  }

  async evictEverywhere(_orgId: string, _repoUrl: string): Promise<void> {
    // no cache to evict in CE
  }
}
