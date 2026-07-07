/**
 * Runtime shadow-diff (Phase 2 safety net).
 *
 * Builds a ResolutionEngine from the LIVE store — serialized dependency graph
 * (whose node data already carries each binding's unresolved expression) +
 * current exposedValues — runs a full engine-side re-resolution, and diffs the
 * result against the store's incrementally built resolvedStore.
 *
 * Zero mismatches = the engine reproduces the store's cascade output from
 * first principles. Mismatch buckets tell us what the engine is still missing
 * (validation transforms, row scoping) vs what would be a real bug.
 *
 * Dev usage (browser console, editor open):
 *   window.__tjEngineShadowCheck()            // canvas module
 *   window.__tjEngineShadowCheck('moduleId')  // specific module
 */
import useStore from '@/AppBuilder/_stores/store';
import { ResolutionEngine } from './ResolutionEngine';
import { serializeGraph } from './graphSerializer';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Replaced by webpack DefinePlugin at build time.
declare const process: { env: { NODE_ENV?: string } };

export interface ShadowMismatch {
  path: string;
  engineValue: unknown;
  storeValue: unknown;
  bucket: 'value-mismatch' | 'store-missing' | 'row-scoped-skipped' | 'sentinel-skipped';
}

export interface ShadowReport {
  moduleId: string;
  bindingsChecked: number;
  matches: number;
  mismatches: ShadowMismatch[];
  skipped: { rowScoped: number; sentinels: number; nonComponent: number };
}

/** Read the store's resolved value for a binding path like
 *  "components.<id>.<paramType>.<property>" (applyDependencyUpdate's shape). */
function readStoreResolvedValue(resolvedModule: any, path: string): { found: boolean; value?: unknown } {
  const parts = path.split('.');
  const [entityType, entityId, ...rest] = parts;
  let node = resolvedModule?.[entityType]?.[entityId];
  for (const key of rest) {
    if (node == null || typeof node !== 'object') return { found: false };
    node = node[key];
  }
  return node === undefined ? { found: false } : { found: true, value: node };
}

const stable = (v: unknown): string => {
  try {
    return JSON.stringify(v) ?? 'undefined';
  } catch {
    return '<unserializable>';
  }
};

export function runShadowCheck(moduleId = 'canvas'): ShadowReport {
  const store = (useStore as any).getState();
  const liveGraph = store.dependencyGraph.modules[moduleId]?.graph;
  const resolvedModule = store.resolvedStore.modules[moduleId];
  if (!liveGraph || !resolvedModule) {
    throw new Error(`No graph/resolvedStore for module '${moduleId}'`);
  }

  const engine = new ResolutionEngine();
  engine.init({
    graph: serializeGraph(liveGraph),
    bindings: [],
    // raw: true — this feeds ResolutionEngine.init, which _.cloneDeep's the
    // seed; cloning the lazy-ListView-read Proxy from getAllExposedValues
    // would break it (see resolvedSlice.js's getAllExposedValues comment).
    seedState: store.getAllExposedValues(moduleId, { raw: true }),
  });

  const report: ShadowReport = {
    moduleId,
    bindingsChecked: 0,
    matches: 0,
    mismatches: [],
    skipped: { rowScoped: 0, sentinels: 0, nonComponent: 0 },
  };

  for (const { path, value: engineValue } of engine.resolveAllBindings()) {
    if (path.endsWith('.__options__')) {
      report.skipped.sentinels++;
      continue; // query re-run sentinel, not a resolved value
    }
    if (!path.startsWith('components.')) {
      report.skipped.nonComponent++;
      continue; // queries/pages resolve through different store paths — later slice
    }
    const componentId = path.split('.')[1];
    const componentNode = resolvedModule.components?.[componentId];
    if (Array.isArray(componentNode)) {
      report.skipped.rowScoped++;
      continue; // ListView/Table child — engine row scoping lands with Phase 3/4
    }

    report.bindingsChecked++;
    const stored = readStoreResolvedValue(resolvedModule, path);
    if (!stored.found) {
      report.mismatches.push({ path, engineValue, storeValue: undefined, bucket: 'store-missing' });
    } else if (stable(stored.value) === stable(engineValue)) {
      report.matches++;
    } else {
      report.mismatches.push({ path, engineValue, storeValue: stored.value, bucket: 'value-mismatch' });
    }
  }

  return report;
}

// Dev-console hook. Guarded so production bundles and the future worker host
// (no window) never register it.
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  (window as any).__tjEngineShadowCheck = (moduleId?: string) => {
    const report = runShadowCheck(moduleId);
    const pct = report.bindingsChecked ? Math.round((report.matches / report.bindingsChecked) * 100) : 100;
    // eslint-disable-next-line no-console
    console.log(
      `[engine-shadow] ${report.matches}/${report.bindingsChecked} match (${pct}%) · ` +
        `skipped: ${report.skipped.rowScoped} row-scoped, ${report.skipped.sentinels} sentinels, ` +
        `${report.skipped.nonComponent} non-component`,
      report.mismatches.length ? report.mismatches : ''
    );
    return report;
  };
}
