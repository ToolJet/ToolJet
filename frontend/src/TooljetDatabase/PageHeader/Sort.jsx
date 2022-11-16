import React, { useState, useContext } from 'react';
// eslint-disable-next-line import/no-unresolved
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import Select from 'react-select';
import { TooljetDatabaseContext } from '../index';

const Form = ({ filters, setFilters, index, column = '', order = '' }) => {
  const { columns } = useContext(TooljetDatabaseContext);

  const orders = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];

  const handleColumnChange = (selectedOption) => {
    const prevFilters = { ...filters };
    prevFilters[index].column = selectedOption.value;

    setFilters(prevFilters);
  };

  const handleFilterChange = (selectedOption) => {
    setFilters((prevFilters) => {
      prevFilters[index].operator = selectedOption.value;
      return prevFilters;
    });
  };

  const handleDelete = () => {
    const prevFilters = { ...filters };
    delete prevFilters[index];
    setFilters(prevFilters);
  };

  const displayColumns = columns.map(({ accessor }) => ({ value: accessor, label: accessor }));

  return (
    <div className="row g-2 align-items-center">
      <div className="col-2">Sort by</div>
      <div className="col-4 py-3">
        <Select placeholder="Select column" value={column} options={displayColumns} onChange={handleColumnChange} />
      </div>
      <div className="col-4 py-3">
        <Select placeholder="Select order" value={order} options={orders} onChange={handleFilterChange} />
      </div>
      <div className="col-1 py-3 cursor-pointer">
        <svg
          onClick={handleDelete}
          width="13"
          height="14"
          viewBox="0 0 13 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.61247 13.421C2.25691 13.421 1.94858 13.2904 1.68747 13.0293C1.42636 12.7682 1.2958 12.4599 1.2958 12.1043V2.771H1.11247C0.923579 2.771 0.765245 2.70711 0.637467 2.57933C0.50969 2.45155 0.445801 2.29322 0.445801 2.10433C0.445801 1.91544 0.50969 1.75711 0.637467 1.62933C0.765245 1.50155 0.923579 1.43766 1.11247 1.43766H3.9958C3.9958 1.24877 4.05969 1.09044 4.18747 0.962663C4.31524 0.834885 4.47358 0.770996 4.66247 0.770996H8.02913C8.21802 0.770996 8.37913 0.837663 8.51247 0.970996C8.6458 1.10433 8.71247 1.25988 8.71247 1.43766H11.5791C11.768 1.43766 11.9264 1.50155 12.0541 1.62933C12.1819 1.75711 12.2458 1.91544 12.2458 2.10433C12.2458 2.29322 12.1819 2.45155 12.0541 2.57933C11.9264 2.70711 11.768 2.771 11.5791 2.771H11.3958V12.1043C11.3958 12.4599 11.2652 12.7682 11.0041 13.0293C10.743 13.2904 10.4347 13.421 10.0791 13.421H2.61247ZM2.61247 2.771V12.1043H10.0791V2.771H2.61247ZM4.3458 10.171C4.3458 10.3266 4.40136 10.4599 4.51247 10.571C4.62358 10.6821 4.75691 10.7377 4.91247 10.7377C5.07913 10.7377 5.21802 10.6821 5.32913 10.571C5.44025 10.4599 5.4958 10.3266 5.4958 10.171V4.68766C5.4958 4.521 5.43747 4.37933 5.3208 4.26266C5.20413 4.146 5.06802 4.08766 4.91247 4.08766C4.7458 4.08766 4.60969 4.146 4.50413 4.26266C4.39858 4.37933 4.3458 4.521 4.3458 4.68766V10.171ZM7.1958 10.171C7.1958 10.3266 7.25413 10.4599 7.3708 10.571C7.48747 10.6821 7.62358 10.7377 7.77913 10.7377C7.9458 10.7377 8.08469 10.6821 8.1958 10.571C8.30691 10.4599 8.36247 10.3266 8.36247 10.171V4.68766C8.36247 4.521 8.30413 4.37933 8.18747 4.26266C8.0708 4.146 7.93469 4.08766 7.77913 4.08766C7.61247 4.08766 7.47358 4.146 7.36247 4.26266C7.25136 4.37933 7.1958 4.521 7.1958 4.68766V10.171ZM2.61247 2.771V12.1043V2.771Z"
            fill="#A4ACB8"
          />
        </svg>
      </div>
    </div>
  );
};

const Sort = ({ query }) => {
  const defaults = { 0: {} };
  const [show, setShow] = useState(false);
  const [filters, setFilters] = useState(defaults);

  const handleClick = () => {
    setShow(!show);
  };

  const handleBuildQuery = () => {
    const keys = Object.keys(filters);
    if (keys.length === 0) return;

    keys.map((key) => {
      const { column, order } = filters[key];
      query = query.order(column, { ascending: order === 'asc', descending: order === 'desc' });
    });
  };

  const popover = (
    <Popover id="storage-filter-popover">
      <Popover.Content bsPrefix="storage-filter-popover">
        <div className="card-body">
          {Object.keys(filters).map((filter, index) => {
            return <Form {...filter} key={index} filters={filters} index={index} setFilters={setFilters} />;
          })}
        </div>
        <div
          className="card-footer cursor-pointer"
          onClick={() => setFilters((prevFilters) => ({ ...prevFilters, [Object.keys(prevFilters).length]: defaults }))}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
              fill="#466BF2"
            />
          </svg>
          &nbsp;Add another
        </div>
      </Popover.Content>
    </Popover>
  );

  return (
    <>
      <OverlayTrigger trigger="click" onHide={handleBuildQuery} placement="bottom" overlay={popover}>
        <button onClick={handleClick} className="btn no-border">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.19591 1.02241C3.45626 0.762061 3.87837 0.762061 4.13872 1.02241L6.80539 3.68908C7.06574 3.94943 7.06574 4.37154 6.80539 4.63189C6.54504 4.89224 6.12293 4.89224 5.86258 4.63189L4.33398 3.10329V10.8271C4.33398 11.1953 4.03551 11.4938 3.66732 11.4938C3.29913 11.4938 3.00065 11.1953 3.00065 10.8271V3.10329L1.47206 4.63189C1.21171 4.89224 0.789596 4.89224 0.529247 4.63189C0.268897 4.37154 0.268897 3.94943 0.529247 3.68908L3.19591 1.02241ZM10.334 0.827148C10.7022 0.827148 11.0007 1.12563 11.0007 1.49382V9.21767L12.5292 7.68908C12.7896 7.42873 13.2117 7.42873 13.4721 7.68908C13.7324 7.94943 13.7324 8.37154 13.4721 8.63189L10.8054 11.2986C10.545 11.5589 10.1229 11.5589 9.86258 11.2986L7.19591 8.63189C6.93556 8.37154 6.93556 7.94943 7.19591 7.68908C7.45626 7.42873 7.87837 7.42873 8.13872 7.68908L9.66732 9.21767V1.49382C9.66732 1.12563 9.96579 0.827148 10.334 0.827148Z"
              fill="#889096"
            />
          </svg>
          &nbsp;&nbsp;Sort
        </button>
      </OverlayTrigger>
    </>
  );
};

export default Sort;
