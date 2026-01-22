import React, { useCallback, useMemo, useEffect, useState } from 'react';
import cx from 'classnames';
import { has } from 'lodash';
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
  const handleValueChange = useCallback((fieldKey, newValue) => {
    setEditedData((prev) => ({ ...prev, [fieldKey]: newValue }));
  }, []);

  // Discard changes - reset to original data
  const discardChanges = useCallback(() => {
    setEditedData({});
  }, []);

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
    });
  }, [data, editedData, setExposedVariables]);

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
      className={cx('key-value-pair-container', {
        'kv-padding-default': padding === 'default',
        'kv-padding-none': padding === 'none',
        invisible: !isVisible,
        'dark-mode': darkMode,
      })}
      data-cy={dataCy}
      id={`component-${id}`}
    >
      <div className="key-value-pair-content">
        {resolvedFields.map((field, index) => (
          <KeyValueRow
            componentId={id}
            key={field.key || field.id || index}
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
            hasChanges={has(editedData, field.key)}
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
