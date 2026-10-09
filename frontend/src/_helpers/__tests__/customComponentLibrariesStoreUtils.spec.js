import { buildManifestCacheKey } from '../customComponentLibrariesStoreUtils';

describe('buildManifestCacheKey', () => {
  it('[ManifestCache-001] keys a published revision by (libraryId, revision) alone', () => {
    expect(buildManifestCacheKey('lib-1', 'v2')).toBe('lib-1@v2');
  });

  it('[ManifestCache-002] keys a dev revision the same stable way — no nonce folded in', () => {
    // Break this catches: reintroducing a nonce into the key, which grows the cache
    // with a stale entry per push instead of relying on invalidateManifest.
    expect(buildManifestCacheKey('lib-1', 'dev:user-1')).toBe('lib-1@dev:user-1');
  });
});
