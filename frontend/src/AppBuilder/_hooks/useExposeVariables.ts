/**
 * Shared visibility/disable/loading exposure — controlled (Phase 3b wave 2).
 *
 * The store (via useExposedVariable) is the source of truth for
 * isVisible/isDisabled/isLoading — the hook owns no useState. CSAs are
 * one-line dispatchers generated from the type's standard contract
 * (contractGroups/standard.ts) instead of per-instance closures; the returned
 * setters dispatch the same commands. Property changes remain write-throughs.
 *
 * Return surface is IDENTICAL to the old local-useState hook; consumers only
 * added the trailing `meta` arg ({ id, componentType, moduleId, resolveIndex }).
 */
import { useCallback, useEffect, useRef } from 'react';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { ensureStandardContract } from '@/AppBuilder/_engine/contractGroups/standard';

export interface ExposeStateMeta {
  id: string;
  componentType: string;
  moduleId?: string;
  resolveIndex?: number[] | number;
}

export const useExposeState = (
  loadingState: boolean,
  visibleState: boolean,
  disabledState: boolean,
  setExposedVariables: (variables: Record<string, unknown>) => void,
  setExposedVariable: (key: string, value: unknown) => void,
  meta: ExposeStateMeta
) => {
  const { id, componentType, moduleId, resolveIndex } = meta;
  // Types not converted individually get the standard trio contract (no-op
  // when a richer contract already exists for the type).
  ensureStandardContract(componentType);

  const isInitialRender = useRef(true);
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
  });

  /* ── Reads: exposed values, resolved properties as pre-publish fallback ── */
  const exposedOpts = { resolveIndex, moduleId };
  const isVisible = useExposedVariable<boolean>(id, 'isVisible', exposedOpts, visibleState ?? true);
  const isDisabled = useExposedVariable<boolean>(id, 'isDisabled', exposedOpts, disabledState ?? false);
  const isLoading = useExposedVariable<boolean>(id, 'isLoading', exposedOpts, loadingState ?? false);

  /* ── Setters: same names as the old useState setters, now command
     dispatches through the contract reducers ──────────────────────────── */
  const setVisibility = useCallback(
    (value: unknown) => dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setVisibility', args: [value] }]),
    [dispatch, id]
  );
  const setDisable = useCallback(
    (value: unknown) => dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setDisable', args: [value] }]),
    [dispatch, id]
  );
  const setLoading = useCallback(
    (value: unknown) => dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setLoading', args: [value] }]),
    [dispatch, id]
  );

  /* ── Property-sync write-throughs (mirror the old prop→state effects;
     skip-initial — the mount snapshot publishes first values) ─────────── */
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibleState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  /* ── Mount: initial exposed snapshot + contract-generated CSA dispatchers
     (replaces the old per-instance setDisable/setVisibility/setLoading
     closures) in ONE batch ────────────────────────────────────────────── */
  useEffect(() => {
    setExposedVariables({
      isVisible: visibleState,
      isDisabled: disabledState,
      isLoading: loadingState,
      ...csaShims(),
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isDisabled,
    setDisable,
    isVisible,
    setVisibility,
    isLoading,
    setLoading,
  };
};
