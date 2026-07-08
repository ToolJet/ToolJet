/**
 * Worker write-behind (Phase 6, Stages 1-3). Applies a worker cascade's
 * computed updates back to resolvedStore, ASYNCHRONOUSLY, after the fact —
 * never as the first/only source of a value (that's what the fully-
 * synchronous engineBridge.ts cutover seam is for, and it cannot be
 * replicated across a worker boundary — there's no synchronous cross-thread
 * call in this codebase). Hybrid by design: the main thread keeps computing
 * every value synchronously, unchanged; the worker's answer confirms or
 * corrects the store a frame or more later.
 *
 * Modeled on CustomComponent.jsx's postMessage->diff->setExposedVariable
 * pattern: eventually consistent, "confirm or correct," not inline with the
 * cascade. Since the worker's computed values already match the store's (0
 * divergence, Phase 5 dogfood), a correctly working write-behind is a
 * functional no-op on a healthy app — what this proves is that the store can
 * be safely written to from an async worker-originated callback, and that a
 * stale answer (superseded by a newer cascade on the same path before the
 * round-trip completed) gets detected and dropped rather than clobbering a
 * fresher value.
 *
 * Scope: `components.<id>.<type>.<key>` bindings (flat and single-level
 * row-scoped) and `others.<key>` (canvas background color, page-sidebar
 * visibility — the only other cascade-target shape that exists). Does NOT
 * touch: nested (ListView-in-ListView) row scoping, array-notation keys (no
 * matching store setter), `.__options__` sentinels, componentCommands.ts's
 * CSA dispatch, or dynamicHeightReflow's layout loop.
 *
 * Dev usage (browser console):
 *   window.__tjWorkerEngineWriteBehindStart()
 *   window.__tjWorkerEngineWriteBehindStats()
 *   window.__tjWorkerEngineWriteBehindStop()
 */
import useStore from '@/AppBuilder/_stores/store';
import { parseResolvedPath } from './resolvedPathUtils';
import { isSourcePathStale, type WorkerShadowCommand } from './workerCommandBatcher';
import { getComparableRowIndices } from './rowScopedShadow';
import { ROW_UNRESOLVABLE } from './ResolutionEngine';
import { isQueryDataHandle, materializeQueryDataHandle } from '@/AppBuilder/_utils/queryDataHandle';
import type { UpdateNode } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WorkerWriteBehindStats {
  applied: number;
  appliedOther: number;
  droppedStale: number;
  skippedRowScoped: number;
  skippedArrayNotation: number;
  skippedNonComponent: number;
  errors: number;
}

let active = false;
const stats: WorkerWriteBehindStats = {
  applied: 0,
  appliedOther: 0,
  droppedStale: 0,
  skippedRowScoped: 0,
  skippedArrayNotation: 0,
  skippedNonComponent: 0,
  errors: 0,
};

export function isWorkerWriteBehindActive(): boolean {
  return active;
}

export function startWorkerWriteBehind(): void {
  active = true;
}

export function stopWorkerWriteBehind(): void {
  active = false;
}

export function workerWriteBehindStats(): WorkerWriteBehindStats {
  return { ...stats };
}

/**
 * "Sole computer" cutover (experimental, opt-in, off by default): unlike
 * plain write-behind (main thread still computes every value synchronously;
 * worker only confirms/corrects after the fact), cutover makes
 * applyDependencyUpdate SKIP its own computation entirely for eligible
 * bindings — the worker's async answer, arriving via write-behind, becomes
 * the ONLY writer for that dependent path. This trades instant propagation
 * (dependent widgets now update a frame or more after the trigger, once the
 * worker round-trip completes) for genuinely moving that computation off the
 * main thread instead of duplicating it.
 *
 * Requires write-behind (and the shadow session it rides on) to be active —
 * without them nothing would ever write the skipped paths at all, leaving
 * dependent bindings permanently blank. startWorkerCutover() turns both on.
 *
 * Known rough edge: on first load, before the worker has finished
 * initializing a module's engine, cutover-eligible bindings have nothing
 * writing them until that first round-trip completes — a brief blank/stale
 * flash is possible. Not addressed in this pass; flag if it's disruptive.
 */
let cutoverActive = false;

export function isWorkerCutoverActive(): boolean {
  return cutoverActive;
}

export function startWorkerCutover(): void {
  cutoverActive = true;
  active = true; // cutover is meaningless without write-behind actually writing
}

export function stopWorkerCutover(): void {
  cutoverActive = false;
}

/**
 * `toApply` is the SAME filtered list dispatchWorkerCommand already builds
 * for compareUpdatesToStore — reused as-is, not recomputed.
 */
export function applyWorkerWriteBehind(toApply: UpdateNode[], cmd: WorkerShadowCommand): void {
  if (!active) return;

  if (isSourcePathStale(cmd.moduleId, cmd.path, cmd.seq)) {
    stats.droppedStale += toApply.length || 1;
    return;
  }

  const store = (useStore as any).getState();

  for (const { path: bindingPath, value: rawEngineValue } of toApply) {
    const { entityType, entityId, type, key, isArrayNotation } = parseResolvedPath(bindingPath);

    // Re-check right before each write too — applying N updates in this
    // loop isn't atomic vs. a same-tick main-thread cascade landing mid-loop.
    if (isSourcePathStale(cmd.moduleId, cmd.path, cmd.seq)) {
      stats.droppedStale += toApply.length; // approximate remainder, fine for a dev stat
      return;
    }

    // Query-data handle (Phase 6 Stage 2): the worker was given a lightweight
    // marker instead of a large query result. The real value never actually
    // left the main thread — read it straight back from the store rather
    // than writing the marker itself.
    const engineValue = isQueryDataHandle(rawEngineValue)
      ? materializeQueryDataHandle(rawEngineValue, store, cmd.moduleId)
      : rawEngineValue;

    if (entityType === 'others' && !type) {
      try {
        store.setResolvedOtherByKey(entityId, engineValue, cmd.moduleId);
        stats.appliedOther++;
      } catch (e) {
        stats.errors++;
        // eslint-disable-next-line no-console
        console.error('[worker-write-behind] failed to apply (others)', bindingPath, e);
      }
      continue;
    }

    if (entityType !== 'components' || !type) {
      stats.skippedNonComponent++;
      continue;
    }
    if (isArrayNotation) {
      stats.skippedArrayNotation++;
      continue;
    }

    // Row-scoping is a STRUCTURAL property of the store's node for this
    // entity (an array of per-row entries for a ListView/Kanban/Table
    // descendant), never a property of the resolved VALUE's own type — a
    // perfectly ordinary flat property can hold an array value (e.g.
    // Table's own `data` property bound to `{{queries.x.data}}`) without
    // being row-scoped at all. Checking Array.isArray(engineValue) instead
    // of the store's shape here previously misrouted exactly that case into
    // the row-scoped branch, which then skipped the write entirely (Table's
    // own entityId isn't a row-scoped descendant, so getComparableRowIndices
    // correctly returned null) — this is the actual store-shape check,
    // matching shadowCompare.ts's own Array.isArray(storeNode) branch.
    const currentNode = store.resolvedStore.modules[cmd.moduleId]?.components?.[entityId];

    if (Array.isArray(currentNode)) {
      if (!Array.isArray(engineValue)) {
        // Structural mismatch between engine and store shape for this
        // entity — shouldn't happen given Phase 5's 0-divergence dogfood,
        // but nothing sane to write if it does.
        stats.skippedRowScoped++;
        continue;
      }
      // Only write the row indices the store has actually resolved
      // (respects isLazyResolvableParent/getLazyRowIndices), same reasoning
      // as shadowCompare.ts's comparison path.
      const comparableIndices = getComparableRowIndices(store, entityId, cmd.moduleId);
      if (!comparableIndices) {
        stats.skippedRowScoped++;
        continue;
      }
      const updates = comparableIndices
        .filter((i) => engineValue[i] !== undefined && engineValue[i] !== ROW_UNRESOLVABLE)
        .map((i) => ({ index: i, value: engineValue[i] }));
      if (!updates.length) continue;
      try {
        // One set() call for all rows — avoids N separate re-render triggers
        // for a large Table (setResolvedComponentByProperty validates
        // internally per-row inside the batch setter; do NOT re-validate).
        store.setResolvedComponentByPropertyBatch(entityId, type, key, updates, cmd.moduleId);
        stats.applied += updates.length;
      } catch (e) {
        stats.errors++;
        // eslint-disable-next-line no-console
        console.error('[worker-write-behind] failed to apply (row-scoped)', bindingPath, e);
      }
      continue;
    }

    try {
      // Flat write — engineValue may legitimately be an array here (Table's
      // own `data`, a Multiselect's selection, etc.); that's fine, it's just
      // a value. setResolvedComponentByProperty validates internally
      // (resolvedSlice.js) — do NOT re-validate here.
      store.setResolvedComponentByProperty(entityId, type, key, engineValue, null, cmd.moduleId);
      stats.applied++;
    } catch (e) {
      stats.errors++;
      // eslint-disable-next-line no-console
      console.error('[worker-write-behind] failed to apply', bindingPath, e);
    }
  }
}
