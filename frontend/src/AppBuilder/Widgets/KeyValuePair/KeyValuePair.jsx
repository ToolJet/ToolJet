import React, { useCallback, useMemo, useEffect, useState, useRef, useLayoutEffect } from 'react';
import cx from 'classnames';
import { has } from 'lodash';
import { Check, X } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import KeyValueRow from './_components/KeyValueRow';
import './keyValuePair.scss';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useAutoGenerateFields } from './_hooks/useAutoGenerateFields';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { isEditedDataValid } from './_utils/fieldValidity';

// From this width the Cancel/Save bar floats with text labels; below it, it docks as an icon-only footer.
const CTA_TEXT_MIN_WIDTH = 200;

// Hosts the tooltip trigger on a wrapper so a disabled button still shows its tooltip.
const ChangeSetButtonAnchor = ({ label, tooltipId, children }) =>
  tooltipId ? (
    <span className="kv-btn-anchor" data-tooltip-id={tooltipId} data-tooltip-content={label}>
      {children}
    </span>
  ) : (
    children
  );

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
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
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
    disableSaveChanges = false,
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
    paddingInside = 0,
    backgroundColor = 'var(--cc-surface1-surface)',
    borderColor = 'var(--cc-weak-border)',
    borderRadius = 6,
    boxShadow = '0px 0px 0px 0px #00000040',
    hoverBackgroundMode = 'auto',
    hoverBackgroundColor,
  } = styles;

  const containerStyles = {
    padding: paddingInside ? parseFloat(paddingInside) : 0,
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    '--kv-border-radius': `${borderRadius ? parseFloat(borderRadius) : 0}px`,
    boxShadow,
    ...(hoverBackgroundMode === 'manual' && hoverBackgroundColor && { '--kv-hover-bg': hoverBackgroundColor }),
  };

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
    currentLayout,
    width: widgetWidth,
    visibility: isVisible,
    subContainerIndex,
    componentType,
  });

  // Merge original data with edited values
  const currentData = useMemo(() => ({ ...data, ...editedData }), [data, editedData]);

  // Check if there are unsaved changes
  const hasChanges = Object.keys(editedData).length > 0;
  const showCtaText = widgetWidth >= CTA_TEXT_MIN_WIDTH;
  const isChangeSetDocked = !showCtaText;
  const showChangeSet = showUpdateActions && hasChanges;
  const ctaTooltipId = `kv-cta-tooltip-${id}`;
  const handleFieldClick = useCallback(
    (fieldKey, fieldValue) => {
      setExposedVariables({ lastClickedField: { key: fieldKey, value: fieldValue } });
      fireEvent('onFieldClick');
    },
    [fireEvent, setExposedVariables]
  );

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
      saveChanges,
      resetChanges: discardChanges,
      lastClickedField: {},
    });
  }, [data, editedData, setExposedVariables, discardChanges, saveChanges]);

  // Auto-generate fields using custom hook
  const resolvedFields = useAutoGenerateFields({
    data,
    fields,
    fieldDeletionHistory,
    useDynamicField,
    fieldDynamicData,
    id,
  });

  // isValid is true only while every field currently in the changeSet passes its own
  // validation (the same check each field adapter already runs for its own inline
  // error, see fieldValidity.js).
  const isValid = useMemo(() => isEditedDataValid(editedData, resolvedFields), [editedData, resolvedFields]);
  const isSaveChangesDisabled = disableSaveChanges;

  useEffect(() => {
    setExposedVariables({ isValid });
  }, [isValid, setExposedVariables]);

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
      <div className={'key-value-pair-container'} style={containerStyles} data-cy={dataCy}>
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
      style={containerStyles}
      data-cy={dataCy}
      id={`component-${id}`}
    >
      <div
        className={cx('key-value-pair-content', { 'kv-content-docked': showChangeSet && isChangeSetDocked })}
        style={{ overflowY: isDynamicHeightEnabled ? 'hidden' : 'auto' }}
      >
        {resolvedFields.map((field, index) => (
          <KeyValueRow
            componentId={id}
            key={field.id || field.key || index}
            field={field}
            value={currentData[field.key]}
            onChange={(newValue) => handleValueChange(field.key, newValue)}
            onFieldClick={() => handleFieldClick(field.key, currentData[field.key])}
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
      {showChangeSet && (
        <div className={cx('kv-changeset-popover', { 'kv-changeset-docked': isChangeSetDocked })}>
          <div className="kv-changeset-content">
            {!showCtaText && <Tooltip id={ctaTooltipId} className="tooltip" place="top" />}
            <div className="kv-changeset-actions">
              <ChangeSetButtonAnchor label="Cancel" tooltipId={showCtaText ? undefined : ctaTooltipId}>
                <button
                  type="button"
                  className={cx('kv-btn-cancel', { 'kv-btn-icon-only': !showCtaText })}
                  onClick={discardChanges}
                  data-cy="kv-button-cancel"
                  aria-label="Cancel"
                >
                  {showCtaText ? 'Cancel' : <X size={14} />}
                </button>
              </ChangeSetButtonAnchor>
              <ChangeSetButtonAnchor label="Save changes" tooltipId={showCtaText ? undefined : ctaTooltipId}>
                <button
                  type="button"
                  className={cx('kv-btn-save', { 'kv-btn-icon-only': !showCtaText })}
                  onClick={saveChanges}
                  data-cy="kv-button-save-changes"
                  aria-label="Save changes"
                  disabled={isSaveChangesDisabled}
                >
                  {showCtaText ? 'Save changes' : <Check size={14} />}
                </button>
              </ChangeSetButtonAnchor>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyValuePair;
