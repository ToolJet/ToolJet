import React, { useContext } from 'react';
import Select from '@/_ui/Select';
import { TooljetDatabaseContext } from '../index';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const SortForm = ({ filters, setFilters, index, column = '', order = '' }) => {
  const { columns } = useContext(TooljetDatabaseContext);

  const orders = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];

  const handleColumnChange = (value) => {
    const prevFilters = { ...filters };
    prevFilters[index].column = value;

    setFilters(prevFilters);
  };

  const handleFilterChange = (value) => {
    const prevFilters = { ...filters };
    prevFilters[index].order = value;

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
      <div className="col-2" data-cy="sort-by-label">
        Sort by
      </div>
      <div className="col-4 py-3 select-column-field" data-cy="select-column-field">
        <Select
          useMenuPortal={false}
          placeholder="Select column"
          value={column}
          options={displayColumns}
          onChange={handleColumnChange}
        />
      </div>
      <div className="col-4 py-3 select-order-field" data-cy="select-order-field">
        <Select
          useMenuPortal={false}
          value={order}
          placeholder="Select order"
          options={orders}
          onChange={handleFilterChange}
        />
      </div>
      <div className="col-1 py-3 cursor-pointer" data-cy="delete-icon" onClick={() => handleDelete()}>
        <SolidIcon name="trash" fill="#E54D2E" width="14" />
      </div>
    </div>
  );
};
