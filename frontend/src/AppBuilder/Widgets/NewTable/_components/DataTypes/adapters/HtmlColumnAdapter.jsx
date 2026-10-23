import React, { useState, useEffect } from 'react';
import useTextColor from '../_hooks/useTextColor';
import { getMaxHeight } from '../../../_utils/helper';
import { HTMLRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/HTMLRenderer';
import { useTableCellSettings } from '../../TableData/TableCellSettings';

export const HTMLColumn = ({
  id,
  isEditable,
  darkMode,
  handleCellValueChange,
  textColor,
  cellValue,
  column,
  containerWidth,
  cell,
  horizontalAlignment,
  cellSize,
}) => {
  const cellTextColor = useTextColor(id, textColor);
  const { isMaxRowHeightAuto, maxRowHeightValue } = useTableCellSettings(id);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditable && isEditing) {
      setIsEditing(false);
    }
  }, [isEditable, isEditing]);

  const handleChange = (newValue) => {
    handleCellValueChange(cell.row.index, column.key || column.name, newValue, cell.row.original);
  };

  return (
    <HTMLRenderer
      value={cellValue}
      isEditable={isEditable}
      onChange={handleChange}
      textColor={cellTextColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      maxHeight={getMaxHeight(isMaxRowHeightAuto, maxRowHeightValue, cellSize)}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    />
  );
};
