/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import useTextColor from '../_hooks/useTextColor';
import { getMaxHeight } from '../../../_utils/helper';
import { JSONRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/JSONRenderer';
import { useTableCellSettings } from '../../TableData/TableCellSettings';

export const JsonColumn = ({
  isEditable,
  jsonIndentation,
  darkMode,
  handleCellValueChange,
  textColor,
  cellValue,
  column,
  horizontalAlignment,
  id,
  cell,
}) => {
  const cellTextColor = useTextColor(id, textColor, 'json');
  const { cellHeight, isMaxRowHeightAuto, maxRowHeightValue } = useTableCellSettings(id);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (newValue) => {
    handleCellValueChange(cell.row.index, column.key || column.name, newValue, cell.row.original);
  };

  useEffect(() => {
    if (!isEditable && isEditing) {
      setIsEditing(false);
    }
  }, [isEditable, isEditing]);

  return (
    <JSONRenderer
      value={cellValue}
      isEditable={isEditable}
      onChange={handleChange}
      textColor={cellTextColor}
      horizontalAlignment={horizontalAlignment}
      darkMode={darkMode}
      jsonIndentation={jsonIndentation}
      maxHeight={getMaxHeight(isMaxRowHeightAuto, maxRowHeightValue, cellHeight)}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    />
  );
};
