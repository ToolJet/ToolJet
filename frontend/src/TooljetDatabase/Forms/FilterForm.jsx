import React, { useContext, useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import { TooljetDatabaseContext } from '../index';
import { operators } from '../constants';
import { debounce } from 'lodash';
import SolidIcon from '@/_ui/Icon/SolidIcons';

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
          <div className="col-4 select-column-field" data-cy="select-column-field">
            <Select
              useMenuPortal={false}
              placeholder="Select column"
              value={column}
              options={displayColumns}
              onChange={handleColumnChange}
            />
          </div>
          <div className="col-4 select-operation-field" data-cy="select-operation-field">
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
              className="tj-input-element css-zz6spl-container"
              data-cy="value-input-field"
              placeholder="Value"
              onChange={(event) => {
                setFilterInputValue(event.target.value);
              }}
            />
          </div>
        </div>
      </div>
      <div className="col-1 cursor-pointer" data-cy="delete-icon" onClick={handleDelete}>
        <SolidIcon name="trash" fill="#E54D2E" width="14" />
      </div>
    </div>
  );
};
