import React from 'react';
// Table Search
export const GlobalFilter = ({
  globalFilter,
  useAsyncDebounce,
  setGlobalFilter,
  onComponentOptionChanged,
  component,
  onEvent,
  darkMode,
}) => {
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((filterValue) => {
    setValue(filterValue);
    setGlobalFilter(filterValue || undefined);
    onComponentOptionChanged(component, 'searchText', filterValue).then(() => {
      onEvent('onSearch', { component, data: {} });
    });
  }, 500);

  return (
    <div className="ms-2 d-flex border px-2 mx-1 btn-light align-items-center" style={{ padding: '0.25rem 0' }}>
      <img
        src="assets/images/icons/search.svg"
        alt="search icon"
        style={{ width: '15px', height: '15px', marginRight: '0.25rem' }}
      />
      <input
        type="text"
        className={`global-search-field btn-light align-self-center ${darkMode && 'dark-theme-placeholder'}`}
        defaultValue={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        data-cy="search-input-field"
        style={{
          border: '0',
        }}
      />
    </div>
  );
};
