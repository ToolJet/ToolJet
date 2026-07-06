import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/wave4';

/**
 * Hook that manages all exposed variable logic for the TreeSelect widget.
 * Handles: checked, expanded, checkedPathArray, checkedPathStrings,
 *          leafPathArray, leafPathStrings, and CSAs (setLoading, setVisibility,
 *          setDisable, selectOptions, deselectOptions).
 *
 * Controlled: `checked` is the source of truth for isVisible/isDisabled/
 * isLoading/checked itself (store); the derived path/leaf arrays depend on
 * `data` (a resolved prop, not exposed) so they're recomputed and published
 * by a widget-side effect whenever `checked` or `data` change — this
 * replaces the four separate computeExposedVars() call sites the old
 * per-instance-closure version had.
 */
export function useTreeSelect({
  id,
  componentType,
  moduleId,
  resolveIndex,
  data,
  checkedData,
  expandedData,
  allowIndependentSelection,
  visibility,
  disabledState,
  loadingState,
  setExposedVariable,
  setExposedVariables,
  validate,
  validation,
}) {
  const isInitialRender = useRef(true);
  const exposedOpts = { resolveIndex, moduleId };
  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
  });

  // Cascading-select derivation (property-sync, not a CSA) — the OLD logic
  // for computing the initial/resynced checked array from checkedData/data.
  const deriveCheckedArr = (currentData, currentCheckedData) => {
    if (allowIndependentSelection) {
      // Independent mode: use checkedData as-is, no cascading
      return currentCheckedData;
    }
    // Cascading mode: if a parent is checked, all children are also checked
    const checkedArr = [];
    const updateCheckedArr = (array = [], selected, isSelected = false) => {
      array.forEach((node) => {
        if (isSelected || selected.includes(node.value)) {
          checkedArr.push(node.value);
          updateCheckedArr(node.children, selected, true);
        } else {
          updateCheckedArr(node.children, selected);
        }
      });
    };
    updateCheckedArr(currentData, currentCheckedData);
    return checkedArr;
  };

  const checked = useExposedVariable(id, 'checked', exposedOpts, undefined) ?? deriveCheckedArr(data, checkedData);
  const expanded = useExposedVariable(id, 'expanded', exposedOpts, expandedData);

  // === Validation State ===
  const validationStatus = useMemo(
    () => validate?.(checked) ?? { isValid: true, validationError: null },
    [checked, validate]
  );
  const [showValidationError, setShowValidationError] = useState(false);
  useShowValidationOnFormSubmit(setShowValidationError);
  const { isValid, validationError } = validationStatus;
  const isMandatory = validation?.mandatory ?? false;

  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);

  // Build a map of value -> full path from root
  const pathObj = useMemo(() => {
    const nodePath = {};
    const buildPaths = (nodes, parentPath = []) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        const currentPath = [...parentPath, node.value];
        nodePath[node.value] = currentPath;
        if (node.children?.length > 0) {
          buildPaths(node.children, currentPath);
        }
      }
    };
    buildPaths(data);
    return nodePath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  // Collect leaf node values (nodes with no children)
  const leafValues = useMemo(() => {
    const leaves = new Set();
    const collectLeaves = (nodes) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach((node) => {
        if (!node.children || node.children.length === 0) {
          leaves.add(node.value);
        } else {
          collectLeaves(node.children);
        }
      });
    };
    collectLeaves(data);
    return leaves;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  // Compute all exposed variables from a list of checked values
  const computeExposedVars = useCallback(
    (checkedArr) => {
      const checkedPathArray = [];
      const checkedPathStrings = [];
      const leafPathArray = [];
      const leafPathStrings = [];

      checkedArr.forEach((item) => {
        if (pathObj[item]) {
          checkedPathArray.push(pathObj[item]);
          checkedPathStrings.push(pathObj[item].join('-'));

          if (leafValues.has(item)) {
            leafPathArray.push(pathObj[item]);
            leafPathStrings.push(pathObj[item].join('-'));
          }
        }
      });

      return {
        checkedPathArray,
        checkedPathStrings,
        leafPathArray,
        leafPathStrings,
      };
    },
    [pathObj, leafValues]
  );

  // Latest-ref: the exposed selectOptions/deselectOptions CSAs don't need
  // this (reducers read `checked` from current exposed state), but this
  // effect below always runs off the latest `checked`/pathObj/leafValues by
  // construction (React re-runs it on every relevant change) — no
  // staleness risk.

  // Publish derived path/leaf arrays + isValid whenever checked (or the
  // data-derived path maps) change — regardless of whether checked changed
  // via CSA dispatch, direct user interaction, or a checkedData prop resync.
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables(computeExposedVars(checked || []));
    if (validate) setExposedVariable('isValid', validationStatus?.isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, pathObj, leafValues]);

  // Re-validate when the validate function itself changes (e.g. validation
  // config updated) independent of `checked` — matches old's separate
  // [validate]-keyed effect.
  useEffect(() => {
    if (isInitialRender.current) return;
    if (validate) setExposedVariable('isValid', validationStatus?.isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  // Not isInitialRender-gated — matches old (unconditional checked resync on
  // checkedData/data/allowIndependentSelection change, idempotent on mount
  // since deriveCheckedArr is also the pre-publish fallback above).
  useEffect(() => {
    const checkedArr = deriveCheckedArr(data, checkedData);
    setExposedVariables({ checked: checkedArr, ...computeExposedVars(checkedArr) });
    if (validate) setExposedVariable('isValid', validate(checkedArr)?.isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(checkedData), JSON.stringify(data), allowIndependentSelection]);

  // Not isInitialRender-gated — matches old (unconditional expanded resync).
  useEffect(() => {
    setExposedVariable('expanded', expandedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(expandedData)]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers.
  useEffect(() => {
    setExposedVariables({
      isLoading: false,
      isVisible: visibility,
      isDisabled: disabledState,
      isValid: validationStatus.isValid,
      isMandatory,
      ...csaShims(),
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for check events — direct write (user interaction fires its own
  // event from the widget, matching old handleCheck which never fired one).
  const handleCheck = useCallback(
    (newChecked) => {
      setExposedVariables({ checked: newChecked });
      setShowValidationError(true);
    },
    [setExposedVariables]
  );

  // Handler for expand events
  const handleExpand = useCallback(
    (newExpanded) => {
      setExposedVariable('expanded', newExpanded);
    },
    [setExposedVariable]
  );

  return {
    checked: checked || [],
    expanded,
    handleCheck,
    handleExpand,
    isVisible,
    isDisabled,
    isLoading,
    validationError,
    showValidationError,
    isValid,
    isMandatory,
  };
}
