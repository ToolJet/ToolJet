import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useShowValidationOnFormSubmit, useFormClear } from '@/AppBuilder/Widgets/Form/FormSignalContext';

// One cascade for clicks and selectOptions; mutates checkedSet and returns whether the value exists
export const toggleCascade = (nodes, checkedSet, value, isCurrentlyChecked) => {
  let targetNode = null;
  let targetPath = [];
  const findNode = (list, val, path = []) => {
    for (const node of list) {
      if (node.value === val) {
        targetNode = node;
        targetPath = [...path, node];
        return true;
      }
      if (node.children) {
        if (findNode(node.children, val, [...path, node])) return true;
      }
    }
    return false;
  };
  findNode(nodes, value);

  if (targetNode) {
    if (isCurrentlyChecked) {
      // Disabled descendants keep their state, as in react-checkbox-tree (D-07)
      const removeDescendants = (node) => {
        if (node !== targetNode && node.disabled) return;
        checkedSet.delete(node.value);
        if (node.children) node.children.forEach(removeDescendants);
      };
      removeDescendants(targetNode);
      targetPath.forEach((p) => checkedSet.delete(p.value));
    } else {
      const addDescendants = (node) => {
        if (node !== targetNode && node.disabled) return;
        checkedSet.add(node.value);
        if (node.children) node.children.forEach(addDescendants);
      };
      addDescendants(targetNode);
      for (let i = targetPath.length - 2; i >= 0; i--) {
        const parent = targetPath[i];
        const allChildrenChecked = parent.children.every((child) => child.disabled || checkedSet.has(child.value));
        if (allChildrenChecked) {
          checkedSet.add(parent.value);
        } else {
          // Not all children selected — remove this ancestor and all higher ancestors
          // so pre-existing selections (e.g. from checkedData) don't stay as "fully checked"
          for (let j = i; j >= 0; j--) {
            checkedSet.delete(targetPath[j].value);
          }
          break;
        }
      }
    }
  }
  return targetNode !== null;
};

/**
 * Hook that manages all exposed variable logic for the TreeSelect widget.
 * Handles: checked, expanded, checkedPathArray, checkedPathStrings,
 *          leafPathArray, leafPathStrings, and CSAs (setLoading, setVisibility, setDisable)
 */
export function useTreeSelect({
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
  const [checked, setChecked] = useState(checkedData);
  const [expanded, setExpanded] = useState(expandedData);

  // === Validation State ===
  const [validationStatus, setValidationStatus] = useState(
    validate?.(checkedData) ?? { isValid: true, validationError: null }
  );
  const [showValidationError, setShowValidationError] = useState(false);
  useShowValidationOnFormSubmit(setShowValidationError);
  const { isValid, validationError } = validationStatus;
  const isMandatory = validation?.mandatory ?? false;

  // === CSA Local State ===
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  // Sync CSA state when properties change
  useEffect(() => {
    setIsVisible(visibility);
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setIsDisabled(disabledState);
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setIsLoading(loadingState);
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  // Helper to normalize a single value or array into a flat array of strings
  const normalizeValues = (input) => {
    if (Array.isArray(input)) return input;
    if (input != null) return [input];
    return [];
  };

  // Actions are registered once, so they must read the current tree and callbacks through this ref
  const latest = useRef({});

  // Register CSA functions on mount
  useEffect(() => {
    setExposedVariables({
      isLoading: false,
      isVisible: visibility,
      isDisabled: disabledState,
      isValid: validationStatus.isValid,
      isMandatory,
      setLoading: async function (value) {
        setIsLoading(!!value);
        setExposedVariable('isLoading', !!value);
      },
      setVisibility: async function (value) {
        setIsVisible(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async function (value) {
        setIsDisabled(!!value);
        setExposedVariable('isDisabled', !!value);
      },
      selectOptions: async function (values) {
        const { computeExposedVars, validate, data, allowIndependentSelection } = latest.current;
        let updated = normalizeValues(values);
        if (!allowIndependentSelection) {
          // Replace semantics: cascade each value into an empty selection, keeping unknown values as given
          const cascaded = new Set();
          updated.forEach((value) => {
            if (!toggleCascade(data, cascaded, value, false)) cascaded.add(value);
          });
          updated = Array.from(cascaded);
        }
        setChecked(updated);
        setExposedVariables(computeExposedVars(updated));
        if (validate) {
          const result = validate(updated);
          setValidationStatus(result);
          setExposedVariable('isValid', result.isValid);
        }
      },
      deselectOptions: async function (values) {
        const { computeExposedVars, validate } = latest.current;
        const toRemove = new Set(normalizeValues(values));
        setChecked((prev) => {
          const updated = prev.filter((v) => !toRemove.has(v));
          setExposedVariables(computeExposedVars(updated));
          if (validate) {
            const result = validate(updated);
            setValidationStatus(result);
            setExposedVariable('isValid', result.isValid);
          }
          return updated;
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        checked: checkedArr,
        checkedPathArray,
        checkedPathStrings,
        leafPathArray,
        leafPathStrings,
      };
    },
    [pathObj, leafValues]
  );
  latest.current = { computeExposedVars, validate, data, allowIndependentSelection };

  useFormClear(() => {
    setChecked([]);
    setExposedVariables(computeExposedVars([]));
    if (validate) {
      const result = validate([]);
      setValidationStatus(result);
      setExposedVariable('isValid', result.isValid);
    }
  });

  // Sync checked state when checkedData or data changes
  useEffect(() => {
    let checkedArr;

    if (allowIndependentSelection) {
      // Independent mode: use checkedData as-is, no cascading
      checkedArr = checkedData;
    } else {
      // Cascading mode: if a parent is checked, all children are also checked
      checkedArr = [];
      const updateCheckedArr = (array = [], selected, isSelected = false) => {
        array.forEach((node) => {
          // The cascade skips disabled nodes; an explicit selection still applies (D-07)
          if ((isSelected && !node.disabled) || selected.includes(node.value)) {
            checkedArr.push(node.value);
            updateCheckedArr(node.children, selected, true);
          } else {
            updateCheckedArr(node.children, selected);
          }
        });
      };
      updateCheckedArr(data, checkedData);
    }

    setChecked(checkedArr);
    setExposedVariables(computeExposedVars(checkedArr));

    // Run validation on checked change
    if (validate) {
      const result = validate(checkedArr);
      setValidationStatus(result);
      setExposedVariable('isValid', result.isValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(checkedData), JSON.stringify(data), allowIndependentSelection]);

  // Sync expanded state
  useEffect(() => {
    setExposedVariable('expanded', expandedData);
    setExpanded(expandedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(expandedData)]);

  // Handler for check events
  const handleCheck = useCallback(
    (newChecked) => {
      setChecked(newChecked);
      setExposedVariables(computeExposedVars(newChecked));
      setShowValidationError(true);

      // Run validation on user interaction
      if (validate) {
        const result = validate(newChecked);
        setValidationStatus(result);
        setExposedVariable('isValid', result.isValid);
      }
    },
    [computeExposedVars, setExposedVariables, validate, setExposedVariable]
  );

  // Handler for expand events
  const handleExpand = useCallback(
    (newExpanded) => {
      setExpanded(newExpanded);
      setExposedVariable('expanded', newExpanded);
    },
    [setExposedVariable]
  );

  // Re-validate when the validate function itself changes (e.g. validation config updated)
  useEffect(() => {
    if (validate) {
      const result = validate(checked);
      setValidationStatus(result);
      setExposedVariable('isValid', result.isValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validate]);

  // Expose isMandatory when it changes
  useEffect(() => {
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  return {
    checked,
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
