import React, { useState, useEffect } from 'react';
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';

export const TreeSelect = ({ height, properties, styles, setExposedVariable, fireEvent }) => {
  const { label, data, checkedData, expandedData } = properties;
  const { visibility, disabledState, textColor, checkboxColor } = styles;

  const [checked, setChecked] = useState(checkedData);
  const [expanded, setExpanded] = useState(expandedData);

  useEffect(() => {
    setExposedVariable('checked', checkedData);
    setChecked(checkedData);
    const arr = [];
    const updateCheckedArr = (array = [], selected, isSelected = false) => {
      array.forEach((node) => {
        if (isSelected || selected.includes(node.value)) {
          arr.push(node.value);
          updateCheckedArr(node.children, selected, true);
        } else {
          updateCheckedArr(node.children, selected);
        }
      });
    };
    updateCheckedArr(data, checkedData);
    setChecked(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(checkedData), JSON.stringify(data)]);

  useEffect(() => {
    setExposedVariable('expanded', expandedData);
    setExpanded(expandedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(expandedData)]);

  const onCheck = (checked) => {
    setExposedVariable('checked', checked).then(() => fireEvent('onChange'));
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
      style={{ maxHeight: height, display: visibility ? '' : 'none', color: textColor, accentColor: checkboxColor }}
    >
      <div className="card-title" style={{ marginBottom: '0.5rem' }}>
        {label}
      </div>
      <CheckboxTree
        nodes={data}
        checked={checked}
        expanded={expanded}
        showNodeIcon={false}
        onCheck={onCheck}
        onExpand={onExpand}
        nativeCheckboxes
        checkModel="all"
        disabled={disabledState}
      />
    </div>
  );
};
