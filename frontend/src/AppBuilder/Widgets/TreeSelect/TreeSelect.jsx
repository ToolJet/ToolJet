import React from 'react';
// eslint-disable-next-line import/no-unresolved
import CheckboxTree from 'react-checkbox-tree';
// eslint-disable-next-line import/no-unresolved
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import { isExpectedDataType } from '@/_helpers/utils.js';
import SharedCheckbox from '@/AppBuilder/Shared/_components/Checkbox';
import { useExposedVariables } from './useExposedVariables';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

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
  const { label, visibility, disabledState, options, advanced, allowIndependentSelection } = properties;
  const { checkboxColor: checkedBackground, uncheckedBackground, borderColor, checkmarkColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  // Recursively filter hidden items and resolve per-node disabled state
  const processNodes = (items) => {
    if (!Array.isArray(items)) return items;
    return items
      .filter((item) => getResolvedValue(item.visible?.value) !== false)
      .map((item) => ({
        ...item,
        disabled: getResolvedValue(item.disable?.value) === true,
        children: item.children ? processNodes(item.children) : undefined,
      }));
  };

  const data = !advanced
    ? processNodes(options)
    : isExpectedDataType(properties.data, 'array')
    ? processNodes(properties.data)
    : [];

  const checkedData = isExpectedDataType(properties.checkedData, 'array');
  const expandedData = isExpectedDataType(properties.expandedData, 'array');

  const { checked, expanded, handleCheck, handleExpand } = useExposedVariables({
    data,
    checkedData,
    expandedData,
    allowIndependentSelection,
    setExposedVariable,
    setExposedVariables,
  });

  const onCheck = (newChecked, updatedNode) => {
    handleCheck(newChecked);
    updatedNode.checked ? fireEvent('onCheck') : fireEvent('onUnCheck');
    fireEvent('onChange');
  };

  const onExpand = (newExpanded) => {
    handleExpand(newExpanded);
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
        noCascade={allowIndependentSelection}
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
