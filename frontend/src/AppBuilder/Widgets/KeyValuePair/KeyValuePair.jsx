import React, { useCallback, useMemo, useEffect, useState } from 'react';
import KeyValueRow from './_components/KeyValueRow';
import './keyValuePair.scss';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import Loader from '@/ToolJetUI/Loader/Loader';

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
}) => {
  const { data = {}, fields = [], loadingState = false, visibility = true, disabledState = false } = properties;

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

  // Merge original data with edited values
  const currentData = useMemo(() => ({ ...data, ...editedData }), [data, editedData]);

  // Check if there are unsaved changes
  const hasChanges = Object.keys(editedData).length > 0;

  // Handle field value changes
  const handleValueChange = useCallback(
    (fieldKey, newValue) => {
      setEditedData((prev) => ({ ...prev, [fieldKey]: newValue }));

      // Update exposed variables
      const updatedEditedData = { ...editedData, [fieldKey]: newValue };
      const updatedData = { ...data, ...updatedEditedData };
      setExposedVariables({
        data: updatedData,
        changeSet: updatedEditedData,
        changedField: { key: fieldKey, value: newValue },
        unsavedChanges: true,
      });

      fireEvent('onChange');
    },
    [data, editedData, setExposedVariables, fireEvent]
  );

  // Discard changes - reset to original data
  const discardChanges = useCallback(() => {
    setEditedData({});
    setExposedVariables({
      data: data,
      changeSet: {},
      unsavedChanges: false,
    });
    fireEvent('onDiscard');
  }, [data, setExposedVariables, fireEvent]);

  // Save changes
  const saveChanges = useCallback(() => {
    // Data is already set to currentData, just clear the changeSet
    setEditedData({});
    setExposedVariables({
      data: currentData,
      changeSet: {},
      unsavedChanges: false,
    });
    fireEvent('onSave');
  }, [currentData, setExposedVariables, fireEvent]);

  // Expose variables and methods on mount / data change
  useEffect(() => {
    setExposedVariables({
      data: currentData,
      originalData: data,
      changeSet: editedData,
      unsavedChanges: hasChanges,
      discardChanges: discardChanges,
      saveChanges: saveChanges,
    });
  }, [currentData, data, editedData, hasChanges, discardChanges, saveChanges, setExposedVariables]);

  // Filter visible fields and generate from data if not provided
  const resolvedFields = useMemo(() => {
    let fieldList = fields;

    if (!fieldList || fieldList.length === 0) {
      // Auto-generate fields from data keys
      fieldList = Object.keys(data).map((key) => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        fieldType: 'string',
        isEditable: false,
      }));
    }

    // Filter out hidden fields
    return fieldList.filter((field) => field.fieldVisibility !== false);
  }, [fields, data]);

  // Calculate label width based on settings
  const computedLabelWidth = useMemo(() => {
    if (alignment === 'top') return '100%';
    if (autoLabelWidth) return 'auto';
    return `${labelWidth}%`;
  }, [alignment, autoLabelWidth, labelWidth]);

  const containerClassName = useMemo(() => {
    let classes = ['key-value-pair-container'];
    if (padding === 'default') classes.push('kv-padding-default');
    if (padding === 'none') classes.push('kv-padding-none');
    if (!isVisible) classes.push('invisible');
    if (darkMode) classes.push('dark-mode');
    return classes.join(' ');
  }, [padding, isVisible, darkMode]);

  if (isLoading) {
    return (
      <div className={containerClassName} data-cy={dataCy}>
        <div className="key-value-pair-loading">
          <Loader width="24" />
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName} data-cy={dataCy} id={`component-${id}`}>
      <div className="key-value-pair-content">
        {resolvedFields.map((field, index) => (
          <KeyValueRow
            key={field.key || field.id || index}
            field={field}
            value={currentData[field.key]}
            onChange={(newValue) => handleValueChange(field.key, newValue)}
            labelColor={labelColor}
            textColor={textColor}
            accentColor={accentColor}
            labelWidth={computedLabelWidth}
            alignment={alignment}
            direction={direction}
            darkMode={darkMode}
            isDisabled={isDisabled}
          />
        ))}
      </div>

      {/* ChangeSet Popover - centered, 10px from bottom */}
      {hasChanges && (
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
