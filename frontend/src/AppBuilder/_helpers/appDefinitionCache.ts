import { createVersionedStore } from './versionedIndexedDbStore';

// Tier 1 of the IndexedDB viewer cache (see Client Cache Architecture design doc): caches the raw
// GET /apps/slugs/:slug response so a repeat visit can skip the fetch entirely, not just the
// JSON.parse (which profiling showed is cheap on its own — see dependencyGraphCache.ts). This
// matters when the browser's own HTTP cache (ETag/Cache-Control: immutable) entry has been
// evicted under storage pressure — a dedicated IndexedDB entry for one app is less likely to be
// evicted than a slot in the browser's shared, general-purpose HTTP cache.
//
// PUBLISHED only, by construction: the only pre-fetch pointer available is
// validateReleasedApp's `currentVersionId`, which is only ever the app's released (published)
// version — the plain launch-link viewer flow. Preview (`?version=`) and edit-mode loads never
// have this pointer, so they always fall through to a live fetch, matching the design doc's
// "preview bypasses cache entirely" decision.

interface CachedEntry {
  appId: string;
  versionId: string;
  savedAt: number;
  appData: unknown;
}

const store = createVersionedStore<CachedEntry>('app-definitions');

export async function getCachedAppDefinition(versionId: string): Promise<unknown | undefined> {
  const entry = await store.get(versionId);
  return entry?.appData;
}

export async function setCachedAppDefinition(appId: string, versionId: string, appData: unknown): Promise<void> {
  if (!appId) return;
  await store.set(versionId, { appId, versionId, savedAt: Date.now(), appData });
}
