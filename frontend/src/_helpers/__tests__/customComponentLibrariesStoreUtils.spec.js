import { buildManifestCacheKey } from '../customComponentLibrariesStoreUtils';

describe('buildManifestCacheKey', () => {
  it('[ManifestCache-001] keys a published revision by (libraryId, revision) alone', () => {
    expect(buildManifestCacheKey('lib-1', 'v2')).toBe('lib-1@v2');
  });

  it('[ManifestCache-002] folds devNonce in when present, so a live-reload push changes the key', () => {
    // Break this catches: dropping devNonce from the key, which would keep serving a
    // dev bundle's stale manifest (actions/props) after a live-reload push.
    expect(buildManifestCacheKey('lib-1', 'dev:user-1', 42)).toBe('lib-1@dev:user-1@42');
    expect(buildManifestCacheKey('lib-1', 'dev:user-1', 43)).not.toBe(buildManifestCacheKey('lib-1', 'dev:user-1', 42));
  });

  it('[ManifestCache-003] ignores a devNonce of 0 the same as undefined', () => {
    expect(buildManifestCacheKey('lib-1', 'v2', 0)).toBe('lib-1@v2');
  });
});
