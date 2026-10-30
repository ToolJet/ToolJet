import React from 'react';
import { MarkdownRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/MarkdownRenderer';

/**
 * MarkdownFieldAdapter - KeyValuePair adapter for Markdown display
 *
 * Uses MarkdownRenderer for consistent Markdown rendering across the app.
 */
// Keeps the overflow tooltip inside the canvas so its clipping applies and it can't cover the query panel.
const getCanvas = () => document.getElementById('real-canvas');

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
      overlayContainer={getCanvas}
    />
  );
};

export default MarkdownField;
