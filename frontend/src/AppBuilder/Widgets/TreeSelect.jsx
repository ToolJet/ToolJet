import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line import/no-unresolved
import CheckboxTree from 'react-checkbox-tree';
// eslint-disable-next-line import/no-unresolved
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import { isExpectedDataType } from '@/_helpers/utils.js';
import SharedCheckbox from '@/AppBuilder/Shared/_components/Checkbox';

const TreeSelect = ({
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  darkMode,
  dataCy,
  id,
}) => {
  const { label, visibility, disabledState, options, advanced } = properties;
  const { checkboxColor: checkedBackground, uncheckedBackground, borderColor, checkmarkColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const [checked, setChecked] = useState(checkedData);
  const [expanded, setExpanded] = useState(expandedData);
  // Recursively filter out items where visibility is false
  const filterVisibleItems = (items) => {
    if (!Array.isArray(items)) return items;
    return items
      .filter((item) => item.visibility !== false)
      .map((item) => (item.children ? { ...item, children: filterVisibleItems(item.children) } : item));
  };

  const data = !advanced ? filterVisibleItems(options) : isExpectedDataType(properties.data, 'array');
  const checkedData = isExpectedDataType(properties.checkedData, 'array');
  const expandedData = isExpectedDataType(properties.expandedData, 'array');
  let pathObj = {};

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

  useEffect(() => {
    const checkedArr = [],
      checkedPathArray = [],
      checkedPathString = [];
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
    setChecked(checkedArr);
    checkedArr.forEach((item) => {
      checkedPathArray.push(pathObj[item]);
      checkedPathString.push(pathObj[item].join('-'));
    });

    // Compute leaf-only paths (nodes with no children)
    const leafPathArray = [];
    const leafPathStrings = [];
    checkedArr.forEach((item) => {
      if (leafValues.has(item) && pathObj[item]) {
        leafPathArray.push(pathObj[item]);
        leafPathStrings.push(pathObj[item].join('-'));
      }
    });

    const exposedVariables = {
      checkedPathArray: checkedPathArray,
      checkedPathStrings: checkedPathString,
      checked: checkedArr,
      leafPathArray,
      leafPathStrings,
    };
    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(checkedData), JSON.stringify(data)]);

  useEffect(() => {
    setExposedVariable('expanded', expandedData);
    setExpanded(expandedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(expandedData)]);

  pathObj = useMemo(() => {
    let nodePath = {};
    function checkedPath(nodes, arr = []) {
      for (const node of nodes) {
        nodePath[node.value] = [...arr, node.value];
        if (node?.children?.length > 0) {
          checkedPath(node.children, [...arr, node.value]);
        }
      }
    }
    checkedPath(data, []);
    return nodePath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  const onCheck = (checked, updatedNode) => {
    const checkedPathArray = [],
      checkedPathString = [];
    checked.forEach((item) => {
      checkedPathArray.push(pathObj[item]);
      checkedPathString.push(pathObj[item].join('-'));
    });

    // Compute leaf-only paths
    const leafPathArray = [];
    const leafPathStrings = [];
    checked.forEach((item) => {
      if (leafValues.has(item) && pathObj[item]) {
        leafPathArray.push(pathObj[item]);
        leafPathStrings.push(pathObj[item].join('-'));
      }
    });

    const exposedVariables = {
      checkedPathArray: checkedPathArray,
      checkedPathStrings: checkedPathString,
      checked: checked,
      leafPathArray,
      leafPathStrings,
    };
    setExposedVariables(exposedVariables);

    updatedNode.checked ? fireEvent('onCheck') : fireEvent('onUnCheck');
    fireEvent('onChange');
    setChecked(checked);
  };

  const onExpand = (expanded) => {
    setExposedVariable('expanded', expanded);
    setExpanded(expanded);
  };

  return (
    <div
      className="custom-checkbox-tree"
      data-disabled={disabledState}
      style={{
        maxHeight: height,
        display: visibility ? '' : 'none',
        color: textColor,
        boxShadow,
      }}
      data-cy={dataCy}
      aria-hidden={!visibility}
      aria-disabled={disabledState}
    >
      <div className="" style={{ marginBottom: '0.25rem', color: textColor, fontWeight: '500' }}>
        <label htmlFor={`component-${id}`}>{label}</label>
      </div>
      <CheckboxTree
        key={`${checkedBackground}-${uncheckedBackground}-${borderColor}-${checkmarkColor}`}
        nodes={data}
        checked={checked}
        expanded={expanded}
        showNodeIcon={false}
        onCheck={onCheck}
        onExpand={onExpand}
        checkModel="all"
        disabled={disabledState}
        id={`component-${id}`}
        icons={{
          check: (
            <SharedCheckbox
              checked={true}
              checkboxColor={checkedBackground}
              uncheckedColor={uncheckedBackground}
              borderColor={borderColor}
              handleColor={checkmarkColor}
              size={18}
            />
          ),
          uncheck: (
            <SharedCheckbox checked={false} uncheckedColor={uncheckedBackground} borderColor={borderColor} size={18} />
          ),
          halfCheck: (
            <SharedCheckbox
              checked={true}
              checkboxColor={checkedBackground}
              uncheckedColor={uncheckedBackground}
              borderColor={borderColor}
              handleColor={checkmarkColor}
              size={18}
            />
          ),
        }}
      />
    </div>
  );
};

export default TreeSelect;
