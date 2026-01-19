import React from 'react';
import { NumberRenderer } from '@/AppBuilder/Shared/DataTypes';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import HighLightSearch from '../../HighLightSearch';
import useTextColor from '../_hooks/useTextColor';

/**
 * NumberColumnAdapter - Table adapter for NumberRenderer
 *
 * Wraps the shared NumberRenderer with Table-specific validation and styling.
 */
export const NumberColumn = ({
  id,
  isEditable,
  handleCellValueChange,
  textColor,
  horizontalAlignment,
  cellValue,
  column,
  cell,
  row,
  searchText,
  containerWidth,
  darkMode,
}) => {
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const cellTextColor = useTextColor(id, textColor);

  const allowedDecimalPlaces = getResolvedValue(column?.decimalPlaces) ?? null;

  const validationData = validateWidget({
    validationObject: {
      minValue: { value: column?.minValue },
      maxValue: { value: column?.maxValue },
      regex: { value: column?.regex },
      customRule: { value: column?.customRule },
    },
    widgetValue: cellValue,
    customResolveObjects: { cellValue },
  });
  const { isValid, validationError } = validationData;

  const handleChange = (newValue) => {
    handleCellValueChange(row.index, column.key || column.name, newValue, row.original);
  };

  return (
    <NumberRenderer
      value={cellValue}
      isEditable={isEditable}
      onChange={handleChange}
      textColor={cellTextColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      decimalPlaces={allowedDecimalPlaces}
      isValid={isValid}
      validationError={validationError}
      searchText={searchText}
      SearchHighlightComponent={HighLightSearch}
    />
  );
};

export default NumberColumn;
