import React, { useState, useRef, useEffect } from 'react';
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
    // Validation
    isValid = true,
    validationError,
  } = field;

  // Local state for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const valueRef = useRef(null);
  const displayLabel = name || label || fieldKey;
  // Field is editable if configured AND not disabled
  const canEdit = isEditable && !isDisabled;
  // Show input if editing is active
  const showInput = canEdit && isEditing;
  const _width = getLabelWidthOfInput('ofComponent', labelWidth);

  const isTopAlignment = alignment === 'top';
  const isRightDirection = direction === 'right';

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
      id: fieldKey,
      value,
      onChange,
      textColor,
      accentColor,
      darkMode,
      isValid,
      validationError,
      // Pass edit state
      isEditable: isEditing,
      autoFocus: true, // Auto focus when switching to edit mode
      onBlur: handleBlur, // Exit edit mode on blur
      isEditing: showInput,
      setIsEditing,
      field,
    };

    console.log(fieldType, 'fieldType', value);

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
  return (
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
        })}
        ref={valueRef}
        style={getWidthTypeOfComponentStyles('ofComponent', labelWidth, autoLabelWidth, alignment)}
        onClick={handleEditClick}
      >
        {renderValue()}
        {isEditable && (!isEditing || fieldType === 'boolean') && <SquarePen width={16} height={16} />}
      </div>
    </div>
  );
};

export default KeyValueRow;
