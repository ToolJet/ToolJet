import React, { useState, useEffect } from 'react';
import { StringRenderer } from '@/AppBuilder/Shared/DataTypes';
import { useStringValidation } from '@/AppBuilder/Shared/DataTypes/hooks/useValidation';
import useTableStore from '../../../_stores/tableStore';
import HighLightSearch from '../../HighLightSearch';
import { getMaxHeight } from '../../../_utils/helper';
import useTextColor from '../_hooks/useTextColor';
import useValidationStyle from '../_hooks/useValidationStyle';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { chipTone } from '../../../_utils/chipTone';
import { avatarHue } from '../../../_utils/avatarHue';
import { initials } from '@/AppBuilder/Widgets/packHooks';

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
  const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
  const [isEditing, setIsEditing] = useState(false);
  const cellTextColor = useTextColor(id, textColor);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const showAsChip = getResolvedValue(column?.displayAsChip) === true;
  const showAvatar = getResolvedValue(column?.displayAvatar) === true;

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

  // "Show as status chip": a state ("Paid", "Overdue", "In progress") drawn as a tinted chip whose tone is read from
  // its words. An editable column keeps the text field.
  if (showAsChip && !isEditable && cellValue !== null && cellValue !== undefined && cellValue !== '') {
    const text = String(cellValue);
    return (
      <div
        className={`d-flex align-items-center h-100 w-100 overflow-hidden justify-content-${determineJustifyContentValue(
          horizontalAlignment
        )}`}
      >
        <span className={`tj-chip tj-chip-${chipTone(text)}`} title={text}>
          <HighLightSearch text={text} searchTerm={searchText} />
        </span>
      </div>
    );
  }

  // "Show avatar": a person's initials in a circle tinted from their name, before the name.
  if (showAvatar && !isEditable && cellValue !== null && cellValue !== undefined && cellValue !== '') {
    const text = String(cellValue);
    return (
      <div
        className={`d-flex align-items-center h-100 w-100 overflow-hidden justify-content-${determineJustifyContentValue(
          horizontalAlignment
        )}`}
        style={{ gap: 8, color: cellTextColor || undefined }}
      >
        <span className="tj-cell-avatar" style={{ '--tj-cell-avatar-hue': avatarHue(text) }} aria-hidden="true">
          {initials(text)}
        </span>
        <span className="text-truncate" title={text}>
          <HighLightSearch text={text} searchTerm={searchText} />
        </span>
      </div>
    );
  }

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
