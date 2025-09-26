import React, { useState, memo } from 'react';
import { Tooltip } from 'react-tooltip';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
// Store files
import useTableStore from '../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
// Local Components
import { SearchBar } from './_components/SearchBar';
import Loader from '../Loader';
import { Filter } from './_components/Filter/Filter';

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
  }) => {
    const displaySearchBox = useTableStore((state) => state.getTableProperties(id)?.displaySearchBox, shallow);
    const showFilterButton = useTableStore((state) => state.getTableProperties(id)?.showFilterButton, shallow);

    const loadingState = useTableStore((state) => state.getLoadingState(id), shallow);
    const headerVisibility = useTableStore((state) => state.getHeaderVisibility(id), shallow);

    const appliedFilters = table.getState().columnFilters;

    const [showFilter, setShowFilter] = useState(false);

    // Hide header if the properties are not enabled
    if (!headerVisibility) return null;

    // Loading state for header
    if (loadingState) {
      return (
        <div className={'table-card-header d-flex justify-content-between align-items-center'}>
          <Loader width={83} height={28} />
          <div className="d-flex custom-gap-8" style={{ maxHeight: 32 }}>
            <Loader width={100} height={28} />
          </div>
        </div>
      );
    }

    const renderFilter = () => {
      return (
        <div className="position-relative">
          <Tooltip id="tooltip-for-filter-data" className="tooltip" />
          <ButtonSolid
            variant="ghostBlack"
            customStyles={{ minWidth: '32px' }}
            className={`tj-text-xsm ${showFilter && 'always-active-btn'}`}
            leftIcon="filter"
            fill={`var(--cc-table-action-icon-color)`}
            iconWidth="16"
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
          ></ButtonSolid>
          {appliedFiltersLength > 0 && (
            <div className="filter-applied-state position-absolute">
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
      />
    );

    return (
      <>
        <div className={'table-card-header d-flex justify-content-between align-items-center '}>
          <div>{showFilterButton && renderFilter()}</div>
          <div className="d-flex custom-gap-8" style={{ maxHeight: 32 }}>
            {displaySearchBox && renderSearchBox()}
          </div>
        </div>
        {showFilter && (
          <Filter id={id} table={table} darkMode={darkMode} setFilters={setFilters} setShowFilter={setShowFilter} />
        )}
      </>
    );
  }
);
