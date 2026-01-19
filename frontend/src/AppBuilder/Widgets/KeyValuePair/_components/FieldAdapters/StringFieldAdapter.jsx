import React from 'react';
import { StringRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/StringRenderer';

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
  isValid = true,
  validationError,
  searchText,
  SearchHighlightComponent,
  isEditing,
  setIsEditing,
}) => {
  return (
    <StringRenderer
      value={value}
      isEditable={isEditable}
      isEditing={isEditing}
      onChange={onChange}
      textColor={textColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      maxHeight={maxHeight}
      isValid={isValid}
      validationError={validationError}
      searchText={searchText}
      SearchHighlightComponent={SearchHighlightComponent}
      id={'key-value-string-field'}
      setIsEditing={setIsEditing}
    />
  );
};

export default StringField;
