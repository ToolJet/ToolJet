/**
 * Shared engine-vs-store comparison for the shadow-diff paths. Extracted from
 * engineBridge.ts's continuous mirror so the same comparison logic can be
 * reused by a worker-hosted engine mirror (Phase 5) without duplicating the
 * row-scoped/validation handling.
 */
import useStore from '@/AppBuilder/_stores/store';
import { ROW_UNRESOLVABLE } from './ResolutionEngine';
import { getComparableRowIndices } from './rowScopedShadow';
import { parseResolvedPath } from './resolvedPathUtils';
import { isQueryDataHandle, materializeQueryDataHandle } from '@/AppBuilder/_utils/queryDataHandle';
import { get as lodashGet } from 'lodash';
import type { UpdateNode } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Divergence {
  path: string;
  engineValue: unknown;
  storeValue: unknown;
  trigger: string;
  source: 'main' | 'worker';
}

export interface CompareSession {
  compared: number;
  matches: number;
  divergences: Divergence[];
  skipped: {
    rowScoped: number;
    rowUnresolvable: number;
    [key: string]: number;
  };
}

const stable = (v: unknown): string => {
  try {
    return JSON.stringify(v) ?? 'undefined';
  } catch {
    return '<unserializable>';
  }
};

/**
 * Compares engine-produced updates against what the store actually wrote to
 * resolvedStore for the same cascade. Call this from a microtask (or later)
 * so the store's synchronous writes have already landed.
 */
export function compareUpdatesToStore(
  toCompare: UpdateNode[],
  triggerPath: string,
  moduleId: string,
  session: CompareSession,
  source: 'main' | 'worker' = 'main'
): void {
  const state = (useStore as any).getState();
  const resolvedModule = state.resolvedStore.modules[moduleId];
  for (const { path: bindingPath, value: rawEngineValue } of toCompare) {
    const { entityType, entityId, type, key } = parseResolvedPath(bindingPath);
    const storeNode = resolvedModule?.[entityType]?.[entityId];
    // Query-data handle (Phase 6 Stage 2): a pure pass-through binding
    // resolves to the lightweight marker itself in the worker — swap it for
    // the real value (which never left the main thread) before comparing,
    // same as workerWriteBehind.ts does before writing.
    const engineValue = isQueryDataHandle(rawEngineValue) ? materializeQueryDataHandle(rawEngineValue, state, moduleId) : rawEngineValue;

    if (Array.isArray(storeNode)) {
      // Row-scoped: compare only the row indices the store has actually
      // resolved (respects isLazyResolvableParent/getLazyRowIndices) —
      // comparing against a row the store hasn't computed yet would just
      // be a false divergence, not a real one.
      const comparableIndices = entityType === 'components' ? getComparableRowIndices(state, entityId, moduleId) : null;
      if (!comparableIndices) {
        session.skipped.rowScoped++;
        continue;
      }
      const engineValues = Array.isArray(engineValue) ? engineValue : [];
      for (const i of comparableIndices) {
        const storeRowNode = storeNode[i];
        if (storeRowNode === undefined) continue; // store hasn't materialized this row yet
        if (engineValues[i] === ROW_UNRESOLVABLE) {
          session.skipped.rowUnresolvable++;
          continue; // engine's seed has no data for a descendant this row needs — see ROW_UNRESOLVABLE
        }
        const validatedEngineValue = type
          ? state.debugger.validateProperty(entityId, type, key, engineValues[i], moduleId)
          : engineValues[i];
        const storeValue = type ? lodashGet(storeRowNode, [type, ...key.split('.')]) : storeRowNode;
        session.compared++;
        if (stable(validatedEngineValue) === stable(storeValue)) {
          session.matches++;
        } else {
          const rowPath = `${bindingPath}[${i}]`;
          session.divergences.push({ path: rowPath, engineValue: validatedEngineValue, storeValue, trigger: triggerPath, source });
          // eslint-disable-next-line no-console
          console.warn(`[engine-shadow:${source}] divergence`, {
            path: rowPath,
            engineValue: validatedEngineValue,
            storeValue,
            trigger: triggerPath,
          });
        }
      }
      continue;
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
      session.divergences.push({ path: bindingPath, engineValue: validatedEngineValue, storeValue, trigger: triggerPath, source });
      // eslint-disable-next-line no-console
      console.warn(`[engine-shadow:${source}] divergence`, {
        path: bindingPath,
        engineValue: validatedEngineValue,
        storeValue,
        trigger: triggerPath,
      });
    }
  }
}
