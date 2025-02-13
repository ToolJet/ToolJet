import React, { useEffect, useMemo, useState } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { debounce } from 'lodash';
import useTableStore from '../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

// Table Search
export const SearchBar = React.memo(({ globalFilter = '', setGlobalFilter }) => {
  const [value, setValue] = useState(globalFilter);

  const onChange = (filterValue) => {
    setGlobalFilter(filterValue || undefined);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedChange = useMemo(() => debounce(onChange, 500), []);

  return (
    <div
      className="d-flex align-items-center table-global-search"
      style={{ padding: '0.4rem 0.6rem', borderRadius: '6px' }}
    >
      <div className="d-flex">
        <SolidIcon name="search" style={{ marginTop: '3px' }} width="16" height="16" fill={'var(--icons-default)'} />
        <input
          type="text"
          className={`align-self-center bg-transparent tj-text tj-text-sm mx-lg-1`}
          value={value || ''}
          onChange={(e) => {
            setValue(e.target.value);
            debouncedChange(e.target.value);
          }}
          placeholder="Search"
          data-cy="search-input-field"
          style={{
            border: '0',
          }}
        />
        <div
          className={`d-flex table-clear-icon align-items-center ${value ? 'visible' : 'invisible'}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            // setGlobalFilter(undefined);
            setValue('');
            debouncedChange('');
          }}
        >
          <SolidIcon name="removerectangle" width="16" height="16" fill={'var(--icons-default)'} />
        </div>
      </div>
    </div>
  );
});
