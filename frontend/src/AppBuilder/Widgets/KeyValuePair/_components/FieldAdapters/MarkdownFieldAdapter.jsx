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
  textColor,
  horizontalAlignment = 'left',
  containerWidth,
  darkMode = false,
  maxHeight,
  isEditing,
  setIsEditing,
  id,
}) => {
  return (
    <MarkdownRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      textColor={textColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      maxHeight={maxHeight}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      id={id}
    />
  );
};

export default MarkdownField;
