import React, { useState, useEffect } from 'react';
import { StringRenderer } from '@/AppBuilder/Shared/DataTypes';
import { useStringValidation } from '@/AppBuilder/Shared/DataTypes/hooks/useValidation';
import HighLightSearch from '../../HighLightSearch';
import { getMaxHeight } from '../../../_utils/helper';
import useTextColor from '../_hooks/useTextColor';
import useValidationStyle from '../_hooks/useValidationStyle';
import { useTableCellSettings } from '../../TableData/TableCellSettings';

/**
 * StringColumnAdapter - Table adapter for StringRenderer
 *
 * Wraps the shared StringRenderer with Table-specific hooks for
 * text color, validation, and search highlighting.
 */
export const StringColumn = ({
  isEditable,
  darkMode,
  handleCellValueChange,
  textColor,
  horizontalAlignment,
  cellValue,
  column,
  containerWidth,
  cell,
  row,
  searchText,
  id,
}) => {
  const { cellHeight, isMaxRowHeightAuto, maxRowHeightValue } = useTableCellSettings(id);
  const [isEditing, setIsEditing] = useState(false);
  const cellTextColor = useTextColor(id, textColor);

  const { isValid, validationError } = useStringValidation(column, cellValue);
  useValidationStyle(id, row, validationError);

  const handleChange = (newValue) => {
    handleCellValueChange(row.index, column.key || column.name, newValue, row.original);
  };

  useEffect(() => {
    if (!isEditable && isEditing) {
      setIsEditing(false);
    }
  }, [isEditable, isEditing]);

  return (
    <StringRenderer
      value={cellValue}
      isEditable={isEditable}
      onChange={handleChange}
      textColor={cellTextColor}
      horizontalAlignment={horizontalAlignment}
      containerWidth={containerWidth}
      darkMode={darkMode}
      maxHeight={getMaxHeight(isMaxRowHeightAuto, maxRowHeightValue, cellHeight)}
      isValid={isValid}
      validationError={validationError}
      searchText={searchText}
      SearchHighlightComponent={HighLightSearch}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      enableTabNavigation
    />
  );
};

export default StringColumn;
