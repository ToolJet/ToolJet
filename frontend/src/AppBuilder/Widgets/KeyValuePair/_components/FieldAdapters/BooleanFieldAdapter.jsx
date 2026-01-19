import React from 'react';
import { BooleanRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * BooleanFieldAdapter - KeyValuePair adapter for BooleanRenderer
 */
export const BooleanField = ({
  value = false,
  isEditable = false,
  onChange,
  toggleOnBg,
  toggleOffBg,
  horizontalAlignment = 'left',
}) => {
  return (
    <BooleanRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      toggleOnBg={toggleOnBg}
      toggleOffBg={toggleOffBg}
      horizontalAlignment={horizontalAlignment}
    />
  );
};

export default BooleanField;
