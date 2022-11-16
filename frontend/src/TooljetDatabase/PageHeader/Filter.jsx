import React, { useState, useContext } from 'react';
// eslint-disable-next-line import/no-unresolved
import SortableList, { SortableItem, SortableKnob } from 'react-easy-sort';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import Select from 'react-select';
import { TooljetDatabaseContext } from '../index';
import PostgrestQueryBuilder from '../../_helpers/postgrestQueryBuilder';

const Form = ({ filters, setFilters, index, column = '', operator = '', value = '' }) => {
  const { columns } = useContext(TooljetDatabaseContext);

  const operators = [
    { value: 'not', label: 'Not' },
    { value: 'eq', label: 'Eq' },
    { value: 'neq', label: 'Neq' },
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

  const handleInputChange = (event) => {
    setFilters((prevFilters) => {
      prevFilters[index].value = event.target.value;
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
      <div className="col-3 py-3">
        <Select placeholder="Select column" value={column} options={displayColumns} onChange={handleColumnChange} />
      </div>
      <div className="col-3 py-3">
        <Select placeholder="Select operation" value={operator} options={operators} onChange={handleFilterChange} />
      </div>
      <div className="col-3 py-3">
        <input value={value} type="text" className="form-control" placeholder="Value" onChange={handleInputChange} />
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
      <div className="col-1 py-3 cursor-pointer">
        <SortableKnob>
          <svg width="12" height="5" viewBox="0 0 12 5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1.51237 1.68734C1.32348 1.68734 1.16515 1.62345 1.03737 1.49567C0.909592 1.36789 0.845703 1.20956 0.845703 1.02067C0.845703 0.831782 0.909592 0.673449 1.03737 0.545671C1.16515 0.417893 1.32348 0.354004 1.51237 0.354004H11.179C11.3679 0.354004 11.5263 0.420671 11.654 0.554004C11.7818 0.687337 11.8457 0.848448 11.8457 1.03734C11.8457 1.21511 11.7818 1.36789 11.654 1.49567C11.5263 1.62345 11.3679 1.68734 11.179 1.68734H1.51237ZM1.51237 4.004C1.32348 4.004 1.16515 3.94011 1.03737 3.81234C0.909592 3.68456 0.845703 3.52623 0.845703 3.33734C0.845703 3.15956 0.909592 3.00678 1.03737 2.879C1.16515 2.75123 1.32348 2.68734 1.51237 2.68734H11.179C11.3679 2.68734 11.5263 2.75123 11.654 2.879C11.7818 3.00678 11.8457 3.16511 11.8457 3.354C11.8457 3.54289 11.7818 3.69845 11.654 3.82067C11.5263 3.94289 11.3679 4.004 11.179 4.004H1.51237Z"
              fill="#A4ACB8"
            />
          </svg>
        </SortableKnob>
      </div>
    </div>
  );
};

const Filter = ({ query }) => {
  const defaults = { 0: {} };
  const [show, setShow] = useState(false);
  const [filters, setFilters] = useState(defaults);

  const handleClick = () => {
    setShow(!show);
  };

  const handleBuildQuery = () => {
    const keys = Object.keys(filters);
    if (keys.length === 0) return;
    const postgrestQueryBuilder = new PostgrestQueryBuilder();

    keys.map((key) => {
      const { column, operator, value } = filters[key];
      if (keys.length === 1) {
        if (column && operator && value) {
          query = query[operator](column, value);
        }
      } else {
        // TODO: add more cases;
        postgrestQueryBuilder[operator](column, value);
      }
    });

    if (postgrestQueryBuilder.url.toString() !== '') {
      query = query.or(postgrestQueryBuilder.url.toString());
    }
  };

  const onSortEnd = (oldIndex, newIndex) => {
    const prevFilters = { ...filters };
    prevFilters[oldIndex] = filters[newIndex];
    prevFilters[newIndex] = filters[oldIndex];
    setFilters(prevFilters);
  };

  const popover = (
    <Popover id="storage-filter-popover">
      <Popover.Content bsPrefix="storage-filter-popover">
        <div className="card-body">
          <SortableList onSortEnd={onSortEnd} draggedItemClassName="dragged-column">
            {Object.keys(filters).map((filter, index) => {
              return (
                <SortableItem key={index}>
                  <div>
                    <Form {...filter} filters={filters} index={index} setFilters={setFilters} />
                  </div>
                </SortableItem>
              );
            })}
          </SortableList>
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
          &nbsp;Add Condition
        </div>
      </Popover.Content>
    </Popover>
  );

  return (
    <>
      <OverlayTrigger trigger="click" onHide={handleBuildQuery} placement="bottom" overlay={popover}>
        <button onClick={handleClick} className="btn no-border">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.44676 0.864716C1.51766 0.83985 1.59225 0.827148 1.66739 0.827148H10.3341C10.4092 0.827148 10.4838 0.83985 10.5547 0.864716C10.7467 0.932061 10.9208 1.04246 11.0635 1.18747C11.2063 1.33247 11.314 1.50823 11.3783 1.70128C11.4427 1.89432 11.462 2.09954 11.4348 2.3012C11.4076 2.50287 11.3346 2.69563 11.2214 2.86472C11.2031 2.89202 11.1828 2.91794 11.1607 2.94226L8.00072 6.41822V10.8271C8.00072 11.0797 7.85805 11.3105 7.6322 11.4234C7.40634 11.5364 7.13607 11.512 6.93406 11.3605L4.26739 9.36048C4.09952 9.23458 4.00072 9.03699 4.00072 8.82715V6.41822L0.840763 2.94226C0.818655 2.91795 0.798376 2.89202 0.780091 2.86472C0.666878 2.69563 0.593872 2.50287 0.566662 2.3012C0.539452 2.09954 0.55876 1.89433 0.62311 1.70128C0.687459 1.50823 0.795141 1.33247 0.937907 1.18747C1.08067 1.04246 1.25473 0.93206 1.44676 0.864716ZM1.932 2.16048L5.16068 5.71203C5.27224 5.83475 5.33406 5.99464 5.33406 6.16048V8.49381L6.66739 9.49381V6.16048C6.66739 5.99464 6.7292 5.83475 6.84076 5.71203L10.0694 2.16048H1.932Z"
              fill="#889096"
            />
          </svg>
          &nbsp;&nbsp;Filter
        </button>
      </OverlayTrigger>
    </>
  );
};

export default Filter;
