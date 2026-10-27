import React, { useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import HighLightSearch from '@/AppBuilder/Widgets/NewTable/_components/HighLightSearch';
import { getMaxHeight } from '../../../_utils/helper';
import useTextColor from '../../DataTypes/_hooks/useTextColor';
import { TextRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/TextRenderer';
import { useTableCellSettings } from '../../TableData/TableCellSettings';

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
  const { cellHeight, isMaxRowHeightAuto, maxRowHeightValue } = useTableCellSettings(id);
  const cellTextColor = useTextColor(id, textColor);
  const [isEditing, setIsEditing] = useState(false);
  const validateWidget = useStore((state) => state.validateWidget, shallow);
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
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    />
  );
};
