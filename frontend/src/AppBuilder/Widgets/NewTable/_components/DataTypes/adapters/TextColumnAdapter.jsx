import React from 'react';
import { TextRenderer } from '@/AppBuilder/Shared/DataTypes';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import useTableStore from '../../../_stores/tableStore';
import HighLightSearch from '../../HighLightSearch';
import { getMaxHeight } from '../../../_utils/helper';
import useTextColor from '../_hooks/useTextColor';

/**
 * TextColumnAdapter - Table adapter for TextRenderer
 *
 * Wraps the shared TextRenderer with Table-specific hooks.
 */
export const TextColumn = ({
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
  searchText,
}) => {
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
  const cellTextColor = useTextColor(id, textColor);

  const { isValid, validationError } = validateWidget({
    validationObject: {
      minLength: { value: column.minLength },
      maxLength: { value: column.maxLength },
      customRule: { value: column.customRule },
    },
    widgetValue: cellValue,
    customResolveObjects: { cellValue },
  });

  const handleChange = (newValue) => {
    handleCellValueChange(cell.row.index, column.key || column.name, newValue, cell.row.original);
  };

  return (
    <TextRenderer
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
    />
  );
};

export default TextColumn;
