import React, { useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import CheckboxTree from 'react-checkbox-tree';
// eslint-disable-next-line import/no-unresolved
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import { isExpectedDataType } from '@/_helpers/utils.js';
import SharedCheckbox from '@/AppBuilder/Shared/_components/Checkbox';
import Label from '@/_ui/Label';
import { useTreeSelect } from './useTreeSelect';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import cx from 'classnames';
import { Triangle } from 'lucide-react';
import {
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import { cn } from '@/lib/utils';
import './treeSelect.scss';

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
  width,
  adjustComponentPositions,
  currentLayout,
  currentMode,
  subContainerIndex,
  validate,
  validation,
}) => {
  const {
    label,
    visibility,
    disabledState,
    loadingState,
    options,
    advanced,
    allowIndependentSelection,
    dynamicHeight = false,
  } = properties;
  const {
    checkboxColor: checkedBackground,
    uncheckedBackground,
    borderColor,
    checkmarkColor,
    boxShadow,
    labelColor,
    alignment,
    direction,
    autoLabelWidth,
    labelWidth,
  } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  const containerRef = useRef(null);
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const _width = getLabelWidthOfInput('ofComponent', labelWidth);
  const isTopAlignment = defaultAlignment === 'top';
  const isRightDirection = direction === 'right';

  const heightChangeValue = useHeightObserver(containerRef, isDynamicHeightEnabled);

  // Helper to determine which nodes have checked descendants
  const getHalfCheckedValues = (nodes, checkedSet) => {
    const halfChecked = new Set();
    const traverse = (nodeList) => {
      let hasCheckedDescendant = false;
      for (const node of nodeList) {
        let childHasChecked = false;
        if (node.children?.length > 0) {
          childHasChecked = traverse(node.children);
        }

        // A node contributes to its parent's half-checked state if:
        // 1. It is explicitly checked itself, OR
        // 2. Any of its descendants are checked (which makes childHasChecked true)
        if (checkedSet.has(node.value) || childHasChecked) {
          hasCheckedDescendant = true;
          // If this node is NOT explicitly checked, but has checked descendants, it's half-checked
          if (!checkedSet.has(node.value) && childHasChecked) {
            halfChecked.add(node.value);
          }
        }
      }
      return hasCheckedDescendant;
    };
    traverse(nodes);
    return halfChecked;
  };

  const checkedData = isExpectedDataType(properties.checkedData, 'array');
  const expandedData = isExpectedDataType(properties.expandedData, 'array');

  const derivedChecked = [];
  const derivedExpanded = [];

  // Recursively filter hidden items and resolve per-node disabled state
  // We do not map the custom labels yet so useTreeSelect creates the correct path/leaf maps
  const filterNodes = (items) => {
    if (!Array.isArray(items)) return items;
    return items
      .filter((item) => getResolvedValue(item.visible) !== false)
      .map((item) => {
        if (!advanced) {
          if (getResolvedValue(item.selected)) {
            derivedChecked.push(item.value);
          }
          if (getResolvedValue(item.expanded)) {
            derivedExpanded.push(item.value);
          }
        }
        return {
          ...item,
          disabled: getResolvedValue(item.disable) === true,
          children: item.children ? filterNodes(item.children) : undefined,
        };
      });
  };

  const rawData = !advanced
    ? filterNodes(options)
    : isExpectedDataType(properties.data, 'array')
    ? filterNodes(properties.data)
    : [];

  const evaluatedCheckedData = !advanced ? derivedChecked : checkedData;
  const evaluatedExpandedData = !advanced ? derivedExpanded : expandedData;

  const {
    checked,
    expanded,
    handleCheck,
    handleExpand,
    isVisible,
    isDisabled,
    isLoading,
    validationError,
    showValidationError,
    isMandatory,
  } = useTreeSelect({
    data: rawData,
    checkedData: evaluatedCheckedData,
    expandedData: evaluatedExpandedData,
    allowIndependentSelection,
    visibility,
    disabledState,
    loadingState,
    setExposedVariable,
    setExposedVariables,
    validate,
    validation,
  });

  const checkedSet = new Set(checked);
  // Compute half-checked state based on current checked items from hook
  const halfCheckedValues = getHalfCheckedValues(rawData, checkedSet);

  const handleCustomCheck = (nodeValue, isCurrentlyChecked) => {
    let newChecked;
    if (allowIndependentSelection) {
      if (isCurrentlyChecked) {
        newChecked = checked.filter((v) => v !== nodeValue);
      } else {
        newChecked = [...checked, nodeValue];
      }
    } else {
      const newCheckedSet = new Set(checked);
      let targetNode = null;
      let targetPath = [];
      const findNode = (nodes, val, path = []) => {
        for (const node of nodes) {
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
      findNode(rawData, nodeValue);

      if (targetNode) {
        if (isCurrentlyChecked) {
          const removeDescendants = (node) => {
            newCheckedSet.delete(node.value);
            if (node.children) node.children.forEach(removeDescendants);
          };
          removeDescendants(targetNode);
          targetPath.forEach((p) => newCheckedSet.delete(p.value));
        } else {
          const addDescendants = (node) => {
            newCheckedSet.add(node.value);
            if (node.children) node.children.forEach(addDescendants);
          };
          addDescendants(targetNode);
          for (let i = targetPath.length - 2; i >= 0; i--) {
            const parent = targetPath[i];
            const allChildrenChecked = parent.children.every((child) => newCheckedSet.has(child.value));
            if (allChildrenChecked) newCheckedSet.add(parent.value);
            else break;
          }
        }
      }
      newChecked = Array.from(newCheckedSet);
    }
    handleCheck(newChecked);
    fireEvent(isCurrentlyChecked ? 'onUnCheck' : 'onCheck');
    fireEvent('onChange');
  };

  // Map over nodes to inject custom label component if independent selection
  // This is required to show intermediate state of parent nodes
  const processNodes = (items) => {
    if (!Array.isArray(items)) return items;
    return items.map((item) => {
      const isHalfChecked = halfCheckedValues.has(item.value);
      const isChecked = checkedSet.has(item.value);

      const processedItem = { ...item };

      processedItem.showCheckbox = false;
      processedItem.label = (
        <div
          className="d-flex align-items-center"
          style={{ width: '100%', cursor: processedItem.disabled ? 'not-allowed' : 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (processedItem.disabled) return;
            handleCustomCheck(item.value, isChecked);
          }}
        >
          <SharedCheckbox
            className="me-2"
            checked={isChecked}
            isHalfCheck={isHalfChecked}
            checkboxColor={checkedBackground}
            uncheckedColor={uncheckedBackground}
            borderColor={borderColor}
            handleColor={checkmarkColor}
            size={18}
          />
          {item.label}
        </div>
      );

      processedItem.children = item.children ? processNodes(item.children) : undefined;
      return processedItem;
    });
  };

  const data = processNodes(rawData);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    adjustComponentPositions,
    currentLayout,
    width,
    visibility: isVisible,
    subContainerIndex,
  });

  const onCheck = (newChecked, updatedNode) => {
    handleCheck(newChecked);
    updatedNode.checked ? fireEvent('onCheck') : fireEvent('onUnCheck');
    fireEvent('onChange');
  };

  const onExpand = (newExpanded) => {
    handleExpand(newExpanded);
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="custom-checkbox-tree"
        style={{
          height: '100%',
          display: isVisible ? '' : 'none',
          boxShadow,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        data-cy={dataCy}
      >
        <div className="d-flex align-items-center justify-content-center h-100">
          <div className="spinner-border spinner-border-sm" role="status"></div>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={containerRef}
      className={cx('custom-checkbox-tree', {
        [`dynamic-${id}`]: isDynamicHeightEnabled,
      })}
      data-disabled={isDisabled}
      style={{
        height: isDynamicHeightEnabled ? 'auto' : '100%',
        display: isVisible ? '' : 'none',
        color: textColor,
        boxShadow,
      }}
      data-cy={dataCy}
      aria-hidden={!isVisible}
      aria-disabled={isDisabled}
    >
      <div
        className={cx('d-flex', {
          'flex-column': isTopAlignment && label?.length > 0,
          'flex-row-reverse': isRightDirection && !isTopAlignment,
        })}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <Label
          label={label}
          width={labelWidth}
          auto={autoLabelWidth}
          _width={_width}
          color={labelColor}
          direction={direction}
          defaultAlignment={defaultAlignment}
          darkMode={darkMode}
          isMandatory={isMandatory}
          inputId={`component-${id}`}
        />
        <div
          style={{
            ...getWidthTypeOfComponentStyles('ofComponent', labelWidth, autoLabelWidth, alignment),
          }}
        >
          <CheckboxTree
            key={`${checkedBackground}-${uncheckedBackground}-${borderColor}-${checkmarkColor}`}
            nodes={data}
            checked={checked}
            expanded={expanded}
            showNodeIcon={false}
            onCheck={onCheck}
            onExpand={onExpand}
            checkModel="all"
            noCascade={true}
            disabled={isDisabled}
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
                <SharedCheckbox
                  checked={false}
                  uncheckedColor={uncheckedBackground}
                  borderColor={borderColor}
                  size={18}
                />
              ),
              halfCheck: (
                <SharedCheckbox
                  checked={false}
                  isHalfCheck={true}
                  checkboxColor={checkedBackground}
                  uncheckedColor={uncheckedBackground}
                  borderColor={borderColor}
                  handleColor={checkmarkColor}
                  size={18}
                />
              ),
              expandOpen: (
                <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                  <Triangle width={10} height={10} fill={'var(--icon-strong)'} />
                </span>
              ),
              expandClose: (
                <span style={{ display: 'inline-flex', transform: 'rotate(90deg)' }}>
                  <Triangle width={10} height={10} fill={'var(--icon-strong)'} />
                </span>
              ),
            }}
          />
          {showValidationError && visibility && (
            <div
              style={{
                color: 'var(--status-error-strong)',
                fontSize: '11px',
                fontWeight: '400',
                lineHeight: '16px',
              }}
            >
              {validationError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeSelect;
