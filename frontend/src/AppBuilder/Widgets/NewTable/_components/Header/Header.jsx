import React, { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
// Store files
import useTableStore from '../../_stores/tableStore';
// Local Components
import SearchBar from '../SearchBar';
import Loader from '../Loader';
import Filter from '../Filter';
export const Header = React.memo(
  ({ id, darkMode, fireEvent, setExposedVariables, setGlobalFilter, globalFilter, table, setFilters }) => {
    const { getHeaderVisibility, getLoadingState, getTableProperties } = useTableStore();
    const loadingState = getLoadingState(id);
    const { displaySearchBox, showFilterButton } = getTableProperties(id);
    const appliedFilters = table.getState().columnFilters;

    const [showFilter, setShowFilter] = useState(false);

    // Hide header if the properties are not enabled
    if (!getHeaderVisibility(id)) return null;

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
            variant="tertiary"
            // className={`tj-text-xsm always-active-btn`}
            customStyles={{ minWidth: '32px' }}
            leftIcon="filter"
            fill={`var(--icons-default)`}
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
          {appliedFilters.length > 0 && (
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
        <div
          className={
            'table-card-header d-flex justify-content-between align-items-center '
            //   ${
            //   (tableDetails.addNewRowsDetails.addingNewRows || tableDetails.filterDetails.filtersVisible) && 'disabled'
            // }
          }
        >
          <div>{showFilterButton && renderFilter()}</div>
          <div className="d-flex custom-gap-8" style={{ maxHeight: 32 }}>
            {displaySearchBox && renderSearchBox()}
          </div>
        </div>
        {showFilter && (
          <Filter table={table} darkMode={darkMode} setFilters={setFilters} setShowFilter={setShowFilter} />
        )}
      </>
    );
  }
);
