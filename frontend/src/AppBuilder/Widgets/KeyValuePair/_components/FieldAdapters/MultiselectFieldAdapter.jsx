import React from 'react';
import { CustomSelectColumn } from '@/AppBuilder/Widgets/NewTable/_components/DataTypes/CustomSelect';

/**
 * MultiselectFieldAdapter - KeyValuePair adapter for Multiselect
 *
 * Uses CustomSelect from Table for consistent multiselect rendering across the app.
 */
export const MultiselectField = ({
  options = [],
  value = [],
  onChange,
  isEditable = false,
  placeholder = 'Select...',
  darkMode = false,
  textColor,
  containerWidth,
  horizontalAlignment = 'left',
  optionsLoadingState = false,
  defaultOptionsList = [],
  id,
  column = {},
  isMaxRowHeightAuto,
  isEditing,
  setIsEditing,
}) => {
  return (
    <div className="h-100 d-flex align-items-center flex-column justify-content-center">
      <CustomSelectColumn
        options={options}
        value={value}
        search={true}
        onChange={onChange}
        fuzzySearch
        placeholder={placeholder}
        disabled={!isEditable}
        className="select-search table-select-search"
        darkMode={darkMode}
        defaultOptionsList={defaultOptionsList}
        textColor={textColor}
        isMulti={true}
        containerWidth={containerWidth}
        optionsLoadingState={optionsLoadingState}
        horizontalAlignment={horizontalAlignment}
        isEditable={isEditable}
        id={id}
        column={column}
        isMaxRowHeightAuto={isMaxRowHeightAuto}
        isFocused={isEditing}
        setIsFocused={setIsEditing}
        widgetType={'key-value-pair'}
      />
    </div>
  );
};

export default MultiselectField;
