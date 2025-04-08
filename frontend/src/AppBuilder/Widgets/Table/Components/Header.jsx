import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { Tooltip } from 'react-tooltip';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { GlobalFilter } from '../GlobalFilter';
import { isEmpty, isEqual } from 'lodash';

export const Header = React.memo(
  ({
    tableDetails,
    displaySearchBox,
    showFilterButton,
    loadingState,
    hideFilters,
    showFilters,
    darkMode,
    fireEvent,
    setExposedVariables,
    component,
    state,
    setGlobalFilter,
  }) => {
    return (
      <div
        className={`table-card-header d-flex justify-content-between align-items-center ${
          (tableDetails.addNewRowsDetails.addingNewRows || tableDetails.filterDetails.filtersVisible) && 'disabled'
        }`}
        style={{ padding: '12px', height: 56 }}
      >
        <div>
          {loadingState && (
            <SkeletonTheme baseColor="var(--slate3)">
              <Skeleton count={1} width={83} height={28} className="mb-1" />
            </SkeletonTheme>
          )}
          {showFilterButton && !loadingState && (
            <div className="position-relative">
              <Tooltip id="tooltip-for-filter-data" className="tooltip" />
              <ButtonSolid
                variant="tertiary"
                className={`tj-text-xsm ${tableDetails.filterDetails.filtersVisible && 'always-active-btn'}`}
                customStyles={{ minWidth: '32px' }}
                leftIcon="filter"
                fill={`var(--icons-default)`}
                iconWidth="16"
                onClick={(e) => {
                  if (tableDetails?.filterDetails?.filtersVisible) {
                    hideFilters();
                    if (document.activeElement === e.currentTarget) {
                      e.currentTarget.blur();
                    }
                  } else {
                    showFilters();
                  }
                }}
                size="md"
                data-tooltip-id="tooltip-for-filter-data"
                data-tooltip-content="Filter data"
              ></ButtonSolid>
              {(tableDetails?.filterDetails?.filtersVisible || !isEmpty(tableDetails.filterDetails.filters)) && (
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
          )}
        </div>
        <div className="d-flex custom-gap-8" style={{ maxHeight: 32 }}>
          {loadingState && (
            <SkeletonTheme baseColor="var(--slate3)">
              <Skeleton count={1} width={100} height={28} className="mb-1" />
            </SkeletonTheme>
          )}
          {displaySearchBox && !loadingState && (
            <GlobalFilter
              globalFilter={state.globalFilter}
              setGlobalFilter={setGlobalFilter}
              component={component}
              darkMode={darkMode}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
            />
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);
