import React from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';
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
}) => {
  const validOptionStructure = options.map(({ description = '', ...rest }) => {
    return rest;
  });
  return (
    <DropDownSelect
      customBorder={false}
      showPlaceHolder
      options={validOptionStructure}
      darkMode={darkMode}
      onChange={handleChange}
      // onAdd={() => navigate(getPrivateRoute('database'))}
      // addBtnLabel={'Add new table'}
      value={value}
      isMulti={isMulti}
      showControlComponent={true}
    />
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
