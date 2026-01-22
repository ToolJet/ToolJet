import React from 'react';
import { BooleanRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * BooleanFieldAdapter - KeyValuePair adapter for BooleanRenderer
 */
export const BooleanField = ({ value = false, isEditable = false, onChange, field }) => {
  return (
    <BooleanRenderer
      value={value}
      isEditable={isEditable}
      onChange={onChange}
      toggleOnBg={field.toggleOnBg}
      toggleOffBg={field.toggleOffBg}
      horizontalAlignment={'left'}
    />
  );
};

export default BooleanField;
