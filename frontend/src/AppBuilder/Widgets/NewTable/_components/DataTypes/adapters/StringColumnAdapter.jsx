import React, { useState, useEffect } from 'react';
import { StringRenderer } from '@/AppBuilder/Shared/DataTypes';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import useTableStore from '../../../_stores/tableStore';
import HighLightSearch from '../../HighLightSearch';
import { getMaxHeight } from '../../../_utils/helper';
import useTextColor from '../_hooks/useTextColor';
import useValidationStyle from '../_hooks/useValidationStyle';
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
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
  const [isEditing, setIsEditing] = useState(false);
  const cellTextColor = useTextColor(id, textColor);

  const validationData = validateWidget({
    validationObject: {
      regex: { value: column.regex },
      minLength: { value: column.minLength },
      maxLength: { value: column.maxLength },
      customRule: { value: column.customRule },
    },
    widgetValue: cellValue,
    customResolveObjects: { cellValue },
  });
  const { isValid, validationError } = validationData;
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
    />
  );
};

export default StringColumn;
