import React from 'react';
import { LinkRenderer } from '@/AppBuilder/Shared/DataTypes';
import useTextColor from '../_hooks/useTextColor';

/**
 * LinkColumnAdapter - Table adapter for LinkRenderer
 *
 * Wraps the shared LinkRenderer with Table-specific hooks for text color.
 * Maintains the same API as the original LinkColumn for backward compatibility.
 */
export const LinkColumn = ({
  cellValue,
  linkTarget,
  underline,
  underlineColor,
  textColor,
  displayText,
  darkMode,
  id,
}) => {
  const cellTextColor = useTextColor(id, textColor);

  return (
    <LinkRenderer
      value={cellValue}
      displayText={displayText}
      linkTarget={linkTarget}
      textColor={cellTextColor}
      underline={underline}
      underlineColor={underlineColor}
      darkMode={darkMode}
    />
  );
};

export default LinkColumn;
