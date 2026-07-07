/**
 * Engine bridge — continuous shadow mode (Phase 2 pre-cutover validation).
 *
 * While enabled, every store cascade (`updateDependencyValues`) is mirrored
 * into a per-module ResolutionEngine as a SET_RUNTIME command. The engine runs
 * its own incremental cascade over its own state copy, and each engine output
 * is compared (microtask-deferred) against what the store actually wrote to
 * resolvedStore — validation applied host-side so validated values compare
 * like-for-like. Divergence counters accumulate; zero divergence across real
 * usage is the cutover criterion.
 *
 * Dev usage (browser console):
 *   window.__tjEngineShadowStart()   // snapshot graph+state, begin mirroring
 *   window.__tjEngineShadowStats()   // { cascades, compared, matches, divergences: [...] }
 *   window.__tjEngineShadowStop()
 *
 * Graph mutations (add/rename/remove bindings) invalidate the mirrors via
 * dependencySlice hooks; they lazily rebuild from the live graph on the next
 * cascade, so structural edits need no restart.
 */
import useStore from '@/AppBuilder/_stores/store';
import { ResolutionEngine } from './ResolutionEngine';
import { serializeGraph } from './graphSerializer';
import { get as lodashGet } from 'lodash';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Divergence {
  path: string;
  engineValue: unknown;
  storeValue: unknown;
  trigger: string;
}

interface ShadowSession {
  engines: Map<string, ResolutionEngine>;
  cascades: number;
  compared: number;
  matches: number;
  divergences: Divergence[];
  /** Where affected paths went instead of being compared — coverage truth. */
  skipped: { querySentinels: number; rowScoped: number; structuralNoBinding: number; nonComponent: number };
}

let session: ShadowSession | null = null;

export function isEngineShadowActive(): boolean {
  return session !== null;
}

const stable = (v: unknown): string => {
  try {
    return JSON.stringify(v) ?? 'undefined';
  } catch {
    return '<unserializable>';
  }
};

function getOrInitEngine(moduleId: string): ResolutionEngine | null {
  if (!session) return null;
  let engine = session.engines.get(moduleId);
  if (!engine) {
    const store = (useStore as any).getState();
    const liveGraph = store.dependencyGraph.modules[moduleId]?.graph;
    if (!liveGraph) return null;
    engine = new ResolutionEngine();
    engine.init({
      graph: serializeGraph(liveGraph),
      bindings: [],
      // raw: true — this gets _.cloneDeep'd right after (ResolutionEngine.init),
      // and cloning the lazy-ListView-read Proxy from getAllExposedValues
      // would break it (see resolvedSlice.js's getAllExposedValues comment).
      seedState: store.getAllExposedValues(moduleId, { raw: true }),
    });
    session.engines.set(moduleId, engine);
  }
  return engine;
}

/**
 * Tap for componentsSlice.updateDependencyValues. Called AFTER the store
 * cascade ran. Feeds the same change to the engine mirror and compares engine
 * output against resolvedStore on a microtask (store writes are synchronous,
 * so deferred comparison sees the final values).
 */
export function engineShadowOnCascade(path: string, moduleId: string): void {
  if (!session) return;
  const engine = getOrInitEngine(moduleId);
  if (!engine) return;
  session.cascades++;

  const store = (useStore as any).getState();
  const changedValue = lodashGet(store.getAllExposedValues(moduleId), path);

  // Classify every affected path so stats reflect true coverage, not just the
  // slice we can compare (query sentinels and row-scoped rows dominate real
  // traffic in list/query-heavy apps).
  for (const affected of engine.getAffectedPaths(path)) {
    if (affected.endsWith('.__options__')) session.skipped.querySentinels++;
    else if (!affected.startsWith('components.')) session.skipped.nonComponent++;
    else if (!engine.hasBinding(affected)) session.skipped.structuralNoBinding++;
  }

  const { updates } = engine.applyCommands([{ kind: 'SET_RUNTIME', path, value: changedValue }]);

  const toCompare = updates.filter(
    (u) => u.path !== path && u.path.startsWith('components.') && !u.path.endsWith('.__options__')
  );
  if (!toCompare.length) return;

  queueMicrotask(() => {
    if (!session) return;
    const state = (useStore as any).getState();
    const resolvedModule = state.resolvedStore.modules[moduleId];
    for (const { path: bindingPath, value: engineValue } of toCompare) {
      const [entityType, entityId, type, ...keys] = bindingPath.split('.');
      const key = keys.join('.');
      const storeNode = resolvedModule?.[entityType]?.[entityId];
      if (Array.isArray(storeNode)) {
        session.skipped.rowScoped++;
        continue; // row-scoped — Phase 3/4 scope
      }
      // Compare like-for-like: the store writes VALIDATED values.
      const validatedEngineValue =
        entityType === 'components' && entityId && type
          ? state.debugger.validateProperty(entityId, type, key, engineValue, moduleId)
          : engineValue;
      const storeValue = type ? lodashGet(storeNode, [type, ...key.split('.')]) : storeNode;
      session.compared++;
      if (stable(validatedEngineValue) === stable(storeValue)) {
        session.matches++;
      } else {
        session.divergences.push({ path: bindingPath, engineValue: validatedEngineValue, storeValue, trigger: path });
        // eslint-disable-next-line no-console
        console.warn('[engine-shadow] divergence', {
          path: bindingPath,
          engineValue: validatedEngineValue,
          storeValue,
          trigger: path,
        });
      }
    }
  });
}

export function startEngineShadow(): void {
  session = {
    engines: new Map(),
    cascades: 0,
    compared: 0,
    matches: 0,
    divergences: [],
    skipped: { querySentinels: 0, rowScoped: 0, structuralNoBinding: 0, nonComponent: 0 },
  };
}

export function stopEngineShadow(): ShadowSession | null {
  const finished = session;
  session = null;
  return finished;
}

export function engineShadowStats(): Omit<ShadowSession, 'engines'> | null {
  if (!session) return null;
  const { cascades, compared, matches, divergences, skipped } = session;
  return { cascades, compared, matches, divergences, skipped };
}

/* ────────────────────────── Cutover seam (flag-gated) ──────────────────────────
 * 'verify' — engine resolves every flat binding, store ALSO resolves; values are
 *            compared, the STORE value is used. Zero-risk dogfooding.
 * 'on'     — the engine value is used; store resolution is skipped for hits.
 *            Misses (batch path, un-synced mirror) fall back to store resolve.
 * Row-scoped rows and query sentinels always stay on the store path (Phase 3/4).
 */
type CutoverMode = 'off' | 'verify' | 'on';

let cutoverMode: CutoverMode = 'off';
const cutoverEngines = new Map<string, ResolutionEngine>();
/** engine-resolved values for the current cascade tick: `${moduleId}|${path}` */
const cutoverValues = new Map<string, unknown>();
const cutoverStats = {
  engineHits: 0,
  engineMisses: 0,
  verifyMatches: 0,
  verifyDivergences: [] as Divergence[],
};

export function isEngineCutoverActive(): boolean {
  return cutoverMode !== 'off';
}

/** Graph structure changed (binding added/removed/renamed): drop the affected
 *  module's engine mirrors — they lazily rebuild from the live graph on the
 *  next cascade. Called from dependencySlice mutation methods. */
export function invalidateEngineMirrors(moduleId?: string): void {
  if (moduleId) {
    cutoverEngines.delete(moduleId);
    session?.engines.delete(moduleId);
  } else {
    cutoverEngines.clear();
    session?.engines.clear();
  }
  cutoverValues.clear();
}

function getOrInitCutoverEngine(moduleId: string): ResolutionEngine | null {
  let engine = cutoverEngines.get(moduleId);
  if (!engine) {
    const store = (useStore as any).getState();
    const liveGraph = store.dependencyGraph.modules[moduleId]?.graph;
    if (!liveGraph) return null;
    engine = new ResolutionEngine();
    engine.init({
      graph: serializeGraph(liveGraph),
      bindings: [],
      // raw: true — this gets _.cloneDeep'd right after (ResolutionEngine.init),
      // and cloning the lazy-ListView-read Proxy from getAllExposedValues
      // would break it (see resolvedSlice.js's getAllExposedValues comment).
      seedState: store.getAllExposedValues(moduleId, { raw: true }),
    });
    cutoverEngines.set(moduleId, engine);
  }
  return engine;
}

/** Called at the top of updateDependencyValues: sync the mirror with the
 *  changed path and pre-compute engine values for this cascade tick. */
export function engineCutoverPrepare(path: string, moduleId: string): void {
  if (cutoverMode === 'off') return;
  const engine = getOrInitCutoverEngine(moduleId);
  if (!engine) return;
  const store = (useStore as any).getState();
  const changedValue = lodashGet(store.getAllExposedValues(moduleId), path);
  const { updates } = engine.applyCommands([{ kind: 'SET_RUNTIME', path, value: changedValue }]);
  for (const u of updates) {
    if (u.path !== path) cutoverValues.set(`${moduleId}|${u.path}`, u.value);
  }
}

/** The seam inside applyDependencyUpdate's flat branch. `storeResolve` is the
 *  original resolveDynamicValues call, invoked only when needed. */
export function resolveDependencyViaEngine(
  dependency: string,
  moduleId: string,
  storeResolve: () => unknown
): unknown {
  if (cutoverMode === 'off') return storeResolve();
  const key = `${moduleId}|${dependency}`;
  if (!cutoverValues.has(key)) {
    cutoverStats.engineMisses++;
    return storeResolve();
  }
  const engineValue = cutoverValues.get(key);
  cutoverValues.delete(key); // one cascade tick's worth — no unbounded growth
  if (cutoverMode === 'verify') {
    const storeValue = storeResolve();
    if (stable(engineValue) === stable(storeValue)) {
      cutoverStats.verifyMatches++;
    } else {
      cutoverStats.verifyDivergences.push({ path: dependency, engineValue, storeValue, trigger: '(cutover-verify)' });
      // eslint-disable-next-line no-console
      console.warn('[engine-cutover] divergence — using store value', { path: dependency, engineValue, storeValue });
    }
    return storeValue; // verify mode never changes behavior
  }
  cutoverStats.engineHits++;
  return engineValue;
}

declare const process: { env: { NODE_ENV?: string } };
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  (window as any).__tjEngineCutover = (mode: CutoverMode = 'verify') => {
    cutoverMode = mode;
    if (mode === 'off') cutoverEngines.clear();
    cutoverValues.clear();
    // eslint-disable-next-line no-console
    console.log(`[engine-cutover] mode=${mode}`, cutoverStats);
    return cutoverStats;
  };
  (window as any).__tjEngineCutoverStats = () => cutoverStats;
  (window as any).__tjEngineShadowStart = () => {
    startEngineShadow();
    // eslint-disable-next-line no-console
    console.log('[engine-shadow] continuous mirroring started — interact with the app, then __tjEngineShadowStats()');
  };
  (window as any).__tjEngineShadowStats = () => engineShadowStats();
  (window as any).__tjEngineShadowStop = () => stopEngineShadow();
}
