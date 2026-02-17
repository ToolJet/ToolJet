import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Hook that manages all exposed variable logic for the TreeSelect widget.
 * Handles: checked, expanded, checkedPathArray, checkedPathStrings,
 *          leafPathArray, leafPathStrings
 */
export function useExposedVariables({
  data,
  checkedData,
  expandedData,
  allowIndependentSelection,
  setExposedVariable,
  setExposedVariables,
}) {
  const [checked, setChecked] = useState(checkedData);
  const [expanded, setExpanded] = useState(expandedData);

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
          if (isSelected || selected.includes(node.value)) {
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
    },
    [computeExposedVars, setExposedVariables]
  );

  // Handler for expand events
  const handleExpand = useCallback(
    (newExpanded) => {
      setExpanded(newExpanded);
      setExposedVariable('expanded', newExpanded);
    },
    [setExposedVariable]
  );

  return { checked, expanded, handleCheck, handleExpand };
}
