import React from 'react';
import { ToggleRenderer } from '@/AppBuilder/Shared/DataTypes';
import useTableStore from '../../../_stores/tableStore';

/**
 * ToggleColumnAdapter - Table adapter for ToggleRenderer
 *
 * Wraps the shared ToggleRenderer with Table-specific event handling.
 */
export const ToggleColumn = ({ id, value, readOnly, onChange, activeColor, horizontalAlignment }) => {
  const { getTableColumnEvents } = useTableStore();

  const handleChange = (newValue) => {
    onChange?.(newValue, getTableColumnEvents(id));
  };

  return (
    <ToggleRenderer
      value={value}
      readOnly={readOnly}
      onChange={handleChange}
      activeColor={activeColor}
      horizontalAlignment={horizontalAlignment}
    />
  );
};

export default ToggleColumn;
