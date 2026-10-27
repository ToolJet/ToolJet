import React, { useEffect, useState } from 'react';
import useTextColor from '../_hooks/useTextColor';
import { getMaxHeight } from '../../../_utils/helper';
import { MarkdownRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/MarkdownRenderer';
import { useTableCellSettings } from '../../TableData/TableCellSettings';

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
