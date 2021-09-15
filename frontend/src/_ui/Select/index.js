import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

const Select = ({ options = [], value, hasSearch = false, onChange }) => {
  return (
    <SelectSearch
      options={options}
      value={value}
      search={hasSearch}
      onChange={onChange}
      filterOptions={fuzzySearch}
      placeholder="Select.."
    />
  );
};

export default Select;
