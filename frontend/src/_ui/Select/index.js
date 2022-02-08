import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

const Select = ({ options = [], value, hasSearch = false, onChange }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <SelectSearch
      options={options}
      value={value}
      search={hasSearch}
      onChange={onChange}
      filterOptions={fuzzySearch}
      placeholder="Select.."
      className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
    />
  );
};

export default Select;
