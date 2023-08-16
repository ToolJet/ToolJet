import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
// Table Search
export const GlobalFilter = ({
  globalFilter,
  useAsyncDebounce,
  setGlobalFilter,
  onComponentOptionChanged,
  component,
  onEvent,
  // eslint-disable-next-line no-unused-vars
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
    <div
      className="d-flex border align-items-center table-global-search"
      style={{ padding: '0.4rem 0.6rem', borderRadius: '6px' }}
    >
      <div className="d-flex">
        <SolidIcon name="search" width="16" height="16" />
        <input
          type="text"
          className={`align-self-center bg-transparent tj-text tj-text-xsm mx-lg-1`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          data-cy="search-input-field"
          style={{
            border: '0',
          }}
        />
        <div
          className={`d-flex table-clear-icon align-items-center ${globalFilter ? 'visible' : 'invisible'}`}
          style={{ width: '20px', height: '20px', padding: '4px', cursor: 'pointer' }}
          onClick={() => {
            setGlobalFilter(undefined);
            setValue('');
          }}
        >
          <SolidIcon name="remove" width="16" height="16px" fill={darkMode ? '#3E63DD' : '#3E63DD'} />
        </div>
      </div>
    </div>
  );
};
