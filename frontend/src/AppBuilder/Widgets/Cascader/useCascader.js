import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import { buildPathMaps, computeSelection } from './utils';

/**
 * Manages all stateful behavior for the Cascader widget:
 * selection + selected-path exposed variables, component-specific actions,
 * validation, default-value initialization, and clear-on-removal of a
 * selected value that disappears from the (dynamic) option tree.
 *
 * `tree` is the already-normalized option tree (see utils.normalizeTree).
 */
export function useCascader({
  tree,
  pathSeparator,
  defaultValue,
  label,
  visibility,
  disabledState,
  loadingState,
  optionsLoadingState,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  validate,
  validation,
}) {
  const maps = useMemo(() => buildPathMaps(tree), [JSON.stringify(tree)]);

  const isInitialRender = useRef(true);
  const isMandatory = validation?.mandatory ?? false;

  // Refs so the CSAs registered once on mount always read the latest values.
  const mapsRef = useRef(maps);
  mapsRef.current = maps;
  const sepRef = useRef(pathSeparator);
  sepRef.current = pathSeparator;
  const validateRef = useRef(validate);
  validateRef.current = validate;
  const fireEventRef = useRef(fireEvent);
  fireEventRef.current = fireEvent;

  const isValidLeaf = (value) => value !== null && value !== undefined && mapsRef.current.leafSet.has(value);

  const [selectedValue, setSelectedValue] = useState(() => {
    const initialMaps = buildPathMaps(tree);
    return defaultValue !== null && defaultValue !== undefined && initialMaps.leafSet.has(defaultValue)
      ? defaultValue
      : null;
  });

  const [validationStatus, setValidationStatus] = useState(
    validate?.(selectedValue) ?? { isValid: true, validationError: null }
  );
  const [showValidationError, setShowValidationError] = useState(false);
  useShowValidationOnFormSubmit(setShowValidationError);
  const { isValid, validationError } = validationStatus;

  // CSA-controllable local state, synced from properties.
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isOptionsLoading, setIsOptionsLoading] = useState(optionsLoadingState);

  // Apply a selection (valid leaf value or null). Updates state, exposed
  // variables and validation. Does NOT fire onSelect — callers decide.
  const setSelection = useCallback(
    (value) => {
      const safeValue = isValidLeaf(value) ? value : null;
      const sel = computeSelection(safeValue, mapsRef.current, sepRef.current);
      setSelectedValue(sel.value);
      setExposedVariables(sel);
      const vs = validateRef.current?.(sel.value) ?? { isValid: true, validationError: null };
      setValidationStatus(vs);
      setExposedVariable('isValid', vs?.isValid);
      return sel;
    },
    [setExposedVariable, setExposedVariables]
  );

  // === UI handlers ===
  const selectLeafFromUI = useCallback(
    (value) => {
      const sel = setSelection(value);
      if (sel.value !== null) fireEventRef.current('onSelect');
    },
    [setSelection]
  );

  // UI clear fires onSelect (matches DropdownV2 UI clear behavior).
  const clearFromUI = useCallback(() => {
    setSelection(null);
    fireEventRef.current('onSelect');
  }, [setSelection]);

  // === Mount: register exposed variables + CSAs ===
  useEffect(() => {
    const sel = computeSelection(isValidLeaf(selectedValue) ? selectedValue : null, mapsRef.current, sepRef.current);
    setExposedVariables({
      ...sel,
      label,
      isLoading: loadingState,
      isOptionsLoading: optionsLoadingState,
      isVisible: visibility,
      isDisabled: disabledState,
      isValid: validationStatus.isValid,
      isMandatory,
      // setValue: selects matching least-child; invalid/parent clears (no onSelect).
      setValue: async function (value) {
        if (isValidLeaf(value)) {
          setSelection(value);
          fireEventRef.current('onSelect');
        } else {
          setSelection(null);
        }
      },
      clearValue: async function () {
        setSelection(null);
      },
      setLoading: async function (value) {
        setIsLoading(!!value);
        setExposedVariable('isLoading', !!value);
      },
      setOptionsLoading: async function (value) {
        setIsOptionsLoading(!!value);
        setExposedVariable('isOptionsLoading', !!value);
      },
      setVisibility: async function (value) {
        setIsVisible(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async function (value) {
        setIsDisabled(!!value);
        setExposedVariable('isDisabled', !!value);
      },
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default value property changed → re-apply (no onSelect). Invalid/parent clears.
  useEffect(() => {
    if (isInitialRender.current) return;
    setSelection(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  // Option tree or separator changed → refresh selected path, or clear if the
  // selected value is no longer a valid leaf (hidden/removed). No onSelect.
  useEffect(() => {
    if (isInitialRender.current) return;
    setSelection(selectedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tree), pathSeparator]);

  // Reactive label.
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
  }, [label, setExposedVariable]);

  // Sync CSA-controllable state from properties.
  useEffect(() => {
    if (isVisible !== visibility) setIsVisible(visibility);
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isDisabled !== disabledState) setIsDisabled(disabledState);
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isLoading !== loadingState) setIsLoading(loadingState);
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isOptionsLoading !== optionsLoadingState) setIsOptionsLoading(optionsLoadingState);
    if (isInitialRender.current) return;
    setExposedVariable('isOptionsLoading', optionsLoadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsLoadingState]);

  // Re-validate when validation config changes.
  useEffect(() => {
    if (isInitialRender.current) return;
    const vs = validate?.(selectedValue) ?? { isValid: true, validationError: null };
    setValidationStatus(vs);
    setExposedVariable('isValid', vs?.isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory, setExposedVariable]);

  const selection = useMemo(
    () => computeSelection(isValidLeaf(selectedValue) ? selectedValue : null, maps, pathSeparator),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedValue, maps, pathSeparator]
  );

  return {
    maps,
    selectedValue,
    selection, // { value, selectedValue, pathArray, pathLabels, pathString }
    isVisible,
    isDisabled,
    isLoading,
    isOptionsLoading,
    isValid,
    validationError,
    isMandatory,
    showValidationError,
    setShowValidationError,
    selectLeafFromUI,
    clearFromUI,
  };
}
