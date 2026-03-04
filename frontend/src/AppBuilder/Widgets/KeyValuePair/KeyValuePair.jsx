import React, { useCallback, useMemo, useEffect, useState, useRef, useLayoutEffect } from 'react';
import cx from 'classnames';
import { has } from 'lodash';
import KeyValueRow from './_components/KeyValueRow';
import './keyValuePair.scss';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useAutoGenerateFields } from './_hooks/useAutoGenerateFields';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';

/**
 * KeyValuePair Widget
 *
 * Displays data in a key-value format with configurable field types.
 * Supports label alignment (top/side) similar to TextInput.
 */
export const KeyValuePair = ({
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  dataCy,
  id,
  width: widgetWidth,
  height,
  adjustComponentPositions,
  currentLayout,
  currentMode,
  subContainerIndex,
}) => {
  const {
    dataSourceSelector,
    fields = [],
    useDynamicField = false,
    fieldDynamicData = [],
    fieldDeletionHistory = [],
    loadingState = false,
    visibility = true,
    disabledState = false,
    dynamicHeight = false,
    showUpdateActions = true,
  } = properties;

  const data = dataSourceSelector === 'rawJson' ? properties?.data : dataSourceSelector;

  const {
    // Label styles
    labelColor = 'var(--text-secondary)',
    alignment = 'side', // 'top' | 'side'
    direction = 'left', // 'left' | 'right'
    autoLabelWidth = true,
    labelWidth = 33,
    // Value styles
    textColor = 'var(--text-primary)',
    accentColor = 'var(--primary)',
    // Container
    padding = 'default',
  } = styles;

  const { isDisabled, isVisible, isLoading } = useExposeState(
    loadingState,
    visibility,
    disabledState,
    setExposedVariables,
    setExposedVariable
  );

  // Local state for editable values (changeSet)
  const [editedData, setEditedData] = useState({});

  // Ref for measuring labels to find max width when autoLabelWidth is enabled
  const containerRef = useRef(null);
  const [maxLabelWidth, setMaxLabelWidth] = useState(0);

  // Dynamic height support
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';
  const heightChangeValue = useHeightObserver(containerRef, isDynamicHeightEnabled);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    adjustComponentPositions,
    currentLayout,
    width: widgetWidth,
    visibility: isVisible,
    subContainerIndex,
  });

  // Merge original data with edited values
  const currentData = useMemo(() => ({ ...data, ...editedData }), [data, editedData]);

  // Check if there are unsaved changes
  const hasChanges = Object.keys(editedData).length > 0;
  // Handle field value changes
  const handleValueChange = useCallback(
    (fieldKey, newValue) => {
      setEditedData((prev) => ({ ...prev, [fieldKey]: newValue }));
      fireEvent('onFieldValueChanged');
    },
    [fireEvent]
  );

  // Discard changes - reset to original data
  const discardChanges = useCallback(() => {
    setEditedData({});
    fireEvent('onCancelKeyValuePairChanges');
  }, [fireEvent]);

  // Save changes
  const saveChanges = useCallback(() => {
    setEditedData({});
    fireEvent('onSaveKeyValuePairChanges');
  }, [fireEvent]);

  // Expose variables and methods on mount / data change
  useEffect(() => {
    setExposedVariables({
      data,
      changeSet: editedData,
      resetChanges: discardChanges,
    });
  }, [data, editedData, setExposedVariables, discardChanges]);

  // Auto-generate fields using custom hook
  const resolvedFields = useAutoGenerateFields({
    data,
    fields,
    fieldDeletionHistory,
    useDynamicField,
    fieldDynamicData,
    id,
  });

  // Calculate max label width when autoLabelWidth is enabled
  useLayoutEffect(() => {
    if (!autoLabelWidth || !containerRef.current || alignment === 'top') {
      setMaxLabelWidth(0);
      return;
    }

    // Measure the inner <p> element which doesn't have minWidth constraint
    // This avoids the double visual shift from resetting maxLabelWidth to 0
    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const labels = containerRef.current.querySelectorAll('.key-value-label');
      let maxWidth = 0;
      labels.forEach((label) => {
        // Get the inner <p> element's scrollWidth (natural text width)
        const textElement = label.querySelector('p');
        const width = textElement ? textElement.scrollWidth : label.scrollWidth;
        if (width > maxWidth) {
          maxWidth = width;
        }
      });

      // Add 1px buffer to account for scrollWidth rounding
      setMaxLabelWidth(maxWidth + 1);
    });

    return () => cancelAnimationFrame(rafId);
  }, [autoLabelWidth, fields, alignment, widgetWidth]);

  if (isLoading) {
    return (
      <div className={'key-value-pair-container'} data-cy={dataCy}>
        <div className="key-value-pair-loading">
          <Loader width="24" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cx('key-value-pair-container', {
        'kv-padding-default': padding === 'default',
        'kv-padding-none': padding === 'none',
        invisible: !isVisible,
        'dark-mode': darkMode,
        [`dynamic-${id}`]: isDynamicHeightEnabled,
      })}
      data-cy={dataCy}
      id={`component-${id}`}
    >
      <div className="key-value-pair-content" style={{ overflowY: isDynamicHeightEnabled ? 'hidden' : 'auto' }}>
        {resolvedFields.map((field, index) => (
          <KeyValueRow
            componentId={id}
            key={field.id || field.key || index}
            field={field}
            value={currentData[field.key]}
            onChange={(newValue) => handleValueChange(field.key, newValue)}
            labelColor={labelColor}
            textColor={textColor}
            accentColor={accentColor}
            labelWidth={labelWidth}
            alignment={alignment}
            direction={direction}
            darkMode={darkMode}
            isDisabled={isDisabled}
            autoLabelWidth={autoLabelWidth}
            maxLabelWidth={maxLabelWidth}
            hasChanges={has(editedData, field.key)}
          />
        ))}
      </div>

      {/* ChangeSet Popover */}
      {showUpdateActions && hasChanges && (
        <div className="kv-changeset-popover">
          <div className="kv-changeset-content">
            <div className="kv-changeset-actions">
              <button type="button" className="kv-btn-cancel" onClick={discardChanges} data-cy="kv-button-cancel">
                Cancel
              </button>
              <button type="button" className="kv-btn-save" onClick={saveChanges} data-cy="kv-button-save-changes">
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyValuePair;
