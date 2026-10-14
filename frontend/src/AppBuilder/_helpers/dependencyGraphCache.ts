import { createVersionedStore } from './versionedIndexedDbStore';

// Caches the built dependency graph and validated component values, the expensive part of a
// viewer load. Keyed by versionId:appDataRevision:pageId (the graph is built per landing page).

interface DependencyGraphSnapshot {
  depGraph: unknown;
  validatedComponentValues: Record<string, unknown>;
  exposedValuesComponents: Record<string, unknown>;
}

interface CachedEntry extends DependencyGraphSnapshot {
  appId: string;
  versionId: string;
  savedAt: number;
}

const store = createVersionedStore<CachedEntry>('dependency-graph-snapshots');

function cacheKey(versionId: string, appDataRevision: string, pageId: string): string {
  return `${versionId}:${appDataRevision}:${pageId}`;
}

export async function getCachedDependencyGraph(
  versionId: string,
  appDataRevision: string | null | undefined,
  pageId: string
): Promise<DependencyGraphSnapshot | undefined> {
  if (!versionId || !appDataRevision || !pageId) return undefined;
  return store.get(cacheKey(versionId, appDataRevision, pageId));
}

export async function setCachedDependencyGraph(
  appId: string,
  versionId: string,
  appDataRevision: string | null | undefined,
  pageId: string,
  snapshot: DependencyGraphSnapshot
): Promise<void> {
  if (!appId || !versionId || !appDataRevision || !pageId) return;
  await store.set(cacheKey(versionId, appDataRevision, pageId), { appId, versionId, savedAt: Date.now(), ...snapshot });
}
