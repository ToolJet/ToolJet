import React from 'react';
import { MarkdownRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/MarkdownRenderer';

/**
 * MarkdownFieldAdapter - KeyValuePair adapter for Markdown display
 *
 * Uses MarkdownRenderer for consistent Markdown rendering across the app.
 */
export const MarkdownField = ({
  value = '',
  isEditable = false,
  onChange,
  containerWidth,
  darkMode = false,
  isEditing,
  setIsEditing,
  id,
  field,
}) => {
  return (
    <MarkdownRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      textColor={field?.textColor}
      horizontalAlignment={'left'}
      containerWidth={containerWidth}
      darkMode={darkMode}
      // maxHeight={maxHeight}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      id={id}
    />
  );
};

export default MarkdownField;
