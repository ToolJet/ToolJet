import React from 'react';
import { BooleanRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * BooleanColumnAdapter - Table adapter for BooleanRenderer
 *
 * Wraps the shared BooleanRenderer with Table-specific props and behavior.
 * Maintains the same API as the original BooleanColumn for backward compatibility.
 */
export const BooleanColumn = ({
  value = false,
  isEditable,
  onChange,
  toggleOnBg,
  toggleOffBg,
  horizontalAlignment,
}) => {
  return (
    <BooleanRenderer
      value={!!value}
      isEditable={isEditable}
      onChange={onChange}
      toggleOnBg={toggleOnBg}
      toggleOffBg={toggleOffBg}
      horizontalAlignment={horizontalAlignment}
    />
  );
};

export default BooleanColumn;
