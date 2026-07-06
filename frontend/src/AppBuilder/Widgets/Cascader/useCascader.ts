import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import type {
  CascaderNode,
  CascaderPathMaps,
  CascaderSelection,
  CascaderValidationStatus,
  CascaderValue,
} from './types';
import {
  buildPathMaps,
  computeSelection,
  getCascaderValueKey,
} from './utils';

interface UseCascaderParams {
  tree: CascaderNode[];
  pathSeparator?: string;
  defaultValue?: CascaderValue | null;
  label: string;
  visibility: boolean;
  disabledState: boolean;
  loadingState: boolean;
  optionsLoadingState: boolean;
  setExposedVariable: (key: string, value: unknown) => void;
  setExposedVariables: (variables: unknown) => void;
  fireEvent: (eventName: string) => void;
  validate?: (value: CascaderValue | null) => CascaderValidationStatus;
  validation?: {
    mandatory?: boolean;
  };
}

interface UseCascaderResult {
  maps: CascaderPathMaps;
  selectedValue: CascaderValue | null;
  selection: CascaderSelection;
  isVisible: boolean;
  isDisabled: boolean;
  isLoading: boolean;
  isOptionsLoading: boolean;
  isValid: boolean;
  validationError: string | null;
  isMandatory: boolean;
  showValidationError: boolean;
  setShowValidationError: Dispatch<SetStateAction<boolean>>;
  selectLeafFromUI: (value: CascaderValue) => void;
  clearFromUI: () => void;
}

const useUpdateEffect = (effect: () => void | (() => void), deps: DependencyList) => {
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }

    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

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
}: UseCascaderParams): UseCascaderResult {
  const treeSignature = JSON.stringify(tree);
  // Build path maps from the normalized tree content, not the array identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const maps = useMemo(() => buildPathMaps(tree), [treeSignature]);

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

  const isValidLeaf = useCallback(
    (value: unknown): value is CascaderValue =>
      value !== null && value !== undefined && mapsRef.current.leafSet.has(getCascaderValueKey(value)),
    []
  );

  const [selectedValue, setSelectedValue] = useState<CascaderValue | null>(() => {
    const initialMaps = buildPathMaps(tree);
    return defaultValue !== null && defaultValue !== undefined && initialMaps.leafSet.has(getCascaderValueKey(defaultValue))
      ? defaultValue
      : null;
  });

  const [validationStatus, setValidationStatus] = useState<CascaderValidationStatus>(
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
    (value: CascaderValue | null | undefined) => {
      const safeValue = isValidLeaf(value) ? value : null;
      const sel = computeSelection(safeValue, mapsRef.current, sepRef.current);
      setSelectedValue(sel.value);
      setExposedVariables(sel);
      const vs = validateRef.current?.(sel.value) ?? { isValid: true, validationError: null };
      setValidationStatus(vs);
      setExposedVariable('isValid', vs?.isValid);
      return sel;
    },
    [isValidLeaf, setExposedVariable, setExposedVariables]
  );

  // === UI handlers ===
  const selectLeafFromUI = useCallback(
    (value: CascaderValue) => {
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
      setValue: async function (value: CascaderValue) {
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
      setLoading: async function (value: unknown) {
        setIsLoading(!!value);
        setExposedVariable('isLoading', !!value);
      },
      setOptionsLoading: async function (value: unknown) {
        setIsOptionsLoading(!!value);
        setExposedVariable('isOptionsLoading', !!value);
      },
      setVisibility: async function (value: unknown) {
        setIsVisible(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async function (value: unknown) {
        setIsDisabled(!!value);
        setExposedVariable('isDisabled', !!value);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default value property changed → re-apply (no onSelect). Invalid/parent clears.
  useUpdateEffect(() => {
    setSelection(defaultValue);
  }, [defaultValue]);

  // Option tree or separator changed → refresh selected path, or clear if the
  // selected value is no longer a valid leaf (hidden/removed). No onSelect.
  useUpdateEffect(() => {
    setSelection(selectedValue);
  }, [treeSignature, pathSeparator]);

  // Reactive label.
  useUpdateEffect(() => {
    setExposedVariable('label', label);
  }, [label]);

  // Sync CSA-controllable state from properties.
  useUpdateEffect(() => {
    setIsVisible(visibility);
    setExposedVariable('isVisible', visibility);
  }, [visibility]);

  useUpdateEffect(() => {
    setIsDisabled(disabledState);
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

  useUpdateEffect(() => {
    setIsLoading(loadingState);
    setExposedVariable('isLoading', loadingState);
  }, [loadingState]);

  useUpdateEffect(() => {
    setIsOptionsLoading(optionsLoadingState);
    setExposedVariable('isOptionsLoading', optionsLoadingState);
  }, [optionsLoadingState]);

  // Re-validate when validation config changes.
  useUpdateEffect(() => {
    const vs = validate?.(selectedValue) ?? { isValid: true, validationError: null };
    setValidationStatus(vs);
    setExposedVariable('isValid', vs?.isValid);
  }, [validate]);

  useUpdateEffect(() => {
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  const selection = useMemo(
    () => computeSelection(isValidLeaf(selectedValue) ? selectedValue : null, maps, pathSeparator),
    [isValidLeaf, selectedValue, maps, pathSeparator]
  );

  return {
    maps,
    selectedValue,
    selection, // { value, selectedOption, pathArray, pathLabels, pathString }
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
