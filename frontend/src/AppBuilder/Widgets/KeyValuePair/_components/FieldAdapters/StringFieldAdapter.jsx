import React from 'react';
import { StringRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/StringRenderer';
import { useStringValidation } from '@/AppBuilder/Shared/DataTypes/hooks/useValidation';

/**
 * StringFieldAdapter - KeyValuePair adapter for string input
 *
 * Uses StringRenderer for consistent string rendering across the app.
 */
export const StringField = ({
  value = '',
  isEditable = false,
  onChange,
  textColor,
  horizontalAlignment = 'left',
  containerWidth,
  darkMode = false,
  maxHeight,
  isEditing,
  setIsEditing,
  id,
  field,
  onValidationChange,
}) => {
  // Committed-value fallback; StringRenderer itself reports the effective (draft-while-editing,
  // committed otherwise) validation state back via onValidationChange.
  const { isValid, validationError } = useStringValidation(field, value);

  return (
    <StringRenderer
      value={value}
      isEditable={isEditable}
      isEditing={isEditing}
      onChange={onChange}
      textColor={field?.textColor ?? textColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      maxHeight={maxHeight}
      isValid={isValid}
      validationError={validationError}
      id={id}
      setIsEditing={setIsEditing}
      widgetType="KeyValuePair"
      validationConfig={field}
      onValidationChange={onValidationChange}
    />
  );
};

export default StringField;
