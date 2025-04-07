import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { FilterRow } from './FilterRow';
import { FilterFooter } from './FilterFooter';
import { FilterHeader } from './FilterHeader';

export const Filter = memo(({ table, darkMode, setFilters, setShowFilter }) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState(table.getState().columnFilters);

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

  const isFilterComplete = (filter) => {
    if (!filter.id) return false;
    if (!filter.value?.condition) return false;
    // For isEmpty/isNotEmpty operations, we don't need a value
    if (['isEmpty', 'isNotEmpty'].includes(filter.value.condition)) return true;
    // For other operations, we need a value
    return filter.value?.value !== undefined && filter.value?.value !== '';
  };

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
    debouncedFilterChanged(newFilters);
  };

  const debouncedFilterChanged = useCallback(
    (newFilters) => {
      const validFilters = newFilters.filter(isFilterComplete);
      applyFilters(validFilters);
    },
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

  const addFilter = useCallback(() => {
    setLocalFilters([...localFilters, { id: '', value: { condition: 'contains', value: '' } }]);
  }, [localFilters]);

  const clearFilters = useCallback(() => {
    setLocalFilters([]);
    applyFilters([]);
  }, [applyFilters]);

  const removeFilter = (index) => {
    const newFilters = [...localFilters];
    newFilters.splice(index, 1);
    setLocalFilters(newFilters);
    applyFilters(newFilters.filter((filter) => filter.id !== ''));
  };

  const applyFilters = useCallback(
    (filters) => {
      setFilters(
        filters.map((filter) => ({
          id: filter.id,
          value: filter.value,
        }))
      );
    },
    [setFilters]
  );

  useEffect(() => {
    if (localFilters.length > 0) {
      const tableFilters = deepClone(localFilters);
      debouncedFilterChanged(tableFilters);
    }
  }, [debouncedFilterChanged, localFilters]);

  return (
    <div className={`table-filters card ${darkMode ? 'dark-theme theme-dark' : 'light-theme'}`}>
      <FilterHeader setShowFilter={setShowFilter} />
      <div className="card-body">
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
      <FilterFooter addFilter={addFilter} clearFilters={clearFilters} />
    </div>
  );
});
