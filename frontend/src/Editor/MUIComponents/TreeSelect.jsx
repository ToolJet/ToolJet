import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isExpectedDataType } from '@/_helpers/utils.js';
import { TreeItem, TreeView } from '@mui/lab';
import { Checkbox, FormControlLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const TreeSelect = ({ height, properties, styles, setExposedVariable, fireEvent, darkMode, dataCy }) => {
  const { label } = properties;
  const { visibility, disabledState, checkboxColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const [checked, setChecked] = useState(checkedData);
  const [expanded, setExpanded] = useState(expandedData);
  const data = isExpectedDataType(properties.data, 'array');
  const checkedData = isExpectedDataType(properties.checkedData, 'array');
  const expandedData = isExpectedDataType(properties.expandedData, 'array');
  let pathObj = {};

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
    setExposedVariable('checked', checkedArr);
    checkedArr.forEach((item) => {
      checkedPathArray.push(pathObj[item]);
      checkedPathString.push(pathObj[item].join('-'));
    });
    setExposedVariable('checkedPathArray', checkedPathArray);
    setExposedVariable('checkedPathStrings', checkedPathString);
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
    setExposedVariable('checkedPathArray', checkedPathArray);
    setExposedVariable('checkedPathStrings', checkedPathString);
    setExposedVariable('checked', checked).then(() => {
      updatedNode.checked ? fireEvent('onCheck') : fireEvent('onUnCheck');
      fireEvent('onChange');
    });
    setChecked(checked);
  };

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const TreeMenu = useCallback(
    (menu, parentValue = null) => {
      return menu.map((m) => {
        const value = m.value.toString();
        const isChecked = checked.includes(value);

        if (m.children?.length) {
          const allChildrenChecked = areAllChildrenChecked(m.children);
          const indeterminate = someChildrenChecked(m.children) && !allChildrenChecked;

          return (
            <TreeItem
              key={value}
              nodeId={value}
              label={
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isChecked && allChildrenChecked}
                        indeterminate={indeterminate}
                        onChange={(event) => handleParentCheckChange(event, value, m.children)}
                        sx={{
                          color: checkboxColor,
                          '&.Mui-checked': {
                            color: checkboxColor,
                          },
                        }}
                      />
                    }
                  />
                  {value}
                </>
              }
            >
              {TreeMenu(m.children, value)}
            </TreeItem>
          );
        } else {
          return (
            <TreeItem
              key={value}
              nodeId={value}
              label={
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={(event) => handleCheckChange(event, value, parentValue)}
                        sx={{
                          color: checkboxColor,
                          '&.Mui-checked': {
                            color: checkboxColor,
                          },
                        }}
                      />
                    }
                  />
                  {value}
                </>
              }
            />
          );
        }
      });
    },
    [checked, data, checkboxColor]
  );

  const areAllChildrenChecked = (children) => {
    return children.every((child) => checked.includes(child.value.toString()));
  };

  const someChildrenChecked = (children) => {
    return children.some((child) => checked.includes(child.value.toString()));
  };

  const handleParentCheckChange = (event, parentValue, children) => {
    const isChecked = event.target.checked;

    let updatedChecked = checked.filter((value) => value !== parentValue);

    if (isChecked) {
      updatedChecked = Array.from(new Set([...updatedChecked, parentValue, ...getDescendantValues(children)]));
    } else {
      const descendantValues = getDescendantValues(children);
      updatedChecked = updatedChecked.filter((value) => !descendantValues.includes(value));
    }

    setChecked(updatedChecked);
  };

  const getDescendantValues = (children) => {
    let descendantValues = [];

    children.forEach((child) => {
      descendantValues.push(child.value.toString());
      if (child.children) {
        descendantValues = [...descendantValues, ...getDescendantValues(child.children)];
      }
    });

    return descendantValues;
  };

  const handleCheckChange = (event, value, parentValue) => {
    const isChecked = event.target.checked;
    const updatedChecked = isChecked
      ? Array.from(new Set([...checked, value]))
      : checked.filter((val) => val !== value);

    if (parentValue) {
      const parentIndex = updatedChecked.indexOf(parentValue);
      if (isChecked && parentIndex === -1) {
        updatedChecked.push(parentValue);
      } else if (!isChecked && parentIndex !== -1 && !updatedChecked.some((val) => val !== parentValue)) {
        updatedChecked.splice(parentIndex, 1);
      }
    }

    setChecked(updatedChecked);
  };

  return (
    <>
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
      >
        <div
          className="card-title"
          style={{ marginBottom: '0.5rem' }}
        >
          {label}
        </div>
        {data && expanded && checked && (
          <TreeView
            aria-label="controlled"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            expanded={expanded}
            onNodeToggle={handleToggle}
            multiSelect
          >
            {TreeMenu(data)}
          </TreeView>
        )}
      </div>
    </>
  );
};
