/**
 * Generic command plumbing for controlled widgets outside the useInput family
 * (Phase 3b). Gives any widget:
 *   - dispatch(commands): row-aware EngineCommand dispatch through the seam
 *   - csaShims(): per-type CSA dispatchers generated from the contract, to be
 *     merged into the widget's initial setExposedVariables snapshot
 *   - registerEffects(handlers): ref-based Bucket C handlers with cleanup
 *
 * Reducers read current state through a lazy row-aware proxy (per-key lookup
 * via getExposedPropertyForAdditionalActions), so `toggle`-style actions see
 * the correct row's value.
 */
import { useCallback, useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import {
  dispatchComponentCommands,
  registerEffectHandlers,
  type DispatchCtx,
} from '@/AppBuilder/_engine/componentCommands';
import { getContract } from '@/AppBuilder/_engine/contracts';
import type { EngineCommand } from '@/AppBuilder/_engine/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ComponentCommandProps {
  id: string;
  componentType: string;
  moduleId?: string;
  resolveIndex?: number[] | number;
  setExposedVariables: (variables: Record<string, unknown>) => void;
  fireEvent?: (eventName: string, ...args: unknown[]) => void;
  validate?: (value: unknown, patch?: Record<string, unknown>) => { isValid?: boolean } | undefined;
}

export function useComponentCommands(props: ComponentCommandProps) {
  const { id, componentType, moduleId = 'canvas', resolveIndex } = props;
  const rowKey =
    resolveIndex !== undefined && resolveIndex !== null
      ? `${id}:${Array.isArray(resolveIndex) ? resolveIndex.join('.') : resolveIndex}`
      : undefined;

  // Latest-ref: mount-registered CSA shims must never close over stale props.
  const ctxRef = useRef<DispatchCtx>(null as unknown as DispatchCtx);
  ctxRef.current = {
    componentId: id,
    componentType,
    moduleId,
    rowKey,
    setExposedVariables: props.setExposedVariables,
    fireEvent: props.fireEvent,
    validate: props.validate,
    getCurrentExposed: () =>
      new Proxy(
        {},
        {
          get: (_t, key) =>
            typeof key === 'string'
              ? (useStore as any)
                  .getState()
                  .getExposedPropertyForAdditionalActions(id, resolveIndex, key, moduleId)
              : undefined,
        }
      ) as Record<string, unknown>,
  };

  const dispatch = useCallback((commands: EngineCommand[]) => {
    dispatchComponentCommands(commands, ctxRef.current);
  }, []);

  /** One-line CSA dispatchers for every contract action — merge into the
   *  widget's initial exposed snapshot (replaces per-instance closures). */
  const csaShims = useCallback((): Record<string, (...args: unknown[]) => Promise<void>> => {
    const contract = getContract(componentType);
    if (!contract) return {};
    const shims: Record<string, (...args: unknown[]) => Promise<void>> = {};
    for (const action of [...Object.keys(contract.stateActions), ...(contract.effectActions ?? [])]) {
      shims[action] = async (...args: unknown[]) =>
        dispatch([{ kind: 'INVOKE_CSA', componentId: id, action, args }]);
    }
    return shims;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentType, id, dispatch]);

  /** Register Bucket C handlers (focus/scroll/…) for this mounted instance. */
  const registerEffects = (handlers: Record<string, (...args: unknown[]) => void>) =>
    registerEffectHandlers(id, rowKey, handlers);

  // Convenience: register-and-cleanup as an effect for the common case.
  const useEffects = (handlers: Record<string, (...args: unknown[]) => void>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => registerEffectHandlers(id, rowKey, handlers), []); // eslint-disable-line react-hooks/exhaustive-deps
  };

  return { dispatch, csaShims, registerEffects, useEffects, rowKey };
}
