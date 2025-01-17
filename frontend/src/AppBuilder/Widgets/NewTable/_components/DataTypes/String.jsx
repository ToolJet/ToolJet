import React from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';

export const StringColumn = ({
  isEditable,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  horizontalAlignment,
  cellValue,
  column,
  currentState,
  containerWidth,
  cell,
  row,
  isMaxRowHeightAuto,
  cellSize,
  maxRowHeightValue,
}) => {
  return (
    <div
      className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
        horizontalAlignment
      )}`}
      style={{ color: cellTextColor }}
    >
      {isEditable ? (
        <input
          type="text"
          className="form-control"
          value={cellValue || ''}
          onChange={(e) => handleCellValueChange(row.index, column.key || column.name, e.target.value, row.original)}
        />
      ) : (
        String(cellValue)
      )}
    </div>
  );
};
