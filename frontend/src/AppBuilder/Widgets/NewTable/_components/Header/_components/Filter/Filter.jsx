import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { FilterRow } from './FilterRow';
import { FilterFooter } from './FilterFooter';
import { FilterHeader } from './FilterHeader';
import { FilterQuickRow } from './FilterQuickRow';
import { isFilterComplete } from './filterUtils';
import { getQuickFilters } from '../../../../_utils/quickFilters';
import { applyChipValue } from '../../../../_utils/applyChipValue';
import { debounce, isEqual } from 'lodash';

const SectionTitle = ({ dataCy, className, children }) => (
  <div data-cy={dataCy} className={cn('tw-mb-2 tw-text-base tw-leading-4 tw-text-text-placeholder', className)}>
    {children}
  </div>
);

// The filters this panel edits are the table's own, each marked with where it is edited: `quick` for one the builder
// saved (its row is read-only apart from the value) or `user` for one the user made. The mark never leaves the panel.
const toTableFilters = (filters) => filters.map(({ id, value }) => ({ id, value }));

export const Filter = memo(
  ({
    id,
    table,
    darkMode,
    setFilters,
    setShowFilter,
    componentName,
    defaultFilters,
    filterMatch,
    onFilterMatchChange,
    getOptions,
  }) => {
    const { t } = useTranslation();
    const quickColumns = useMemo(
      () =>
        table.getAllLeafColumns().map((column) => ({
          id: column.id,
          header: column.columnDef.header,
          columnType: column.columnDef.meta?.columnType,
        })),
      [table]
    );
    const [localFilters, setLocalFilters] = useState(() => {
      const applied = table.getState().columnFilters;
      const quick = new Set(
        getQuickFilters(defaultFilters, applied, quickColumns)
          .filter((chip) => chip.applied)
          .map((chip) => chip.appliedIndex)
      );
      return applied.map((filter, index) => ({ ...filter, source: quick.has(index) ? 'quick' : 'user' }));
    });
    const connector = filterMatch === 'or' ? 'or' : 'and';

    // A row the user is making is never taken for a builder filter, even when it is the same column and operator
    const quickChips = useMemo(
      () =>
        getQuickFilters(
          defaultFilters,
          localFilters.map((filter) => (filter.source === 'quick' && isFilterComplete(filter) ? filter : null)),
          quickColumns
        ),
      [defaultFilters, localFilters, quickColumns]
    );
    const claimed = new Set(quickChips.filter((chip) => chip.applied).map((chip) => chip.appliedIndex));
    const userRowIndexes = localFilters.map((_, index) => index).filter((index) => !claimed.has(index));

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
      const newFilters = localFilters.map((filter, i) =>
        i === index
          ? {
              ...filter,
              value: {
                ...filter.value,
                condition: value,
              },
            }
          : filter
      );

      if (value === 'isEmpty' || value === 'isNotEmpty') {
        newFilters[index].value.value = '';
      }
      setLocalFilters(newFilters);
      debouncedFilterChanged(newFilters);
    };

    const debouncedApplyFilters = useMemo(
      () =>
        debounce((filters) => {
          const currentTableFilters = table.getState().columnFilters;
          const next = toTableFilters(filters);
          if (!isEqual(next, currentTableFilters)) setFilters(next);
        }, 500),
      [setFilters, table]
    );

    const applyFilters = useCallback(
      (filters) => {
        debouncedApplyFilters(filters);
      },
      [debouncedApplyFilters]
    );

    const debouncedFilterChanged = useCallback(
      (newFilters) => {
        const validFilters = newFilters.filter(isFilterComplete);
        applyFilters(validFilters);
      },
      [applyFilters]
    );

    const filterValueChanged = (index, value) => {
      const newFilters = localFilters.map((filter, i) =>
        i === index
          ? {
              ...filter,
              value: {
                ...filter.value,
                value: value,
              },
            }
          : filter
      );
      setLocalFilters(newFilters);
      debouncedFilterChanged(newFilters);
    };

    const addFilter = useCallback(() => {
      setLocalFilters([...localFilters, { id: '', value: { condition: 'contains', value: '' }, source: 'user' }]);
    }, [localFilters]);

    // Applied at once: a clear that waits out the typing pause is lost when the panel is closed right after
    const clearFilters = useCallback(() => {
      setLocalFilters([]);
      debouncedApplyFilters.cancel();
      if (table.getState().columnFilters.length > 0) setFilters([]);
    }, [debouncedApplyFilters, setFilters, table]);

    const removeFilter = (index) => {
      const newFilters = localFilters.filter((_, i) => i !== index);
      setLocalFilters(newFilters);
      applyFilters(newFilters.filter((filter) => filter.id !== ''));
    };

    const changeQuickFilter = (chip, change) => {
      const next = applyChipValue(localFilters, chip, change).map((filter) =>
        filter.source ? filter : { ...filter, source: 'quick' }
      );
      setLocalFilters(next);
      // the effect below applies what is left; nothing left has to be applied here
      if (next.length === 0) applyFilters([]);
    };

    // Closing the panel applies what was typed in the last moments instead of dropping it
    useEffect(() => {
      return () => {
        debouncedApplyFilters.flush();
      };
    }, [debouncedApplyFilters]);

    useEffect(() => {
      if (localFilters.length > 0) {
        const tableFilters = deepClone(localFilters);
        debouncedFilterChanged(tableFilters);
      }
    }, [debouncedFilterChanged, localFilters]);

    return (
      <>
        {/* dims the whole table (its card is the containing block); a click on it does not close the panel */}
        <div data-cy="filter-overlay" className="tw-absolute tw-inset-0 tw-z-[99] tw-bg-black/50" aria-hidden="true" />
        <div
          className={`table-filters card ${darkMode ? 'dark-theme theme-dark' : 'light-theme'}`}
          data-cy={`${componentName}-filter-panel`}
          // Escape closes it, unless it was meant for a menu inside it (those cancel the event)
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !event.defaultPrevented) setShowFilter(false);
          }}
          // centred in the table; the inline style also overrides the old right-aligned 300px panel rules
          style={{
            left: '50%',
            right: 'auto',
            top: '4.5rem',
            transform: 'translateX(-50%)',
            width: '68%',
            maxWidth: '674px',
            height: 'auto',
            maxHeight: '80%',
          }}
        >
          <FilterHeader setShowFilter={setShowFilter} />
          <div className="card-body" style={{ padding: '16px' }}>
            {quickChips.length > 0 && (
              <>
                <SectionTitle dataCy="filter-section-quick">Quick filters</SectionTitle>
                {quickChips.map((chip, index) => (
                  <FilterQuickRow
                    key={chip.id}
                    chip={chip}
                    index={index}
                    connector={index === 0 ? 'where' : connector}
                    options={getOptions?.(chip) ?? null}
                    darkMode={darkMode}
                    onChange={changeQuickFilter}
                  />
                ))}
                <SectionTitle dataCy="filter-section-yours" className="tw-mt-1">
                  Your filters
                </SectionTitle>
              </>
            )}
            {userRowIndexes.map((rowIndex, position) => (
              <FilterRow
                id={id}
                key={rowIndex}
                filter={localFilters[rowIndex]}
                index={position}
                connector={quickChips.length > 0 || position > 0 ? connector : undefined}
                // one select sets it for all: on the row that joins the quick filters, or else the second row
                onConnectorChange={position === (quickChips.length > 0 ? 0 : 1) ? onFilterMatchChange : undefined}
                columns={columns}
                darkMode={darkMode}
                onColumnChange={(_, value) => filterColumnChanged(rowIndex, value)}
                onOperationChange={(_, value) => filterOperationChanged(rowIndex, value)}
                onValueChange={(_, value) => filterValueChanged(rowIndex, value)}
                onRemove={() => removeFilter(rowIndex)}
              />
            ))}
            {userRowIndexes.length === 0 && (
              <div>
                <center>
                  <span data-cy={`no-filters-yet-label`}>no filters yet.</span>
                </center>
              </div>
            )}
          </div>
          <FilterFooter addFilter={addFilter} clearFilters={clearFilters} />
        </div>
      </>
    );
  }
);
