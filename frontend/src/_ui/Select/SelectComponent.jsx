import React from 'react';
import _ from 'lodash';
import Select from 'react-select';
import defaultStyles from './styles';

export const SelectComponent = ({ options = [], value, onChange, ...restProps }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { styles, hasSearch = false, height, width, placeholder = 'Select..' } = restProps;

  const useStyles = styles || defaultStyles(darkMode, width, height);
  const selectOptions =
    options.length === 0
      ? options
      : options.map((option) => {
          if (!option.hasOwnProperty('label')) {
            return _.mapKeys(option, (value, key) => (key === 'value' ? key : 'label'));
          }
          return option;
        });

  const currentValue = typeof value === 'string' ? selectOptions.find((option) => option.value === value) : value;

  return (
    <React.Fragment>
      <Select
        options={selectOptions}
        value={currentValue}
        search={hasSearch}
        onChange={onChange}
        placeholder={placeholder}
        styles={useStyles}
      />
    </React.Fragment>
  );
};
