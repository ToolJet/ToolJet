import React from 'react';
// Table Search
export const GlobalFilter = ({
  globalFilter,
  useAsyncDebounce,
  setGlobalFilter,
  onComponentOptionChanged,
  component,
  onEvent,
}) => {
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((filterValue) => {
    setGlobalFilter(filterValue || undefined);
  }, 200);

  const handleSearchTextChange = (text) => {
    setValue(text);
    onChange(text);

    onComponentOptionChanged(component, 'searchText', text).then(() => {
      onEvent('onSearch', { component, data: {} });
    });
  };

  return (
    <div className="ms-2 d-inline-block border px-2 mx-1" style={{ paddingBottom: '0.25rem' }}>
      <img
        src="../../../../assets/images/icons/search.svg"
        alt=""
        style={{ width: '15px', height: '15px', marginRight: '0.25rem' }}
      />
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
        placeholder="Search"
        style={{
          border: '0',
        }}
      />
    </div>
  );
};
