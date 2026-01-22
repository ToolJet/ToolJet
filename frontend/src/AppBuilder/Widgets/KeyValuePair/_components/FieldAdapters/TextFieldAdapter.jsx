import React, { useEffect } from 'react';
import { TextRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/TextRenderer';
import { useTextValidation } from '@/AppBuilder/Shared/DataTypes/hooks/useValidation';

/**
 * TextFieldAdapter - KeyValuePair adapter for multiline text
 *
 * Uses TextRenderer for consistent text rendering across the app.
 */
export const TextField = ({
  value = '',
  isEditable = false,
  onChange,
  textColor,
  horizontalAlignment = 'left',
  containerWidth,
  darkMode = false,
  maxHeight,
  setIsEditing,
  isEditing,
  id,
  field,
  onValidationChange,
}) => {
  const { isValid, validationError } = useTextValidation(field, value);

  // Expose validation state to parent
  useEffect(() => {
    onValidationChange?.({ isValid, validationError });
  }, [isValid, validationError, onValidationChange]);

  return (
    <TextRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      textColor={field?.textColor ?? textColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      maxHeight={maxHeight}
      isValid={isValid}
      validationError={validationError}
      setIsEditing={setIsEditing}
      isEditing={isEditing}
      id={id}
      widgetType="KeyValuePair"
    />
  );
};

export default TextField;
