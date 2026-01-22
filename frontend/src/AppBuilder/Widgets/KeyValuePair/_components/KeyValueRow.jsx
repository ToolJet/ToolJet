import React, { useState, useRef, useCallback } from 'react';
import {
  StringField,
  NumberField,
  TextField,
  BooleanField,
  LinkField,
  ImageField,
  DatepickerField,
  SelectField,
  JsonField,
  MarkdownField,
  HtmlField,
} from './FieldAdapters';
import { SquarePen } from 'lucide-react';
import Label from '@/_ui/Label';
import {
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import { cn } from '@/lib/utils';
import cx from 'classnames';

/**
 * KeyValueRow - Renders a single key-value pair row
 *
 * Displays the field label and value using the appropriate renderer.
 * Supports both 'top' (stacked) and 'side' (horizontal) label alignment.
 * Handles "click to edit" functionality.
 */
const KeyValueRow = ({
  componentId,
  field,
  value,
  onChange,
  labelColor,
  textColor,
  accentColor,
  labelWidth,
  alignment,
  direction,
  darkMode,
  isDisabled,
  autoLabelWidth,
  hasChanges,
}) => {
  const {
    key: fieldKey,
    name,
    label,
    fieldType = 'string',
    isEditable = false,
    // Date options
    dateFormat,
    showTimeSelect,
    timeFormat,
  } = field;

  // Local state for edit mode
  const [isEditing, setIsEditing] = useState(false);
  // Validation state from adapter
  const [validation, setValidation] = useState({ isValid: true, validationError: null });
  const valueRef = useRef(null);
  const displayLabel = name || label || fieldKey;
  // Field is editable if configured AND not disabled
  const canEdit = isEditable && !isDisabled;
  // Show input if editing is active
  const showInput = canEdit && isEditing;
  const _width = getLabelWidthOfInput('ofComponent', labelWidth);

  const isTopAlignment = alignment === 'top';
  const isRightDirection = direction === 'right';

  // Callback for adapters to report validation state
  const handleValidationChange = useCallback((validationState) => {
    setValidation(validationState);
  }, []);

  const handleEditClick = () => {
    if (isEditable) {
      setIsEditing(true);
      setTimeout(() => {
        document.getElementById(fieldKey)?.focus();
      }, 0);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  // Container class based on alignment
  const rowClassName = [
    'key-value-row',
    isTopAlignment ? 'kv-row-top' : 'kv-row-side',
    isRightDirection && !isTopAlignment ? 'kv-row-reverse' : '',
    isEditable ? 'kv-row-editing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const renderValue = () => {
    // Common props for adapters
    const commonProps = {
      id: `${componentId}-${fieldKey}`,
      value,
      onChange,
      textColor,
      accentColor,
      darkMode,
      // Pass edit state
      isEditable,
      autoFocus: true, // Auto focus when switching to edit mode
      onBlur: handleBlur, // Exit edit mode on blur
      isEditing: showInput,
      setIsEditing,
      field,
      // Validation callback
      onValidationChange: handleValidationChange,
    };

    switch (fieldType) {
      case 'string':
        return <StringField {...commonProps} field={field} />;

      case 'number':
        return <NumberField {...commonProps} field={field} />;

      case 'text':
        return <TextField {...commonProps} field={field} />;

      case 'datepicker':
        return (
          <DatepickerField
            {...commonProps}
            dateFormat={dateFormat}
            showTimeSelect={showTimeSelect}
            timeFormat={timeFormat}
            field={field}
          />
        );

      case 'select':
        return <SelectField {...commonProps} />;

      case 'newMultiSelect':
        return <SelectField {...commonProps} isMulti />;

      case 'boolean':
        return <BooleanField {...commonProps} />;

      case 'link':
        return <LinkField {...commonProps} />;

      case 'image':
        return <ImageField {...commonProps} />;

      case 'json':
        return <JsonField {...commonProps} />;

      case 'markdown':
        return <MarkdownField {...commonProps} />;

      case 'html':
        return <HtmlField {...commonProps} />;

      default:
        // Fallback to plain text
        if (showInput) {
          return <StringField {...commonProps} />;
        }
        return <span style={{ color: textColor }}>{String(value ?? '')}</span>;
    }
  };
  // Get error offset based on label width for alignment
  const getErrorOffset = () => {
    if (isTopAlignment) return {};
    if (autoLabelWidth) return {};
    if (isRightDirection) return {};
    return { paddingLeft: `${labelWidth}%` };
  };
  console.log(hasChanges, 'hasChanges');
  return (
    <div className="kv-row-container">
      <div className={rowClassName}>
        <Label
          label={displayLabel}
          width={labelWidth}
          auto={autoLabelWidth}
          _width={_width}
          color={labelColor}
          direction={direction}
          defaultAlignment={alignment}
          inputId={fieldKey}
          classes={{
            labelContainer: cn({
              'tw-self-center': alignment !== 'top',
              'tw-flex-shrink-0': alignment === 'top',
            }),
          }}
        />
        <div
          className={cx(`key-value-render-value kv-${fieldType}`, {
            'kv-value-editing': isEditing,
            'kv-editable': isEditable,
            'kv-field-has-changes': hasChanges,
          })}
          ref={valueRef}
          style={getWidthTypeOfComponentStyles('ofComponent', labelWidth, autoLabelWidth, alignment)}
          onClick={handleEditClick}
        >
          {renderValue()}
          {isEditable && (!isEditing || fieldType === 'boolean') && (
            <SquarePen className="kv-edit-icon" width={16} height={16} />
          )}
        </div>
      </div>
      {!validation.isValid && (
        <div className="kv-row-validation-error" style={getErrorOffset()}>
          <span className="invalid-feedback text-truncate">{validation.validationError}</span>
        </div>
      )}
    </div>
  );
};

export default KeyValueRow;
