import React from 'react';
import { CustomSelectColumn } from '@/AppBuilder/Widgets/NewTable/_components/DataTypes/CustomSelect';

/**
 * SelectFieldAdapter - KeyValuePair adapter for Select dropdown
 *
 * Uses CustomSelect from Table for consistent select rendering across the app.
 */
export const SelectField = ({
  options = [],
  value,
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
        isMulti={false}
        containerWidth={containerWidth}
        optionsLoadingState={optionsLoadingState}
        horizontalAlignment={horizontalAlignment}
        isEditable={isEditable}
        id={id}
        column={column}
        widgetType={'key-value-pair'}
        isFocused={isEditing}
        setIsFocused={setIsEditing}
      />
    </div>
  );
};

export default SelectField;
