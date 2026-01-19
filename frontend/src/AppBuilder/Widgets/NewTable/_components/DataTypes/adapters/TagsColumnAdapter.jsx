import React from 'react';
import { TagsRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * TagsColumnAdapter - Table adapter for TagsRenderer
 *
 * Wraps the shared TagsRenderer with Table-specific props.
 * Note: The original TagsColumn had a slightly different prop shape.
 * This adapter normalizes the props.
 */
export const TagsColumn = ({ value: initialValue, onChange, readOnly, containerWidth = '', darkMode }) => {
  // Normalize: support both 'tags' and 'value' prop names
  return (
    <TagsRenderer
      value={initialValue}
      onChange={onChange}
      readOnly={readOnly}
      containerWidth={containerWidth}
      darkMode={darkMode ?? localStorage.getItem('darkMode') === 'true'}
    />
  );
};

export default TagsColumn;
