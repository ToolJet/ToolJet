import React, { useEffect } from 'react';
import { NumberRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/NumberRenderer';
import { useNumberValidation } from '@/AppBuilder/Shared/DataTypes/hooks/useValidation';

/**
 * NumberFieldAdapter - KeyValuePair adapter for number input
 *
 * Uses NumberRenderer for consistent number rendering across the app.
 */
export const NumberField = ({
  value = '',
  isEditable = false,
  onChange,
  textColor,
  horizontalAlignment = 'left',
  containerWidth,
  darkMode = false,
  field,
  setIsEditing,
  id,
  onValidationChange,
}) => {
  const { isValid, validationError } = useNumberValidation(field, value);

  // Expose validation state to parent
  useEffect(() => {
    onValidationChange?.({ isValid, validationError });
  }, [isValid, validationError, onValidationChange]);

  return (
    <NumberRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      textColor={field?.textColor ?? textColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      decimalPlaces={field?.decimalPlaces}
      isValid={isValid}
      validationError={validationError}
      setIsEditing={setIsEditing}
      id={id}
      className={'kv-number-field-input'}
      widgetType="KeyValuePair"
    />
  );
};

export default NumberField;
