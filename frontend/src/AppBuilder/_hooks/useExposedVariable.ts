/**
 * Reactive read seam for controlled widgets (Phase 3a).
 *
 * Subscribes to one exposed value of a component, row-aware: delegates to the
 * store's getExposedPropertyForAdditionalActions, which already handles flat
 * components, Form children (parent.children[name]) and (nested) ListView rows
 * (parent[outerIdx...].children[rowIdx][name]) — no logic duplication here.
 *
 * `fallback` supplies the resolved-property default before the first publish.
 * When the engine later becomes the store of record, this hook is the ONLY
 * read-side code that changes.
 */
import useStore from '@/AppBuilder/_stores/store';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ExposedVariableOpts {
  /** Row indices for ListView-nested widgets (RenderWidget's resolveIndex). */
  resolveIndex?: number[] | number;
  moduleId?: string;
}

export function useExposedVariable<T = unknown>(
  componentId: string,
  property: string,
  opts: ExposedVariableOpts = {},
  fallback?: T
): T {
  const { resolveIndex, moduleId = 'canvas' } = opts;
  return (useStore as any)((state: any) => {
    const value = state.getExposedPropertyForAdditionalActions(componentId, resolveIndex, property, moduleId);
    return value === undefined ? fallback : value;
  });
}
