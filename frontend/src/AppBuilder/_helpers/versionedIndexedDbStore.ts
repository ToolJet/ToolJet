import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys, createStore, UseStore } from 'idb-keyval';

// Shared IndexedDB store: LRU per app (keep last N *versions*, grouped — not raw entries) plus
// opportunistic quota eviction. Used by both the dependency-graph cache (keyed by versionId:pageId,
// since the dependency graph is per-page) and the app-definition cache (keyed by versionId alone).
// Grouping eviction by versionId (not by raw storage key) matters because the dependency-graph
// cache can have many entries — one per page — sharing the same versionId; without grouping,
// visiting several pages of the *same* version would evict each other instead of only evicting
// once a genuinely older version shows up.

const MAX_VERSIONS_PER_APP = 2;
const QUOTA_EVICTION_THRESHOLD = 0.8;

interface Entry {
  appId: string;
  versionId: string;
  savedAt: number;
}

// Every DB name ever created via createVersionedStore, so clearAllViewerCaches() (called on
// logout) can wipe all of them without each cache module needing its own cleanup wiring.
const registeredDbNames: string[] = [];

export function clearAllViewerCaches(): void {
  for (const dbName of registeredDbNames) {
    indexedDB.deleteDatabase(dbName);
  }
}

export function createVersionedStore<T extends Entry>(storeName: string) {
  // One DB per store, not a shared 'tj-app-cache' DB with multiple stores: idb-keyval's
  // createStore() opens IndexedDB without an explicit version, so onupgradeneeded only fires
  // for the first store name ever created under a given DB name — a second store name sharing
  // that DB silently never gets created, and reads/writes against it fail forever.
  const dbName = `tj-app-cache-${storeName}`;
  registeredDbNames.push(dbName);
  const dbStore: UseStore = createStore(dbName, storeName);

  async function get(key: string): Promise<T | undefined> {
    if (!key) return undefined;
    try {
      return await idbGet<T>(key, dbStore);
    } catch {
      // IndexedDB can be unavailable (private browsing, disabled storage) — cache is an optimization, not a requirement.
      return undefined;
    }
  }

  async function set(key: string, entry: T): Promise<void> {
    if (!entry.appId || !key) return;
    try {
      await idbSet(key, entry, dbStore);
      await evictSupersededVersions(entry.appId);
      await evictIfOverQuota();
    } catch {
      // Best-effort persistence — a failed write just means the next load rebuilds instead of hydrating.
    }
  }

  async function entriesWithKeys() {
    const allKeys = await idbKeys(dbStore);
    return Promise.all(allKeys.map(async (key) => ({ key, value: await idbGet<T>(key, dbStore) })));
  }

  // Keeps the last MAX_VERSIONS_PER_APP distinct versionIds per app (current + previous),
  // evicting every entry (every page) belonging to older versions.
  async function evictSupersededVersions(appId: string): Promise<void> {
    const entries = await entriesWithKeys();
    const byVersion = new Map<string, { savedAt: number; keys: IDBValidKey[] }>();
    entries.forEach(({ key, value }) => {
      if (!value || value.appId !== appId) return;
      const bucket = byVersion.get(value.versionId) ?? { savedAt: 0, keys: [] };
      bucket.savedAt = Math.max(bucket.savedAt, value.savedAt);
      bucket.keys.push(key);
      byVersion.set(value.versionId, bucket);
    });

    const versionsNewestFirst = Array.from(byVersion.values()).sort((a, b) => b.savedAt - a.savedAt);
    const toEvict = versionsNewestFirst.slice(MAX_VERSIONS_PER_APP);
    await Promise.all(toEvict.flatMap((v) => v.keys.map((key) => idbDel(key, dbStore))));
  }

  // Opportunistic check on write (not a background job): if usage crosses the threshold, evict
  // whole app-entries (all cached versions for one app), oldest-saved app first.
  async function evictIfOverQuota(): Promise<void> {
    if (!navigator.storage?.estimate) return;

    let { usage = 0, quota = 0 } = await navigator.storage.estimate();
    if (!quota || usage / quota < QUOTA_EVICTION_THRESHOLD) return;

    const entries = await entriesWithKeys();
    const byApp = new Map<string, { savedAt: number; keys: IDBValidKey[] }>();
    entries.forEach(({ key, value }) => {
      if (!value) return;
      const bucket = byApp.get(value.appId) ?? { savedAt: 0, keys: [] };
      bucket.savedAt = Math.max(bucket.savedAt, value.savedAt);
      bucket.keys.push(key);
      byApp.set(value.appId, bucket);
    });

    const appsOldestFirst = Array.from(byApp.values()).sort((a, b) => a.savedAt - b.savedAt);

    for (const app of appsOldestFirst) {
      await Promise.all(app.keys.map((key) => idbDel(key, dbStore)));
      ({ usage = 0, quota = 0 } = await navigator.storage.estimate());
      if (usage / quota < QUOTA_EVICTION_THRESHOLD) break;
    }
  }

  return { get, set };
}
