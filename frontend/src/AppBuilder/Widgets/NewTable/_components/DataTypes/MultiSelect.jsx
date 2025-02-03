import React from 'react';
import { CustomSelect } from './CustomSelect';

export const MultiSelectColumn = ({
  options,
  value,
  onChange,
  isEditable,
  darkMode,
  defaultOptionsList,
  textColor,
  containerWidth,
  optionsLoadingState,
  horizontalAlignment,
  isMaxRowHeightAuto,
}) => {
  return (
    <div className="h-100 d-flex align-items-center flex-column justify-content-center">
      <CustomSelect
        options={options}
        value={value}
        search={true}
        onChange={onChange}
        fuzzySearch
        placeholder="Select..."
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
        isMaxRowHeightAuto={isMaxRowHeightAuto}
      />
    </div>
  );
};
