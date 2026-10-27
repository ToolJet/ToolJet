import React, { useMemo, useState, memo, useSyncExternalStore } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { debounce } from 'lodash';
import { IconSearch } from '@tabler/icons-react';
import { ProgressSpinner } from '../../ProgressSpinner';

// Without a Table's view (useTableView's searchProgress): no search ever runs in slices.
const NO_PROGRESS = { get: () => null, subscribe: () => () => {} };

// Table Search
export const SearchBar = memo(
  ({ globalFilter = '', setGlobalFilter, isSearching = false, searchProgress = NO_PROGRESS, componentName }) => {
    const [value, setValue] = useState(globalFilter);
    // A search or filter over many rows runs in the background (`isSearching`, set in the same render as the rows it
    // shows); how far it has got comes from searchProgress, which re-renders only this box.
    const percent = useSyncExternalStore(searchProgress.subscribe, searchProgress.get);
    const shownPercent = isSearching && percent !== null ? percent : null;

    const onChange = (filterValue) => {
      setGlobalFilter(filterValue || undefined);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedChange = useMemo(() => debounce(onChange, 500), []);

    return (
      <div
        className="d-flex align-items-center table-global-search"
        data-cy={`${componentName}-search-bar`}
        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px' }}
        aria-busy={isSearching}
      >
        <div className="d-flex align-items-center">
          {isSearching ? (
            <ProgressSpinner data-cy={`${componentName}-search-progress`} />
          ) : (
            <IconSearch
              size="16"
              color={'var(--cc-weak-icon, var(--cc-default-icon))'}
              data-cy={`${componentName}-search-input-icon`}
            />
          )}
          <input
            type="text"
            className={`tw-w-full align-self-center bg-transparent tj-text tj-text-sm tw-mx-[4px] tw-rounded-none`}
            value={value || ''}
            onChange={(e) => {
              setValue(e.target.value);
              debouncedChange(e.target.value);
            }}
            placeholder="Search"
            data-cy={`${componentName}-search-input-field`}
            style={{
              border: '0',
            }}
          />
          {shownPercent !== null && (
            <span
              className="tj-text-xsm tw-whitespace-nowrap tw-mr-[4px]"
              aria-hidden="true"
              data-cy={`${componentName}-search-progress-text`}
              style={{ color: 'var(--cc-weak-icon, var(--cc-default-icon))', fontVariantNumeric: 'tabular-nums' }}
            >
              {shownPercent}%
            </span>
          )}
          <div
            className={`d-flex table-clear-icon align-items-center ${value ? 'visible' : 'invisible'}`}
            data-cy={`${componentName}-search-clear-icon`}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              // setGlobalFilter(undefined);
              setValue('');
              debouncedChange('');
            }}
          >
            <SolidIcon
              name="removerectangle"
              width="16"
              height="16"
              fill={'var(--cc-weak-icon, var(--cc-default-icon))'}
            />
          </div>
        </div>
      </div>
    );
  }
);
