import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FilterPreview } from '@/_components';
import PropTypes from 'prop-types';
import Select from 'react-select-search';
import '@/_styles/widgets/multi-select.scss';

function MultiSelect({
  onSelect,
  onSearch,
  selectedValues = [],
  onReset,
  placeholder = 'Select',
  isLoading,
  className,
  searchLabel,
}) {
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setOptions] = useState([]);
  const listOfOptions = useRef([]);

  useEffect(() => {
    setOptions(filterOptions(listOfOptions.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValues, listOfOptions.current]);

  const searchFunction = useCallback(
    async (query) => {
      setSearchText(query);
      if (!query) {
        return [];
      }
      const options = await onSearch(query);
      listOfOptions.current = filterOptions(options);
      return listOfOptions.current;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchText, onSearch, selectedValues]
  );

  const filterOptions = useCallback(
    (options) => {
      return options?.filter((data) => !selectedValues.some((selected) => selected.value === data.value));
    },
    [selectedValues]
  );

  return (
    <div className="tj-ms tj-ms-count">
      <FilterPreview text={`${selectedValues.length} selected`} onClose={selectedValues.length ? onReset : undefined} />
      <Select
        className={className}
        getOptions={onSearch ? searchFunction : undefined}
        options={filteredOptions}
        closeOnSelect={false}
        search={true}
        multiple
        value={{ name: '' }}
        onChange={(id, value) => onSelect([...selectedValues, ...value])}
        placeholder={placeholder}
        debounce={onSearch ? 300 : undefined}
        printOptions="on-focus"
        emptyMessage={
          filteredOptions?.length > 0
            ? 'Not Found'
            : searchText
            ? 'Not found'
            : searchLabel
            ? searchLabel
            : 'Please enter some text'
        }
        disabled={isLoading}
        fuzzySearch
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
  searchLabel: PropTypes.string,
};

export { MultiSelect };
