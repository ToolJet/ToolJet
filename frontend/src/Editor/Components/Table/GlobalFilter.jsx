import React from 'react';
// Table Search
export const GlobalFilter = ({
  preGlobalFilteredRows,
  globalFilter,
  useAsyncDebounce,
  setGlobalFilter,
  onComponentOptionChanged,
  component,
  serverSideSearch,
  onEvent,
}) => {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((filterValue) => {
    setGlobalFilter(filterValue || undefined);
  }, 200);

  const handleSearchTextChange = (text) => {
    console.log(':::serach:::', text);
    setValue(text);
    onChange(text);

    onComponentOptionChanged(component, 'searchText', text).then(() => {
      if (serverSideSearch === true) {
        onEvent('onSearch', { component, data: {} });
      }
    });
  };

  return (
    <div className="ms-2 d-inline-block">
      Search:{' '}
      <input
        type="text"
        className="global-search-field"
        defaultValue={value || ''}
        onBlur={(e) => {
          handleSearchTextChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearchTextChange(e.target.value);
          }
        }}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${count} records`}
        style={{
          border: '0',
        }}
      />
    </div>
  );
};
