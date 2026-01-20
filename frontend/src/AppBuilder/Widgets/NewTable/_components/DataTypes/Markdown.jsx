import React, { useEffect, useState } from 'react';
import useTextColor from '../DataTypes/_hooks/useTextColor';
import useTableStore from '../../_stores/tableStore';
import { getMaxHeight } from '../../_utils/helper';
import { shallow } from 'zustand/shallow';
import { MarkdownRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/MarkdownRenderer';

export const MarkdownColumn = ({
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
    <MarkdownRenderer
      value={cellValue}
      isEditable={isEditable}
      onChange={handleChange}
      textColor={cellTextColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      maxHeight={getMaxHeight(isMaxRowHeightAuto, maxRowHeightValue, cellSize)}
    />
  );
};
