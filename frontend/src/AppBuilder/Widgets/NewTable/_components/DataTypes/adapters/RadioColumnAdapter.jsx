import React from 'react';
import { RadioRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * RadioColumnAdapter - Table adapter for RadioRenderer
 *
 * Wraps the shared RadioRenderer with Table-specific props.
 * Maintains the same API as the original RadioColumn for backward compatibility.
 */
export const RadioColumn = ({ options = [], value, onChange, readOnly, containerWidth, horizontalAlignment }) => {
  return (
    <RadioRenderer
      options={options}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      containerWidth={containerWidth}
      horizontalAlignment={horizontalAlignment}
      darkMode={localStorage.getItem('darkMode') === 'true'}
    />
  );
};

export default RadioColumn;
