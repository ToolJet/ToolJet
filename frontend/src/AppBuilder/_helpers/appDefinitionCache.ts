import { createVersionedStore } from './versionedIndexedDbStore';

// Caches the released app's GET /apps/slugs/:slug response so a repeat visit skips the fetch.
// Released-app link only: preview and edit loads always fetch.

interface CachedEntry {
  appId: string;
  versionId: string;
  savedAt: number;
  appData: unknown;
}

const store = createVersionedStore<CachedEntry>('app-definitions');

// appDataRevision changes when a deploy runs a migration. No revision, no caching.
function cacheKey(versionId: string, appDataRevision: string): string {
  return `${versionId}:${appDataRevision}`;
}

export async function getCachedAppDefinition(
  versionId: string,
  appDataRevision: string | null | undefined
): Promise<unknown | undefined> {
  if (!versionId || !appDataRevision) return undefined;
  const entry = await store.get(cacheKey(versionId, appDataRevision));
  return entry?.appData;
}

export async function setCachedAppDefinition(
  appId: string,
  versionId: string,
  appDataRevision: string | null | undefined,
  appData: unknown
): Promise<void> {
  if (!appId || !versionId || !appDataRevision) return;
  await store.set(cacheKey(versionId, appDataRevision), { appId, versionId, savedAt: Date.now(), appData });
}
