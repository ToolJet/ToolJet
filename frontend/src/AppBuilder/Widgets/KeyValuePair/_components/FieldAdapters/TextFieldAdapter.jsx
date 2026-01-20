import React from 'react';
import { TextRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/TextRenderer';

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
  isValid = true,
  validationError,
  searchText,
  SearchHighlightComponent,
  setIsEditing,
  isEditing,
  id,
}) => {
  return (
    <TextRenderer
      value={value}
      isEditable={isEditable}
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
      setIsEditing={setIsEditing}
      isEditing={isEditing}
      id={id}
    />
  );
};

export default TextField;
