/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import useTextColor from '../DataTypes/_hooks/useTextColor';
import { getMaxHeight } from '../../_utils/helper';
import useTableStore from '../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { JSONRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/JSONRenderer';

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
  const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
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
