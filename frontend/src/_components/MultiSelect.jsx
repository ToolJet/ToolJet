import React, { useState, useEffect, useCallback } from 'react';
import { FilterPreview } from '@/_components';
import PropTypes from 'prop-types';
import Select, { fuzzySearch } from 'react-select-search';

function MultiSelect({ onSelect, onSearch, selectedValues, onReset, placeholder = 'Select', options, isLoading }) {
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setOptions] = useState([]);

  useEffect(() => {
    options && setOptions(filterOptions(options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, selectedValues]);

  const searchFunction = useCallback(
    async (query) => {
      setSearchText(query);
      if (!query) {
        return [];
      }
      const options = await onSearch(query);
      return filterOptions(options);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchText, onSearch, selectedValues]
  );

  const filterOptions = useCallback(
    (options) => {
      if (selectedValues) {
        return options?.filter((data) => !selectedValues?.some((selected) => selected.value === data.value));
      }
      return options;
    },
    [selectedValues]
  );

  return (
    <div className="tj-ms tj-ms-count">
      <FilterPreview
        text={selectedValues?.length?.toString() || '0'}
        onClose={selectedValues?.length ? onReset : undefined}
      />
      <Select
        getOptions={onSearch ? searchFunction : undefined}
        options={onSearch ? [] : filteredOptions}
        closeOnSelect={false}
        search={true}
        multiple
        value={{ name: '' }}
        onChange={(id, value) => onSelect([...(selectedValues ? selectedValues : []), ...value])}
        placeholder={placeholder}
        debounce={onSearch ? 300 : undefined}
        printOptions="on-focus"
        emptyMessage={options?.length > 0 ? 'Not Found' : searchText ? 'Not found' : 'Please enter some text'}
        disabled={isLoading}
        filterOptions={fuzzySearch}
      />
    </div>
  );
}

MultiSelect.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  onSearch: PropTypes.func,
  selectedValues: PropTypes.array,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  isLoading: PropTypes.bool,
};

export { MultiSelect };
