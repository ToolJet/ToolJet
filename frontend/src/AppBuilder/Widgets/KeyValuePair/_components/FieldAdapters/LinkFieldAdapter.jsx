import React from 'react';
import { LinkRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * LinkFieldAdapter - KeyValuePair adapter for LinkRenderer
 */
export const LinkField = ({ value, darkMode = false, field }) => {
  return (
    <LinkRenderer
      value={value}
      displayText={field?.displayText}
      linkTarget={field?.linkTarget}
      textColor={'var(--primary-brand)'}
      underline={'hover'}
      underlineColor={field?.underlineColor}
      darkMode={darkMode}
    />
  );
};

export default LinkField;
