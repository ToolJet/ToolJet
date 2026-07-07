/**
 * Shared row-scoped seeding + comparison helpers for the Resolution
 * Engine's shadow-diff paths (engineBridge.ts's continuous mirror,
 * shadow.ts's one-shot check). Both previously duplicated an independent
 * `Array.isArray(...) → skip` check for row-scoped (ListView/Kanban/Table)
 * bindings; this factors that out, replacing "skip" with "compare only the
 * row indices the store has actually resolved."
 *
 * Kept separate from ResolutionEngine.ts: this file reads the LIVE store
 * directly (not pure/worker-hostable) — it's how a store-aware host builds
 * the engine's row-scoped seed and decides what's safe to compare, not
 * something the engine itself needs to know how to do.
 */
import { ROW_SCOPED_WIDGET_TYPES, ROW_SCOPED_RESOLVABLE_KEY_MAP } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import type { EngineInit } from './ResolutionEngine';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RowScopedEngineSeed = Pick<
  EngineInit,
  'rowScopedParentOf' | 'containerChildrenMapping' | 'customResolvables' | 'resolvableKeyOf' | 'lazyRowIndicesOf'
>;

/** Builds the row-scoped EngineInit fields by reading the live store
 *  directly — cheap, pure data reads, no new store-side computation. Every
 *  field mirrors state the store already maintains for its own row-scoped
 *  resolution (prepareRowScope/getCustomResolvables/isLazyResolvableParent). */
export function buildRowScopedEngineSeed(store: any, moduleId: string): RowScopedEngineSeed {
  const containerChildrenMapping: Record<string, string[]> = store.containerChildrenMapping ?? {};
  const rowScopedParentOf: Record<string, string> = {};
  const customResolvables: Record<string, Record<string, unknown>[]> = {};
  const resolvableKeyOf: Record<string, string> = {};
  const lazyRowIndicesOf: Record<string, number[]> = {};

  const resolvedModule = store.resolvedStore?.modules?.[moduleId];
  const rawCustomResolvables = resolvedModule?.customResolvables ?? {};
  const lazyResolvableParents = resolvedModule?.lazyResolvableParents ?? {};
  const lazyRowIndices = resolvedModule?.lazyRowIndices ?? {};

  const pageComponents = store.getCurrentPageComponents?.(moduleId) ?? {};
  for (const [componentId, entry] of Object.entries<any>(pageComponents)) {
    const componentType = entry?.component?.component;
    if (!ROW_SCOPED_WIDGET_TYPES.includes(componentType)) continue;

    resolvableKeyOf[componentId] = (ROW_SCOPED_RESOLVABLE_KEY_MAP as Record<string, string>)[componentType];
    const rows = rawCustomResolvables[componentId];
    if (Array.isArray(rows)) customResolvables[componentId] = rows;
    if (lazyResolvableParents[componentId] && Array.isArray(lazyRowIndices[componentId])) {
      lazyRowIndicesOf[componentId] = lazyRowIndices[componentId];
    }

    // Mark every (recursive) descendant as belonging to this row-scoped
    // parent — mirrors prepareRowScope's own descendant walk.
    const stack = [componentId];
    while (stack.length) {
      const id = stack.pop() as string;
      for (const childId of containerChildrenMapping[id] ?? []) {
        rowScopedParentOf[childId] = componentId;
        stack.push(childId);
      }
    }
  }

  return { rowScopedParentOf, containerChildrenMapping, customResolvables, resolvableKeyOf, lazyRowIndicesOf };
}

/** Nearest row-scoped ancestor id for `entityId`, or null if it isn't one —
 *  a live, on-demand equivalent of findNearestSubcontainerAncestor (which
 *  needs the live component tree, unlike the engine's own static seed). */
function getRowScopedParentId(store: any, entityId: string, moduleId: string): string | null {
  const componentDef = store.getComponentDefinition(entityId, moduleId);
  const parentId = componentDef?.component?.parent;
  if (!parentId) return null;
  return store.findNearestSubcontainerAncestor(parentId, moduleId) ?? null;
}

/** Given a row-scoped storeNode (array of per-row resolved-property
 *  entries) and the component id it belongs to, returns the row indices
 *  that are safe to compare right now — the store's own currently-resolved
 *  set (respecting isLazyResolvableParent/getLazyRowIndices) — or null if
 *  `entityId` isn't row-scoped at all, so callers fall back to whatever
 *  non-row-scoped handling they already had. */
export function getComparableRowIndices(store: any, entityId: string, moduleId: string): number[] | null {
  const parentId = getRowScopedParentId(store, entityId, moduleId);
  if (!parentId) return null;
  if (store.isLazyResolvableParent(parentId, moduleId)) {
    return store.getLazyRowIndices(parentId, moduleId) ?? [];
  }
  const rows = store.resolvedStore?.modules?.[moduleId]?.customResolvables?.[parentId];
  return Array.isArray(rows) ? rows.map((_row: unknown, i: number) => i) : [];
}
