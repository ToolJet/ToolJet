/**
 * Controlled replacement for useInput (Phase 3a §1b).
 *
 * The store (via useExposedVariable) is the single source of truth for
 * exposed state — the widget owns no value/visibility/loading/disable
 * useState. All mutations become EngineCommands dispatched through
 * dispatchComponentCommands; CSAs are one-line dispatchers generated from the
 * component-type contract instead of per-instance closures. Presentational
 * state (focus, label layout, validation-error visibility) stays local.
 *
 * Return surface is identical to useInput so consumers swap imports only.
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useGridStore } from '@/_stores/gridStore';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import {
  dispatchComponentCommands,
  registerEffectHandlers,
  DispatchCtx,
} from '@/AppBuilder/_engine/componentCommands';
import { getContract } from '@/AppBuilder/_engine/contracts';
import type { EngineCommand } from '@/AppBuilder/_engine/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface UseControlledInputArgs {
  id: string;
  properties: Record<string, any>;
  styles: Record<string, any>;
  validation?: Record<string, any>;
  validate?: (value: unknown) => { isValid?: boolean; validationError?: string } | undefined;
  setExposedVariables: (variables: Record<string, unknown>) => void;
  fireEvent: (eventName: string, ...args: unknown[]) => void;
  componentType: string;
  moduleId?: string;
  resolveIndex?: number[] | number;
  width?: number;
}

const NO_ECHO = Symbol('no-echo');

/** CSAs that fire onChange after mutating value (useInput.js:184-231 parity). */
const VALUE_EVENT_ACTIONS = new Set(['setValue', 'setText', 'clear']);

export const useControlledInput = ({
  id,
  properties,
  styles,
  validation,
  validate,
  setExposedVariables,
  fireEvent,
  componentType,
  moduleId,
  resolveIndex,
  width,
}: UseControlledInputArgs) => {
  const isInitialRender = useRef(true);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>();
  const labelRef = useRef<HTMLElement>();

  const { loadingState, disabledState, label } = properties;
  const isResizing = useGridStore((state: any) => state.resizingComponentId === id);

  const indices = resolveIndex === undefined || resolveIndex === null ? [] : Array.isArray(resolveIndex) ? resolveIndex : [resolveIndex];
  const rowKey = indices.length ? `${id}:${indices.join('.')}` : undefined;
  const exposedOpts = { resolveIndex, moduleId };

  /* ── Reads: store is the source of truth, resolved properties are the
     pre-first-publish fallback ──────────────────────────────────────────── */
  const storeValue = useExposedVariable(id, 'value', exposedOpts, properties.value ?? '');
  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);
  const loading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const disable = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState || loadingState);
  const country = useExposedVariable(id, 'country', exposedOpts, properties.defaultCountry || 'US');

  // Local echo overlay: per-row store writes are microtask-deferred, so the
  // keystroke would not render until the store catches up (cursor jumps).
  // Render the last dispatched value until the store converges to it.
  const echoRef = useRef<unknown>(NO_ECHO);
  const [, setEchoTick] = useState(0);
  const setEcho = useCallback((next: unknown) => {
    echoRef.current = next;
    setEchoTick((tick) => tick + 1);
  }, []);
  const value = echoRef.current === NO_ECHO ? storeValue : echoRef.current;
  useEffect(() => {
    if (echoRef.current !== NO_ECHO && Object.is(storeValue, echoRef.current)) echoRef.current = NO_ECHO;
  }, [storeValue]);

  /* ── Derived + presentational state ───────────────────────────────────── */
  const validationStatus = useMemo(() => validate?.(value) ?? {}, [value, validate]);
  const { isValid, validationError } = validationStatus;
  const isMandatory = validation?.mandatory ?? false;

  const [showValidationError, setShowValidationError] = useState(false);
  useShowValidationOnFormSubmit(setShowValidationError);
  const [isFocused, setIsFocused] = useState(false);
  const [labelWidth, setLabelWidth] = useState(0);
  const [iconVisibility, setIconVisibility] = useState(false);

  /* ── Dispatch context: latest-ref so mount-registered CSA dispatchers never
     go stale ────────────────────────────────────────────────────────────── */
  const currentExposedRef = useRef<Record<string, unknown>>({});
  currentExposedRef.current = { value, country, isVisible: visibility, isDisabled: disable, isLoading: loading };
  const validationStatusRef = useRef(validationStatus);
  validationStatusRef.current = validationStatus;

  const ctxRef = useRef<DispatchCtx>();
  ctxRef.current = {
    componentId: id,
    componentType,
    moduleId,
    setExposedVariables,
    getCurrentExposed: () => currentExposedRef.current,
    validate,
    fireEvent,
    rowKey,
    onPatch: (patch) => {
      if ('value' in patch) setEcho(patch.value);
    },
  };

  const dispatch = useCallback((commands: EngineCommand[]) => {
    dispatchComponentCommands(commands, ctxRef.current as DispatchCtx);
  }, []);

  /* ── Label layout (presentational, unchanged from useInput.js:85-103) ──── */
  useEffect(() => {
    if (labelRef?.current) {
      const absolutewidth = labelRef?.current?.getBoundingClientRect()?.width;
      setLabelWidth(absolutewidth);
    } else setLabelWidth(0);
  }, [
    isResizing,
    styles.width,
    styles.auto,
    styles.alignment,
    styles.iconVisibility,
    label?.length,
    isMandatory,
    styles.padding,
    styles.direction,
    styles.widthType,
    width,
    labelRef?.current?.getBoundingClientRect()?.width,
  ]);

  /* ── Property-sync effects (mirror useInput.js:105-153; skip-initial — the
     mount snapshot publishes first values) ──────────────────────────────── */
  useEffect(() => {
    if (isInitialRender.current) return;
    ctxRef.current?.setExposedVariables({ label });
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    ctxRef.current?.setExposedVariables({ isDisabled: disabledState });
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    ctxRef.current?.setExposedVariables({ isVisible: properties.visibility });
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    ctxRef.current?.setExposedVariables({ isLoading: loadingState });
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    ctxRef.current?.setExposedVariables({ isMandatory });
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    ctxRef.current?.setExposedVariables({ isValid: validationStatusRef.current?.isValid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [properties.value ?? ''] }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  /* ── Mount shim: initial exposed snapshot + contract-generated CSA
     dispatchers + effect-handler registration (useInput.js:182-235) ─────── */
  useEffect(() => {
    const contract = getContract(componentType);
    const exposed: Record<string, unknown> = {
      label,
      isValid: validationStatusRef.current?.isValid,
      value: properties.value ?? '',
      isMandatory,
      isLoading: loadingState,
      isVisible: properties.visibility,
      isDisabled: disabledState || loadingState,
    };
    for (const action of Object.keys(contract?.stateActions ?? {})) {
      exposed[action] = async (...args: unknown[]) => {
        const commands: EngineCommand[] = [{ kind: 'INVOKE_CSA', componentId: id, action, args }];
        if (VALUE_EVENT_ACTIONS.has(action)) commands.push({ kind: 'FIRE_EVENT', componentId: id, event: 'onChange' });
        dispatch(commands);
      };
    }
    for (const effect of contract?.effectActions ?? []) {
      exposed[effect] = async (...args: unknown[]) =>
        dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: effect, args }]);
    }
    ctxRef.current?.setExposedVariables(exposed);

    const unregister = registerEffectHandlers(id, rowKey, {
      setFocus: () => inputRef.current?.focus(),
      setBlur: () => inputRef.current?.blur(),
    });
    isInitialRender.current = false;
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Mutations: user input → commands ─────────────────────────────────── */
  const setInputValue = useCallback(
    (nextValue: unknown) => {
      setEcho(nextValue);
      dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [nextValue] }]);
    },
    [dispatch, id, setEcho]
  );

  const handleChange = (e: any) => {
    setEcho(e.target.value);
    dispatch([
      { kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [e.target.value] },
      { kind: 'FIRE_EVENT', componentId: id, event: 'onChange' },
    ]);
  };

  // NOTE - only used by Currency input (not phone); currency/phone semantics
  // land with their contracts (Phase 3a steps 5-6).
  const handlePhoneCurrencyInputChange = (nextValue: unknown) => {
    setEcho(nextValue);
    dispatch([
      { kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [nextValue] },
      { kind: 'FIRE_EVENT', componentId: id, event: 'onChange' },
    ]);
  };

  const setPhoneInputValue = setInputValue;

  const setCountry = useCallback((nextCountry: unknown) => {
    ctxRef.current?.setExposedVariables({ country: nextCountry });
  }, []);

  const handleBlur = (e: any) => {
    setShowValidationError(true);
    setIsFocused(false);
    e.stopPropagation();
    fireEvent('onBlur');
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    e.stopPropagation();
    setTimeout(() => {
      fireEvent('onFocus');
    }, 0);
  };

  const handleKeyUp = (e: any) => {
    if (e.key === 'Enter') {
      setEcho(e.target.value);
      dispatch([
        { kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [e.target.value] },
        { kind: 'FIRE_EVENT', componentId: id, event: 'onEnterPressed' },
      ]);
    }
  };

  return {
    inputRef,
    labelRef,
    value,
    visibility,
    loading,
    disable,
    country,
    setCountry,
    validationStatus,
    showValidationError,
    setShowValidationError,
    isFocused,
    labelWidth,
    iconVisibility,
    setIconVisibility,
    isValid,
    validationError,
    isMandatory,
    setInputValue,
    setPhoneInputValue,
    handlePhoneCurrencyInputChange,
    handleChange,
    handleBlur,
    handleFocus,
    handleKeyUp,
  };
};
