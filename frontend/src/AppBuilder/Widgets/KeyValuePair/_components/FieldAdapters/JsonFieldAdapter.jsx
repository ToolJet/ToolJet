import React from 'react';
import { JSONRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/JSONRenderer';

/**
 * JsonFieldAdapter - KeyValuePair adapter for JSON display
 *
 * Uses JSONRenderer for consistent JSON rendering across the app.
 */
export const JsonField = ({
  value = '',
  isEditable = false,
  onChange,
  darkMode = false,
  field,
  isEditing,
  setIsEditing,
  id,
}) => {
  return (
    <JSONRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      textColor={field?.textColor}
      horizontalAlignment={'left'}
      darkMode={darkMode}
      // jsonIndentation={field?.jsonIndentation}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      id={id}
    />
  );
};

export default JsonField;
