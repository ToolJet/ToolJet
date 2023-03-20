// import React, { useState, useEffect, useCallback } from 'react';
// import { FilterPreview } from '@/_components';
// import PropTypes from 'prop-types';
// import Select, { fuzzySearch } from 'react-select-search';
// import '@/_styles/widgets/multi-select.scss';

// function MultiSelect({
//   onSelect,
//   onSearch,
//   selectedValues = [],
//   onReset,
//   placeholder = 'Select',
//   options,
//   isLoading,
//   className,
//   searchLabel,
// }) {
//   const [searchText, setSearchText] = useState('');
//   const [filteredOptions, setOptions] = useState([]);

//   useEffect(() => {
//     options && setOptions(filterOptions(options));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [options, selectedValues]);

//   const searchFunction = useCallback(
//     async (query) => {
//       setSearchText(query);
//       if (!query) {
//         return [];
//       }
//       const options = await onSearch(query);
//       return filterOptions(options);
//     },
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [setSearchText, onSearch, selectedValues]
//   );

//   const filterOptions = useCallback(
//     (options) => {
//       return options?.filter((data) => !selectedValues.some((selected) => selected.value === data.value));
//     },
//     [selectedValues]
//   );

//   return (
//     <div className="tj-ms tj-ms-count">
//       <Select
//         className={className}
//         getOptions={onSearch ? searchFunction : undefined}
//         options={onSearch ? [] : filteredOptions}
//         closeOnSelect={false}
//         search={true}
//         multiple
//         value={{ name: '' }}
//         onChange={(id, value) => onSelect([...selectedValues, ...value])}
//         placeholder={placeholder}
//         debounce={onSearch ? 300 : undefined}
//         printOptions="on-focus"
//         emptyMessage={
//           options?.length > 0
//             ? 'Not Found'
//             : searchText
//             ? 'Not found'
//             : searchLabel
//             ? searchLabel
//             : 'Please enter some text'
//         }
//         disabled={isLoading}
//         filterOptions={fuzzySearch}
//       />
//     </div>
//   );
// }

// MultiSelect.propTypes = {
//   onSelect: PropTypes.func.isRequired,
//   onReset: PropTypes.func,
//   onSearch: PropTypes.func,
//   selectedValues: PropTypes.array,
//   placeholder: PropTypes.string,
//   options: PropTypes.array,
//   isLoading: PropTypes.bool,
//   searchLabel: PropTypes.string,
// };

// export { MultiSelect };

// import React from 'react';

// function MultiSelect() {
//   return <div>MultiSelect</div>;
// }

// export { MultiSelect };

import React, { useState, useEffect, useCallback } from 'react';
import { MultiSelect } from 'react-multi-select-component';

const options = [
  { label: 'Grapes 🍇', value: 'grapes' },
  { label: 'Mango 🥭', value: 'mango' },
  { label: 'Strawberry 🍓', value: 'strawberry', disabled: true },
];

const DefaultItemRenderer = ({ checked, filteredOptions, onClick, disabled }) => {
  console.log('optionsxxx', filteredOptions);
  return (
    <div className={`item-renderer ${disabled ? 'disabled' : ''}`}>
      <input type="checkbox" onChange={onClick} checked={checked} tabIndex={-1} disabled={disabled} />
      <div>
        <p>
          {filteredOptions?.first_name} {filteredOptions?.last_name}
        </p>
        <span>{filteredOptions?.email}</span>
      </div>
      <div className="avatar">KA</div>
    </div>
  );
};
function MultiSelectUser({
  onSelect,
  onSearch,
  selectedValues = [],
  onReset,
  placeholder = 'Select',
  options,
  isLoading,
  className,
  searchLabel,
}) {
  const [selected, setSelected] = useState([]);
  const [filteredOptions, setOptions] = useState([]);
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    searchFunction('');
    options && setOptions(filterOptions(options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, selectedValues]);

  useEffect(() => {
    console.log('filteredOptions', filteredOptions);
  }, [filteredOptions]);

  const searchFunction = useCallback(
    async (query) => {
      setSearchText(query);
      if (!query) {
        return [];
      }
      const options = await onSearch(query);
      setOptions(options);
      // return filterOptions(options);
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
    <div>
      <MultiSelect
        options={filteredOptions}
        value={selected}
        onChange={onSelect}
        labelledBy="Select"
        ItemRenderer={DefaultItemRenderer}
      />
    </div>
  );
}

export { MultiSelectUser };
