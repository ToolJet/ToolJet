import React, { useState, useEffect } from 'react';
import useTextColor from '../DataTypes/_hooks/useTextColor';
import useTableStore from '../../_stores/tableStore';
import { getMaxHeight } from '../../_utils/helper';
import { shallow } from 'zustand/shallow';
import { HTMLRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/HTMLRenderer';

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
  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
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
