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
  });

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
            noCascade={allowIndependentSelection}
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
                  checked={true}
                  checkboxColor={checkedBackground}
                  uncheckedColor={uncheckedBackground}
                  borderColor={borderColor}
                  handleColor={checkmarkColor}
                  size={18}
                />
              ),
              expandOpen: (
                <span style={{ display: 'inline-flex', transform: 'rotate(90deg)' }}>
                  <Triangle width={10} height={10} fill={'var(--icon-strong)'} />
                </span>
              ),
              expandClose: (
                <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
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
