import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Select from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff as deepDiff } from 'deep-object-diff';
import { FILTER_OPTIONS } from './filterConstants';

// Create a separate FilterRow component
const FilterRow = React.memo(
  ({ filter, index, columns, darkMode, onColumnChange, onOperationChange, onValueChange, onRemove }) => {
    const { t } = useTranslation();

    const selectStyles = (width) => {
      return {
        ...defaultStyles(darkMode, width),
        menuPortal: (provided) => ({ ...provided, zIndex: 999 }),
        menuList: (base) => ({
          ...base,
        }),
      };
    };

    return (
      <div className="row mb-2">
        <div className="col p-2" style={{ maxWidth: '70px' }}>
          <small data-cy={`label-filter-column`}>{index > 0 ? 'and' : 'column'}</small>
        </div>
        <div data-cy={`select-coloumn-dropdown-${index}`} className="col">
          <Select
            options={columns}
            value={filter.id}
            search={true}
            onChange={(value) => onColumnChange(index, value)}
            placeholder={t('globals.select', 'Select') + '...'}
            className={`${darkMode ? 'select-search-dark' : 'select-search'} mb-0`}
            styles={selectStyles('100%')}
            useCustomStyles={true}
            darkMode={darkMode}
          />
        </div>
        <div data-cy={`select-operation-dropdown-${index}`} className="col" style={{ maxWidth: '180px' }}>
          <Select
            options={FILTER_OPTIONS}
            value={filter.value.condition}
            search={true}
            onChange={(value) => onOperationChange(index, value)}
            className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
            placeholder={t('globals.select', 'Select') + '...'}
            styles={selectStyles('100%')}
            useCustomStyles={true}
            darkMode={darkMode}
          />
        </div>
        <div className="col">
          {!['isEmpty', 'isNotEmpty'].includes(filter.value.condition) && (
            <input
              data-cy={`data-filtervalue-input-${index}`}
              type="text"
              value={filter.value.value}
              placeholder="value"
              className="form-control"
              onChange={(e) => onValueChange(index, e.target.value)}
            />
          )}
        </div>
        <div className="col-auto">
          <button
            data-cy={`button-close-filter-${index}`}
            onClick={() => onRemove(index)}
            className={`btn ${darkMode ? 'btn-dark' : 'btn-light'} btn-sm p-2 text-danger font-weight-bold`}
          >
            x
          </button>
        </div>
      </div>
    );
  }
);

export const Filter = React.memo(({ table, darkMode, setFilters, setShowFilter }) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState([]);

  table.getHeaderGroups().map((headerGroup) => (
    <tr key={headerGroup.id}>
      {headerGroup.headers.map((header) => {
        console.log('here--- header--- ', header.column, header.column.getFilterValue());
      })}
    </tr>
  ));

  // Memoize columns
  const columns = useMemo(
    () =>
      table
        .getAllColumns()
        .filter((column) => !column.columnDef?.meta?.skipFilter)
        .map((column) => ({
          name: column.columnDef.header,
          value: column.id,
        })),
    [table]
  );

  // Memoize callbacks
  const filterColumnChanged = useCallback(
    (index, value) => {
      const filter = columns.find((column) => column.value === value);
      setLocalFilters((prevFilters) =>
        prevFilters.map((f, i) =>
          i === index
            ? {
                ...f,
                id: filter.value,
                value: { ...f.value, column: filter.name },
              }
            : f
        )
      );
    },
    [columns]
  );

  const filterOperationChanged = (index, value) => {
    const newFilters = [...localFilters];
    newFilters[index].value = {
      ...newFilters[index].value,
      condition: value,
    };

    if (value === 'isEmpty' || value === 'isNotEmpty') {
      newFilters[index].value.value = '';
    }
    setLocalFilters(newFilters);
    applyFilters(newFilters.filter((filter) => filter.id !== ''));
  };

  const debouncedFilterChanged = useCallback(
    (newFilters) => {
      // _.debounce((newFilters) => {
      const validFilters = newFilters.filter((filter) => filter.id !== '');
      console.log('here--- validFilters--- ', validFilters);

      applyFilters(validFilters);
    },
    // }, 500),
    [applyFilters]
  );

  const filterValueChanged = (index, value) => {
    const newFilters = [...localFilters];
    newFilters[index].value = {
      ...newFilters[index].value,
      value: value,
    };
    setLocalFilters(newFilters);
    debouncedFilterChanged(newFilters);
  };

  const addFilter = () => {
    setLocalFilters([...localFilters, { id: '', value: { condition: 'contains', value: '' } }]);
  };

  const removeFilter = (index) => {
    const newFilters = [...localFilters];
    newFilters.splice(index, 1);
    setLocalFilters(newFilters);
    applyFilters(newFilters.filter((filter) => filter.id !== ''));
  };

  const clearFilters = () => {
    setLocalFilters([]);
    applyFilters([]);
  };

  const applyFilters = useCallback((filters) => {
    setFilters(
      filters.map((filter) => ({
        id: filter.id,
        value: filter.value,
      }))
    );
  }, []);

  useEffect(() => {
    if (localFilters.length > 0) {
      const tableFilters = JSON.parse(JSON.stringify(localFilters));
      const shouldFire = findFilterDiff(localFilters, tableFilters);
      console.log('here--- shouldFire--- ', shouldFire, localFilters);
      //   if (shouldFire)
      debouncedFilterChanged(tableFilters);
    }
  }, [debouncedFilterChanged, localFilters]);

  return (
    <div className={`table-filters card ${darkMode ? 'dark-theme theme-dark' : 'light-theme'}`}>
      <div className="card-header row">
        <div className="col">
          <h4 data-cy={`header-filters`} className="font-weight-normal">
            Filters
          </h4>
        </div>
        <div className="col-auto">
          <button
            data-cy={`button-close-filters`}
            onClick={() => {
              setShowFilter(false);
            }}
            className="btn btn-light btn-sm"
          >
            x
          </button>
        </div>
      </div>
      <div
        className="card-body"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {localFilters.map((filter, index) => (
          <FilterRow
            key={index}
            filter={filter}
            index={index}
            columns={columns}
            darkMode={darkMode}
            onColumnChange={filterColumnChanged}
            onOperationChange={filterOperationChanged}
            onValueChange={filterValueChanged}
            onRemove={removeFilter}
          />
        ))}
        {localFilters.length === 0 && (
          <div>
            <center>
              <span data-cy={`label-no-filters`}>no filters yet.</span>
            </center>
          </div>
        )}
      </div>
      <div className="card-footer d-flex custom-gap-8">
        <ButtonSolid
          variant="primary"
          className="tj-text-xsm"
          onClick={addFilter}
          size="sm"
          customStyles={{ padding: '10px 20px' }}
          data-cy="button-add-filter"
        >
          <span>+ add filter</span>
        </ButtonSolid>

        <ButtonSolid
          variant="tertiary"
          className="tj-text-xsm"
          onClick={clearFilters}
          size="sm"
          customStyles={{ padding: '10px 20px' }}
          data-cy="button-clear-filters"
        >
          <span>clear filters</span>
        </ButtonSolid>
      </div>
    </div>
  );
});

const findFilterDiff = (oldFilters, newFilters) => {
  const filterDiff = deepDiff(oldFilters, newFilters);

  const getType = (obj) => {
    if (!obj?.column && !obj?.condition) return 'value';
    if (obj?.column) return 'column';
    if (obj?.condition) return 'condition';
  };

  const diff = Object.entries(filterDiff).reduce((acc, [key, value]) => {
    const type = getType(value?.value);
    return { ...acc, keyIndex: key, type: type, diff: value?.value?.[type] };
  }, {});

  return shouldFireEvent(diff, newFilters);
};

const shouldFireEvent = (diff, filter) => {
  if (!diff || !filter) return false;

  const forEmptyOperationAndNotEmptyOperation = (condition) => {
    if (condition !== 'isEmpty' || condition !== 'isNotEmpty') {
      return filter[diff.keyIndex]?.value?.column ? true : false;
    }
    return filter[diff.keyIndex]?.value?.value && filter[diff.keyIndex]?.value?.column ? true : false;
  };

  switch (diff.type) {
    case 'value':
      return filter[diff.keyIndex]?.value?.column && filter[diff.keyIndex]?.value?.condition ? true : false;
    case 'column':
      return filter[diff.keyIndex]?.value?.value && filter[diff.keyIndex]?.value?.condition ? true : false;
    case 'condition':
      return forEmptyOperationAndNotEmptyOperation(filter[diff.keyIndex]?.value?.condition);
    default:
      return false;
  }
};
