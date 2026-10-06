import { createVersionedStore } from './versionedIndexedDbStore';

// Tier 2 of the IndexedDB viewer cache (see Client Cache Architecture design doc): caches the
// derived dependency-graph build (initDependencyGraph) — both the graph edges AND the
// validateComponents output (validatedComponentValues), since profiling showed the per-component
// {{}} resolution walk and the schema-validation/coercion pass are both real costs, while
// JSON.parse of the raw definition is negligible (~4-5ms/MB, see appDefinitionCache.ts). PUBLISHED
// versions only — a released version is immutable, so a versionId-keyed entry never goes stale.
//
// Keyed by `${versionId}:${pageId}`, not versionId alone: initDependencyGraph builds the graph
// from getCurrentPageComponents(), which is scoped to whichever page the load lands on (home page,
// or a deep-linked page handle). A versionId-only key would serve one page's hydrated state to a
// load that landed on a different page of the same version.
//
// Store name carries a "-v3" suffix: v1 cached pre-validation values, v2 was versionId-only keyed
// (both wrong for reasons above). Bumping orphans old entries instead of silently misreading them.

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

const store = createVersionedStore<CachedEntry>('dependency-graph-snapshots-v3');

function cacheKey(versionId: string, pageId: string): string {
  return `${versionId}:${pageId}`;
}

export async function getCachedDependencyGraph(
  versionId: string,
  pageId: string
): Promise<DependencyGraphSnapshot | undefined> {
  if (!versionId || !pageId) return undefined;
  return store.get(cacheKey(versionId, pageId));
}

export async function setCachedDependencyGraph(
  appId: string,
  versionId: string,
  pageId: string,
  snapshot: DependencyGraphSnapshot
): Promise<void> {
  if (!appId || !versionId || !pageId) return;
  await store.set(cacheKey(versionId, pageId), { appId, versionId, savedAt: Date.now(), ...snapshot });
}
