import React from 'react';
import { LinkRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * LinkFieldAdapter - KeyValuePair adapter for LinkRenderer
 */
export const LinkField = ({
  value,
  displayText,
  linkTarget = '_blank',
  textColor,
  underline = 'hover',
  underlineColor,
  darkMode = false,
}) => {
  return (
    <LinkRenderer
      value={value}
      displayText={displayText}
      linkTarget={linkTarget}
      textColor={textColor}
      underline={underline}
      underlineColor={underlineColor}
      darkMode={darkMode}
    />
  );
};

export default LinkField;
