import React, { useContext, useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import { TooljetDatabaseContext } from '../index';
import { operators } from '../constants';
import { debounce } from 'lodash';

export const FilterForm = ({ filters, setFilters, index, column = '', operator = '', value = '' }) => {
  const { columns } = useContext(TooljetDatabaseContext);

  const [filterInputValue, setFilterInputValue] = useState(value);

  useEffect(() => {
    const debouncedFilter = debounce(() => {
      const prevFilters = { ...filters };
      prevFilters[index].value = filterInputValue;

      setFilters(prevFilters);
    }, 500);

    debouncedFilter();

    return debouncedFilter.cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterInputValue]);

  const handleColumnChange = (value) => {
    const prevFilters = { ...filters };
    prevFilters[index].column = value;

    setFilters(prevFilters);
  };

  const handleOperatorChange = (value) => {
    const prevFilters = { ...filters };
    prevFilters[index].operator = value;

    setFilters(prevFilters);
  };

  const handleDelete = () => {
    const prevFilters = { ...filters };
    delete prevFilters[index];
    setFilters(prevFilters);
  };

  const displayColumns = columns.map(({ accessor }) => ({ value: accessor, label: accessor }));

  return (
    <div className="row g-2 align-items-center">
      <div className="col-11">
        <div className="row g-2 align-items-center py-3">
          <div className="col-4">
            <Select
              useMenuPortal={false}
              placeholder="Select column"
              value={column}
              options={displayColumns}
              onChange={handleColumnChange}
            />
          </div>
          <div className="col-4">
            <Select
              placeholder="Select operation"
              useMenuPortal={false}
              value={operator}
              options={operators}
              onChange={handleOperatorChange}
            />
          </div>
          <div className="col-4">
            <input
              value={filterInputValue}
              type="text"
              className="form-control"
              placeholder="Value"
              onChange={(event) => {
                setFilterInputValue(event.target.value);
              }}
            />
          </div>
        </div>
      </div>
      <div className="col-1 cursor-pointer">
        <svg
          onClick={handleDelete}
          width="12"
          height="14"
          viewBox="0 0 12 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.72386 0.884665C3.97391 0.634616 4.31304 0.494141 4.66667 0.494141H7.33333C7.68696 0.494141 8.02609 0.634616 8.27614 0.884665C8.52619 1.13471 8.66667 1.47385 8.66667 1.82747V3.16081H10.6589C10.6636 3.16076 10.6683 3.16076 10.673 3.16081H11.3333C11.7015 3.16081 12 3.45928 12 3.82747C12 4.19566 11.7015 4.49414 11.3333 4.49414H11.2801L10.6664 11.858C10.6585 12.3774 10.4488 12.8738 10.0809 13.2417C9.70581 13.6168 9.1971 13.8275 8.66667 13.8275H3.33333C2.8029 13.8275 2.29419 13.6168 1.91912 13.2417C1.55125 12.8738 1.34148 12.3774 1.33357 11.858L0.719911 4.49414H0.666667C0.298477 4.49414 0 4.19566 0 3.82747C0 3.45928 0.298477 3.16081 0.666667 3.16081H1.32702C1.33174 3.16076 1.33644 3.16076 1.34113 3.16081H3.33333V1.82747C3.33333 1.47385 3.47381 1.13471 3.72386 0.884665ZM2.05787 4.49414L2.66436 11.7721C2.6659 11.7905 2.66667 11.809 2.66667 11.8275C2.66667 12.0043 2.7369 12.1739 2.86193 12.2989C2.98695 12.4239 3.15652 12.4941 3.33333 12.4941H8.66667C8.84348 12.4941 9.01305 12.4239 9.13807 12.2989C9.2631 12.1739 9.33333 12.0043 9.33333 11.8275C9.33333 11.809 9.3341 11.7905 9.33564 11.7721L9.94213 4.49414H2.05787ZM7.33333 3.16081H4.66667V1.82747H7.33333V3.16081ZM4.19526 7.63221C3.93491 7.37186 3.93491 6.94975 4.19526 6.6894C4.45561 6.42905 4.87772 6.42905 5.13807 6.6894L6 7.55133L6.86193 6.6894C7.12228 6.42905 7.54439 6.42905 7.80474 6.6894C8.06509 6.94975 8.06509 7.37186 7.80474 7.63221L6.94281 8.49414L7.80474 9.35607C8.06509 9.61642 8.06509 10.0385 7.80474 10.2989C7.54439 10.5592 7.12228 10.5592 6.86193 10.2989L6 9.43695L5.13807 10.2989C4.87772 10.5592 4.45561 10.5592 4.19526 10.2989C3.93491 10.0385 3.93491 9.61642 4.19526 9.35607L5.05719 8.49414L4.19526 7.63221Z"
            fill="#E54D2E"
          />
        </svg>
      </div>
    </div>
  );
};
