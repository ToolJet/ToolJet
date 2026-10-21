import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys, promisifyRequest, UseStore } from 'idb-keyval';

// Shared IndexedDB store for the viewer caches. Keeps the last N versions per app (all pages of
// a version are evicted together) and evicts when storage is nearly full.

// Bump to reset the cache when widget defaults/config change.
const VIEWER_CACHE_VERSION = 1;

const MAX_VERSIONS_PER_APP = 2;
const QUOTA_EVICTION_THRESHOLD = 0.8;

interface Entry {
  appId: string;
  versionId: string;
  savedAt: number;
}

const DB_NAME_PREFIX = 'tj-app-cache-';

// Every store created via createVersionedStore in this page load, so clearAllViewerCaches()
// (called on logout) can close and wipe them without each cache module needing its own wiring.
const registeredStores: { dbName: string; close: () => void }[] = [];

// Like idb-keyval's createStore(), but the connection closes whenever a deletion asks it to, from
// this tab or another one, and reopens on next use. idb-keyval keeps its connection open for the
// life of the page, so logout's deleteDatabase would wait until every viewer tab was closed.
function createClosableStore(dbName: string, storeName: string): { store: UseStore; close: () => void } {
  let connection: Promise<IDBDatabase> | undefined;
  let openDb: IDBDatabase | undefined;

  function close(): void {
    openDb?.close();
    openDb = undefined;
    connection = undefined;
  }

  function connect(): Promise<IDBDatabase> {
    if (connection) return connection;
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    const attempt: Promise<IDBDatabase> = promisifyRequest(request).then((db) => {
      if (connection !== attempt) {
        db.close(); // closed while opening
        throw new Error('Viewer cache was closed');
      }
      openDb = db;
      db.onversionchange = close;
      db.onclose = () => openDb === db && close(); // the browser closed it (e.g. Safari)
      return db;
    });
    connection = attempt;
    attempt.catch(() => connection === attempt && (connection = undefined));
    return attempt;
  }

  const store: UseStore = (txMode, callback) =>
    connect().then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
  return { store, close };
}

function deleteDatabase(dbName: string): void {
  try {
    indexedDB.deleteDatabase(dbName);
  } catch {
    // Storage can be broken or blocked; one failed delete must not stop the rest.
  }
}

// Best-effort and never throws: logout calls it first and must go through even when storage fails.
export function clearAllViewerCaches(): void {
  try {
    if (typeof indexedDB === 'undefined') return;
    // This tab's own open connections would block the deletion, so close them first.
    registeredStores.forEach(({ dbName, close }) => {
      close();
      deleteDatabase(dbName);
    });
    // Cache modules register lazily, so a page that never loaded the viewer has nothing registered.
    // Listing finds those DBs too, along with ones left over from older cache versions.
    indexedDB
      .databases?.()
      .then((databases) =>
        databases
          .map(({ name }) => name)
          .filter(
            (name): name is string =>
              !!name?.startsWith(DB_NAME_PREFIX) && !registeredStores.some((store) => store.dbName === name)
          )
          .forEach(deleteDatabase)
      )
      .catch(() => {});
  } catch {
    // Accessing indexedDB itself can throw (e.g. storage disabled for the site).
  }
}

export function createVersionedStore<T extends Entry>(storeName: string) {
  // One DB per store, not a shared 'tj-app-cache' DB with multiple stores: the store opens
  // IndexedDB without an explicit version, so onupgradeneeded only fires
  // for the first store name ever created under a given DB name — a second store name sharing
  // that DB silently never gets created, and reads/writes against it fail forever.
  const dbName = `${DB_NAME_PREFIX}${storeName}-v${VIEWER_CACHE_VERSION}`;
  const { store: dbStore, close } = createClosableStore(dbName, storeName);
  registeredStores.push({ dbName, close });

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
