import React, { useState } from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FilterForm } from '../Forms/FilterForm';
import { isEmpty } from 'lodash';
import { pluralize } from '@/_helpers/utils';
import { useMounted } from '@/_hooks/use-mount';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import ClearIndicator from '@/_ui/Icon/bulkIcons/ClearIndicator';
import InfoIcon from '@assets/images/icons/info.svg';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import './styles.scss';
import { toast } from 'react-hot-toast';

const Filter = ({
  filters,
  setFilters,
  handleBuildFilterQuery,
  resetFilterQuery,
  setFilterEnable,
  filterEnable,
  setActiveFilters,
}) => {
  const [tempFilters, setTempFilters] = useState(deepClone(filters));
  const [show, setShow] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const filterKeys = Object.keys(tempFilters);
  const tempFilterCount = Object.keys(tempFilters).length;
  const filterCount = Object.keys(filters).length;
  const validFilterCountRef = React.useRef(0);
  const isMounted = useMounted();

  const reset = () => {
    setFilters({});
    setShow(false);
  };

  const generateMessage = (operator) => {
    const operatorMessage = {
      gte: 'Greater than or equal',
      lt: 'Less than',
      gt: 'Greater than',
      eq: 'Equals',
      lte: 'Less than or equal',
      neq: 'Not equal',
    };
    return operatorMessage[operator];
  };

  React.useEffect(() => {
    setActiveFilters(filterCount);
  }, [filterCount, setActiveFilters]);

  const allValidFilters = React.useMemo(() => {
    const filteredFilters = Object.values(tempFilters).filter(
      ({ column, operator, value }) => column || operator || value
    );
    if (filteredFilters.length === 0 && filterCount === 0) {
      validFilterCountRef.current = 0;
      return false;
    }
    if (filteredFilters.length === 0 && filterCount !== 0 && tempFilterCount !== 0) {
      validFilterCountRef.current = 0;
      return false;
    }
    validFilterCountRef.current = filteredFilters.length;
    return filteredFilters.every(({ column, operator, value }) => column && operator && value);
  }, [tempFilters]);

  const popover = (
    <Popover
      id="storage-filter-popover"
      className={cx('filter-popup', { 'dark-theme': darkMode })}
      data-cy="filter-section"
    >
      <Popover.Body bsPrefix="storage-filter-popover" style={{ height: '100%' }}>
        <div className="filter-header">
          <span className="filter-heading">Filters</span>
          <span
            className="cursor-pointer"
            onClick={() => {
              setShow(false);
              setTempFilters(deepClone(filters));
            }}
          >
            <SolidIcon name="remove" fill={darkMode ? '#C1C8CD' : '#6A727C'} />
          </span>
        </div>
        <div className="card-body filter-body" data-cy="filter-card-body">
          {tempFilterCount === 0 && (
            <div className="empty-filters-value">
              <InfoIcon style={{ width: '16px', marginRight: '5px' }} />
              <span>There are no filters added</span>
            </div>
          )}
          {tempFilterCount > 0 && (
            <>
              <div className="filter-title">
                <span className="width-lg">Column</span>
                <span className="width-sm">Operation</span>
                <span className="width-lg">Value</span>
              </div>
              {Object.values(tempFilters).map((filter, index) => {
                return (
                  <div key={index} className="tw-pb-1 filter-content">
                    <FilterForm
                      {...filter}
                      filters={tempFilters}
                      index={filterKeys[index]}
                      setFilters={setTempFilters}
                      generateMessage={generateMessage}
                    />
                  </div>
                );
              })}
            </>
          )}
          <div className="tw-mt-1 tw-pl-2">
            <ButtonSolid
              variant="ghostBlue"
              size="sm"
              onClick={() =>
                setTempFilters((prevFilters) => ({ ...prevFilters, [+Object.keys(prevFilters).pop() + 1 || 0]: {} }))
              }
            >
              <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
              Add filter
            </ButtonSolid>
          </div>
        </div>
        <div className="card-footer filter-footer" data-cy="filter-card-footer">
          {filterCount > 0 && tempFilterCount > 0 && (
            <ButtonSolid
              variant="ghostBlue"
              size="sm"
              onClick={() => {
                setTempFilters({});
              }}
            >
              <ClearIndicator width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
              Clear all
            </ButtonSolid>
          )}
          <ButtonSolid
            variant="tertiary"
            size="sm"
            onClick={() => {
              setTempFilters(deepClone(filters));
              document.activeElement.blur();
            }}
          >
            Cancel
          </ButtonSolid>
          <ButtonSolid
            variant="primary"
            size="sm"
            onClick={() => {
              setFilters(tempFilters);
              setShow(false);
            }}
            disabled={!allValidFilters || (filterCount === 0 && tempFilterCount === 0)}
          >
            Apply
          </ButtonSolid>
        </div>
      </Popover.Body>
    </Popover>
  );

  const checkIsFilterObjectEmpty = (filter) =>
    !isEmpty(filter.column) && !isEmpty(filter.operator) && !isEmpty(filter.value);
  const areFiltersApplied = !show && Object.values(filters).some(checkIsFilterObjectEmpty);
  const filtersApplied = Object.values(filters).some(checkIsFilterObjectEmpty) ? true : false;

  filtersApplied === true ? setFilterEnable(true) : setFilterEnable(false);

  React.useEffect(() => {
    if (Object.keys(filters).length === 0 && isMounted) {
      reset();
      resetFilterQuery();
    } else {
      let validFilters = { ...filters };
      let hasInvalidFilter = false;

      Object.keys(filters).map((key) => {
        if (!isEmpty(filters[key])) {
          const { column, operator, value } = filters[key];
          if (!isEmpty(column) && !isEmpty(operator) && !isEmpty(value)) {
            if (value.toLowerCase() === 'null' && operator !== 'is') {
              delete validFilters[key];
              hasInvalidFilter = true;
              toast.error(
                `Invalid filter operation: Cannot use '${generateMessage(
                  operator
                )}' operator with a NULL value for column '${column}'.`,
                { position: 'top-center' }
              );
            }
          }
        }
      });

      if (hasInvalidFilter) {
        setFilters(validFilters);
      }

      if (Object.keys(validFilters).length > 0) {
        handleBuildFilterQuery(validFilters);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return (
    <>
      <OverlayTrigger
        rootClose
        trigger="click"
        show={show}
        onToggle={(show) => {
          if (show && isEmpty(filters)) setTempFilters({ 0: {} });
          if (show && !isEmpty(filters)) setTempFilters(deepClone(filters));
          setShow(show);
        }}
        placement="bottom-start"
        overlay={popover}
      >
        <div className={cx('tw-flex', 'tw-relative')}>
          <button
            data-cy="filter-button"
            className={cx('tj-db-filter-btn tj-text-xsm font-weight-500 ghost-black-operation', {
              'tj-db-filter-btn-applied': areFiltersApplied,
              'tj-db-filter-btn-active-filter': show && filterCount > 0,
              'tj-db-filter-btn-active': show && filterCount === 0,
            })}
          >
            <SolidIcon
              name="filter"
              width="14px"
              fill={
                areFiltersApplied
                  ? '#3E63DD'
                  : show && filterCount === 0
                  ? '#ACB2B9'
                  : show && filterCount > 0
                  ? '#4368E3'
                  : '#889096'
              }
            />
            <div className="tw-flex items-center tw-ml-[3px]">
              {filterCount > 0 ? (
                <span>{pluralize(validFilterCountRef.current, 'filter')}</span>
              ) : (
                <div>&nbsp;&nbsp;Filter</div>
              )}
            </div>
            {/* {areFiltersApplied && (
              <span>ed by {pluralize(Object.values(filters).filter(checkIsFilterObjectEmpty).length, 'column')}</span>
            )} */}
          </button>
          {filterCount > 0 && (
            <div
              className="tw-absolute tw-right-[-20px] tw-z-50 tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-p-[7px] cursor-pointer tj-db-filter-clear-icon"
              onClick={() => {
                setFilters({});
                setTempFilters({});
              }}
            >
              <SolidIcon name="remove" width="14px" fill="#3E63DD" />
            </div>
          )}
        </div>
      </OverlayTrigger>
    </>
  );
};

export default Filter;
