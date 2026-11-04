import React, { useState, useMemo, memo } from 'react';
import { Tooltip } from 'react-tooltip';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
// Store files
import useTableStore from '../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
// Local Components
import { SearchBar } from './_components/SearchBar';
import Loader from '../Loader';
import { Filter } from './_components/Filter/Filter';
import { FilterChips } from './_components/FilterChips';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import { getQuickFilters } from '../../_utils/quickFilters';
import { applyChipValue } from '../../_utils/applyChipValue';
import { getColumnSelectOptions } from '../../_utils/addNewRowConfig';
import { resolveReferences } from '@/_helpers/utils';

export const Header = memo(
  ({
    id,
    darkMode,
    fireEvent,
    setExposedVariables,
    setGlobalFilter,
    globalFilter,
    table,
    setFilters,
    appliedFiltersLength,
    // not read: it changes when a filter's value does, which redraws this memoised header
    appliedFilters: _redrawOnFilterChange,
    componentName,
    filterMatch,
    onFilterMatchChange,
  }) => {
    const displaySearchBox = useTableStore((state) => state.getTableProperties(id)?.displaySearchBox, shallow);
    const showFilterButton = useTableStore((state) => state.getTableProperties(id)?.showFilterButton, shallow);

    const loadingState = useTableStore((state) => state.getLoadingState(id), shallow);
    const isRefreshing = useTableStore((state) => state.getIsRefreshing(id), shallow);
    const headerVisibility = useTableStore((state) => state.getHeaderVisibility(id), shallow);

    const defaultFilters = useTableStore((state) => state.getTableProperties(id)?.defaultFilters, shallow);
    const columnProperties = useTableStore((state) => state.getColumnProperties(id), shallow);
    const filterColumns = table.getAllLeafColumns().map((column) => ({
      id: column.id,
      header: column.columnDef.header,
      columnType: column.columnDef.meta?.columnType,
    }));
    // what the table has applied is read from the table itself, not from a prop that can be missing or stale
    const appliedFilters = table.getState().columnFilters;
    const quickFilters = useMemo(
      () => getQuickFilters(defaultFilters, appliedFilters, filterColumns),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [defaultFilters, appliedFilters, filterColumns.length]
    );

    // The current state of a chip, read when it changes rather than when it was drawn
    const changeChip = (chip, change) => {
      const columnFilters = table.getState().columnFilters;
      const current = getQuickFilters(defaultFilters, columnFilters, filterColumns).find(
        ({ id: chipId }) => chipId === chip.id
      );
      if (current) setFilters(applyChipValue(columnFilters, current, change));
    };
    const getChipOptions = (chip) => {
      if (['boolean', 'toggle'].includes(chip.columnType)) {
        return [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ];
      }
      if (!['select', 'newMultiSelect', 'tagsV2'].includes(chip.columnType)) return null;
      const column = columnProperties?.find(({ id: columnId }) => columnId === chip.columnId);
      return column ? getColumnSelectOptions(column, (value) => resolveReferences(value)) : [];
    };

    const [showFilter, setShowFilter] = useState(false);

    // Hide header if the properties are not enabled
    if (!headerVisibility) return null;

    // Loading state for header
    if (loadingState || isRefreshing) {
      return (
        <div
          className={'table-card-header d-flex justify-content-between align-items-center'}
          data-cy={`${componentName}-header-section`}
        >
          <Loader width={83} height={28} />
          <div className="d-flex custom-gap-8" style={{ maxHeight: 32 }}>
            <Loader width={100} height={28} />
          </div>
        </div>
      );
    }

    const renderFilter = () => {
      return (
        <div className="position-relative tw-shrink-0">
          <Tooltip id="tooltip-for-filter-data" className="tooltip" />
          <ButtonSolid
            variant="tertiary"
            customStyles={{ minWidth: '32px' }}
            className={`tj-text-xsm ${showFilter && 'always-active-btn'}`}
            leftIcon="IconFilter"
            fill={`var(--cc-primary-icon, var(--cc-default-icon))`}
            iconWidth="16"
            isTablerIcon={true}
            onClick={(e) => {
              if (showFilter) {
                setShowFilter(false);
                if (document.activeElement === e.currentTarget) {
                  e.currentTarget.blur();
                }
              } else {
                setShowFilter(true);
              }
            }}
            size="md"
            data-tooltip-id="tooltip-for-filter-data"
            data-tooltip-content="Filter data"
            data-cy={`${componentName}-filter-button`}
          ></ButtonSolid>
          {appliedFiltersLength > 0 && (
            <div className="filter-applied-state position-absolute" data-cy={`${componentName}-filter-applied-state`}>
              <svg
                className="filter-applied-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
              >
                <circle
                  cx="8.3606"
                  cy="8.08325"
                  r="6.08325"
                  stroke="var(--slate1)"
                  fill="var(--indigo9)"
                  stroke-width="4"
                />
              </svg>
            </div>
          )}
        </div>
      );
    };

    const renderSearchBox = () => (
      <SearchBar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        // component={component}
        darkMode={darkMode}
        setExposedVariables={setExposedVariables}
        fireEvent={fireEvent}
        id={id}
        componentName={componentName}
      />
    );

    return (
      <>
        <div className={'table-card-header d-flex justify-content-between align-items-center '}>
          {/* the filter button keeps the top-left corner; the chips take the room between it and the search box */}
          <div className="d-flex align-items-center custom-gap-8 tw-min-w-0 tw-flex-1">
            {showFilterButton && renderFilter()}
            {showFilterButton && (
              // a failure drawing the chips is contained here instead of taking the whole table down
              <FallbackBoundary
                label="Table filter chips"
                variant="inline"
                resetKeys={[defaultFilters]}
                darkMode={darkMode}
              >
                <FilterChips
                  chips={quickFilters}
                  componentName={componentName}
                  getOptions={getChipOptions}
                  onValueChange={changeChip}
                  onClear={(chip) => changeChip(chip, chip.needsValue ? '' : false)}
                  darkMode={darkMode}
                />
              </FallbackBoundary>
            )}
          </div>
          <div className="d-flex custom-gap-8 tw-shrink-0" style={{ maxHeight: 32 }}>
            {displaySearchBox && renderSearchBox()}
          </div>
        </div>
        {showFilter && (
          <Filter
            id={id}
            table={table}
            darkMode={darkMode}
            setFilters={setFilters}
            setShowFilter={setShowFilter}
            componentName={componentName}
            defaultFilters={defaultFilters}
            filterMatch={filterMatch}
            onFilterMatchChange={onFilterMatchChange}
            getOptions={getChipOptions}
          />
        )}
      </>
    );
  }
);
