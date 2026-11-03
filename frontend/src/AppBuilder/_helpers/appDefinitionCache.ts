import { createVersionedStore } from './versionedIndexedDbStore';

// Caches the released app's GET /apps/slugs/:slug response so a repeat visit skips the fetch.
// Released-app link only: preview and edit loads always fetch.

interface CachedEntry {
  appId: string;
  versionId: string;
  appDataRevision: string;
  savedAt: number;
  appData: unknown;
}

const store = createVersionedStore<CachedEntry>('app-definitions');

// One entry per version, valid only for the appDataRevision it was saved under. The server changes
// the revision whenever what this viewer would see changes, so a stale entry is never served and
// gets replaced on the next save. No revision, no caching.
export async function getCachedAppDefinition(
  versionId: string,
  appDataRevision: string | null | undefined
): Promise<unknown | undefined> {
  if (!versionId || !appDataRevision) return undefined;
  const entry = await store.get(versionId);
  return entry?.appDataRevision === appDataRevision ? entry.appData : undefined;
}

export async function setCachedAppDefinition(
  appId: string,
  versionId: string,
  appDataRevision: string | null | undefined,
  appData: unknown
): Promise<void> {
  if (!appId || !versionId || !appDataRevision) return;
  await store.set(versionId, { appId, versionId, appDataRevision, savedAt: Date.now(), appData });
}
