import React from 'react';
import { HTMLRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/HTMLRenderer';

/**
 * HtmlFieldAdapter - KeyValuePair adapter for HTML display
 *
 * Uses HTMLRenderer for consistent HTML rendering across the app.
 */
export const HtmlField = ({
  value = '',
  isEditable = false,
  onChange,
  containerWidth,
  darkMode = false,
  setIsEditing,
  isEditing,
  id,
  field,
}) => {
  return (
    <HTMLRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      textColor={field?.textColor}
      horizontalAlignment={'left'}
      containerWidth={containerWidth}
      darkMode={darkMode}
      // maxHeight={maxHeight}
      setIsEditing={setIsEditing}
      isEditing={isEditing}
      id={id}
    />
  );
};

export default HtmlField;
