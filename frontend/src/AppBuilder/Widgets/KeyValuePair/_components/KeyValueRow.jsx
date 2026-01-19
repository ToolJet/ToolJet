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
  MultiselectField,
  JsonField,
  MarkdownField,
  HtmlField,
} from './FieldAdapters';
import { SquarePen } from 'lucide-react';

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
}) => {
  const {
    key: fieldKey,
    name,
    label,
    fieldType = 'string',
    isEditable = false,
    // Field-specific options
    options = [],
    decimalPlaces,
    toggleOnBg,
    toggleOffBg,
    linkTarget,
    underline,
    imageWidth,
    imageHeight,
    objectFit,
    horizontalAlignment = 'left',
    // Date options
    dateFormat,
    showTimeSelect,
    timeFormat,
    // JSON options
    jsonIndentation,
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

  const isTopAlignment = alignment === 'top';
  const isRightDirection = direction === 'right';

  const handleEditClick = () => {
    if (canEdit) {
      setIsEditing(true);
      setTimeout(() => {
        document.getElementById('key-value-string-field')?.focus();
        console.log(valueRef.current?.closest('#key-value-string-field'));
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
    showInput ? 'kv-row-editing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const renderValue = () => {
    // Common props for adapters
    const commonProps = {
      value,
      onChange,
      textColor,
      accentColor,
      darkMode,
      isValid,
      validationError,
      horizontalAlignment,
      // Pass edit state
      isEditable: showInput,
      autoFocus: true, // Auto focus when switching to edit mode
      onBlur: handleBlur, // Exit edit mode on blur
      isEditing: showInput,
      setIsEditing,
    };
    // console.log(showInput, 'showInput');
    // console.log(fieldType, 'fieldType');
    switch (fieldType) {
      case 'string':
        return <StringField {...commonProps} />;

      case 'number':
        return <NumberField {...commonProps} decimalPlaces={decimalPlaces} />;

      case 'text':
        return <TextField {...commonProps} />;

      case 'datepicker':
        return (
          <DatepickerField
            {...commonProps}
            dateFormat={dateFormat}
            showTimeSelect={showTimeSelect}
            timeFormat={timeFormat}
          />
        );

      case 'select':
        return <SelectField {...commonProps} options={options} />;

      case 'newMultiSelect':
        return <MultiselectField {...commonProps} options={options} />;

      case 'boolean':
        return <BooleanField {...commonProps} toggleOnBg={toggleOnBg} toggleOffBg={toggleOffBg} />;

      case 'link':
        // If a link is editable, we render the StringField in edit mode to edit the URL/text
        if (showInput) {
          return <StringField {...commonProps} />;
        }
        return (
          <LinkField
            value={value}
            displayText={field.displayText}
            linkTarget={linkTarget}
            textColor={textColor}
            underline={underline}
            darkMode={darkMode}
          />
        );

      case 'image':
        return (
          <ImageField
            value={value}
            width={imageWidth}
            height={imageHeight}
            objectFit={objectFit}
            horizontalAlignment={horizontalAlignment}
          />
        );

      case 'json':
        return (
          <JsonField
            value={value}
            indentation={jsonIndentation}
            darkMode={darkMode}
            horizontalAlignment={horizontalAlignment}
          />
        );

      case 'markdown':
        return <MarkdownField value={value} darkMode={darkMode} horizontalAlignment={horizontalAlignment} />;

      case 'html':
        return <HtmlField value={value} darkMode={darkMode} horizontalAlignment={horizontalAlignment} />;

      default:
        // Fallback to plain text
        if (showInput) {
          return <StringField {...commonProps} />;
        }
        return <span style={{ color: textColor }}>{String(value ?? '')}</span>;
    }
  };
  console.log(canEdit, isEditing, 'canEdit');
  return (
    <div className={rowClassName}>
      <div
        className="key-value-render-label"
        style={{
          width: labelWidth,
          color: labelColor,
          textAlign: isRightDirection && !isTopAlignment ? 'right' : 'left',
        }}
      >
        {displayLabel}
      </div>
      <div className={`key-value-render-value ${showInput ? 'kv-value-editing' : ''}`} ref={valueRef}>
        {renderValue()}
        {canEdit && !isEditing && (
          <SquarePen width={16} height={16} className="cursor-pointer" onClick={handleEditClick} />
        )}
      </div>
    </div>
  );
};

export default KeyValueRow;
