import React from 'react';
import { NumberRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/NumberRenderer';

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
  isValid = true,
  validationError,
  searchText,
  SearchHighlightComponent,
  setIsEditing,
  id,
}) => {
  return (
    <NumberRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      textColor={textColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      decimalPlaces={field?.decimalPlaces}
      isValid={isValid}
      validationError={validationError}
      searchText={searchText}
      SearchHighlightComponent={SearchHighlightComponent}
      setIsEditing={setIsEditing}
      id={id}
      className={'kv-number-field-input'}
    />
  );
};

export default NumberField;
