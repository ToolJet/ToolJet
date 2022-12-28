import React from 'react';
import _ from 'lodash';
import Select from 'react-select';
import defaultStyles from './styles';

export const SelectComponent = ({ options = [], value, onChange, ...restProps }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const {
    styles,
    isLoading = false,
    hasSearch = true,
    height,
    width,
    placeholder = 'Select..',
    customOption = undefined,
    defaultValue = null,
    useMenuPortal = true, // todo: deperecate this prop, use menuPortalTarget instead
    maxMenuHeight = 250,
    menuPortalTarget = null,
    menuPlacement = 'auto',
  } = restProps;

  const customStyles = defaultStyles(darkMode, width, height, styles);
  const selectOptions =
    Array.isArray(options) && options.length === 0
      ? options
      : options.map((option) => {
          if (!option.hasOwnProperty('label')) {
            return _.mapKeys(option, (value, key) => (key === 'value' ? key : 'label'));
          }
          return option;
        });

  const currentValue = selectOptions.find((option) => option.value === value) || value;

  const handleOnChange = ({ value }) => {
    onChange(value);
  };

  const renderCustomOption = (option) => {
    if (customOption) {
      return customOption(option);
    }

    return option.label;
  };

  return (
    <Select
      {...restProps}
      defaultValue={defaultValue}
      isLoading={isLoading}
      options={selectOptions}
      value={currentValue}
      search={hasSearch}
      onChange={handleOnChange}
      placeholder={placeholder}
      styles={customStyles}
      formatOptionLabel={(option) => renderCustomOption(option)}
      menuPlacement={menuPlacement}
      maxMenuHeight={maxMenuHeight}
      menuPortalTarget={useMenuPortal ? document.body : menuPortalTarget}
    />
  );
};
