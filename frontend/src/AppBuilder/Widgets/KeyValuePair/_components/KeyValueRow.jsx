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
import { placeCaretAtEnd } from '@/AppBuilder/Shared/DataTypes/utils';

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
  onFieldClick,
  labelColor,
  textColor,
  accentColor,
  labelWidth,
  alignment,
  direction,
  darkMode,
  isDisabled,
  autoLabelWidth,
  maxLabelWidth,
  hasChanges,
}) => {
  const { key: fieldKey, name, label, fieldType = 'string', isEditable = false } = field;

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
    // Only the click entering edit mode should force the caret to the end; a later click while
    // already editing must reposition it normally, like Table's string column.
    if (isEditable && !isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        const node = document.getElementById(`${componentId}-${fieldKey}`);
        if (!node) return;
        node.focus();
        placeCaretAtEnd(node);
      }, 0);
    }
  };

  // Fired on press, not click: focusing a markdown/html field swaps its rendered markup for raw text before
  // mouseup, detaching the pressed element so the browser never dispatches the click.
  const handleRowMouseDown = (e) => {
    if (e.button === 0) onFieldClick?.();
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  // Container class based on alignment
  const rowClassName = [
    'key-value-row',
    isTopAlignment ? 'kv-row-top' : 'kv-row-side',
    isRightDirection && !isTopAlignment ? 'kv-row-reverse' : '',
    isEditing ? 'kv-row-editing' : '',
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
      containerWidth: valueRef.current?.offsetWidth,
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
        return <StringField {...commonProps} />;

      case 'number':
        return <NumberField {...commonProps} />;

      case 'text':
        return <TextField {...commonProps} />;

      case 'datepicker':
        return <DatepickerField {...commonProps} />;

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
    if (isRightDirection) return {};
    if (autoLabelWidth) return maxLabelWidth > 0 ? { paddingLeft: `${maxLabelWidth}px` } : {};
    return { paddingLeft: `${labelWidth}%` };
  };

  return (
    <div className="kv-row-container" onMouseDown={handleRowMouseDown}>
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
          style={autoLabelWidth && maxLabelWidth > 0 ? { minWidth: `${maxLabelWidth}px` } : {}}
          classes={{
            labelContainer: cn({
              'tw-flex-shrink-0': alignment === 'top',
              'key-value-label': true,
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
          style={{
            ...getWidthTypeOfComponentStyles('ofComponent', labelWidth, autoLabelWidth, alignment),
            ...(isEditing && fieldType !== 'boolean' ? { border: `2px solid ${accentColor}` } : {}),
          }}
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
