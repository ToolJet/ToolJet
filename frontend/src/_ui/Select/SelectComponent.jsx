import React from 'react';
import _ from 'lodash';
import Select from 'react-select';
import defaultStyles from './styles';

export const SelectComponent = ({ options = [], value, onChange, ...restProps }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const {
    styles,
    hasSearch = true,
    height,
    width,
    placeholder = 'Select..',
    customOption = undefined,
    defaultValue = null,
    // eslint-disable-next-line no-unused-vars
    useMenuPortal = true,
    maxMenuHeight = 250,
  } = restProps;

  const useStyles = !_.isEmpty(styles) ? styles : defaultStyles(darkMode, width, height);
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

  const handleOnChange = (newValue) => {
    onChange(newValue.value);
  };

  const renderCustomOption = (option) => {
    if (customOption) {
      return customOption(option);
    }

    return option.label;
  };

  return (
    <React.Fragment>
      <Select
        defaultValue={defaultValue}
        options={selectOptions}
        value={currentValue}
        search={hasSearch}
        onChange={handleOnChange}
        placeholder={placeholder}
        styles={useStyles}
        formatOptionLabel={(option) => renderCustomOption(option)}
        menuPlacement="auto"
        maxMenuHeight={maxMenuHeight}
        menuPortalTarget={useMenuPortal ? document.body : null}
      />
    </React.Fragment>
  );
};
