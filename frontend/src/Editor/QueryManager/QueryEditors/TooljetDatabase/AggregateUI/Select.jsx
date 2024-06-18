import React from 'react';
import { ToolTip } from '@/_components/ToolTip';
import DropDownSelect from '../DropDownSelect';

export const SelectBox = ({
  options,
  handleChange,
  value = '',
  placeholder = '',
  isMulti = false,
  disabled = false,
  darkMode,
  showTooltip = false,
}) => {
  // const validOptionStructure = options.map(({ description = '', ...rest }) => {
  //   return rest;
  // });
  return (
    <ToolTip
      message="Group by can only be used with aggregate function"
      tooltipClassName="tjdb-table-tooltip"
      placement="top"
      show={showTooltip}
    >
      <div>
        <DropDownSelect
          customBorder={false}
          showPlaceHolder
          options={options}
          darkMode={darkMode}
          onChange={handleChange}
          value={value}
          isMulti={isMulti}
          showControlComponent={true}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </ToolTip>
  );
};
// <Select
//   options={validOptionStructure}
//   value={value}
//   onChange={handleChange}
//   height={height}
//   useMenuPortal={true}
//   closeMenuOnSelect={true}
//   width={width}
//   search={true}
//   placeholder={placeholder}
//   isMulti={isMulti}
//   isDisabled={disabled}
// />
