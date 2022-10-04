import React, { useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import SortableList, { SortableItem, SortableKnob } from 'react-easy-sort';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import Select from 'react-select';
import PostgrestFilterBuilder from '../../_helpers/postgrest-filter-builder';

const Form = ({ filters, setFilters, index, column = '', operator = '', value = '' }) => {
  const columns = [
    { value: 'name', label: 'Name' },
    { value: 'class', label: 'Class' },
    { value: 'age', label: 'Age' },
  ];

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

  return (
    <div className="row g-2 align-items-center">
      <div className="col-3 py-3">
        <Select value={column} options={columns} onChange={handleColumnChange} />
      </div>
      <div className="col-3 py-3">
        <Select value={operator} options={operators} onChange={handleFilterChange} />
      </div>
      <div className="col-3 py-3">
        <input value={value} type="text" className="form-control" placeholder="Value" onChange={handleInputChange} />
      </div>
      <div className="col-1 py-3">
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
      <div className="col-1 py-3">
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
    const postgrestFilterBuilder = new PostgrestFilterBuilder();

    keys.map((key) => {
      const { column, operator, value } = filters[key];
      if (keys.length === 1) {
        if (column && operator && value) {
          query = query[operator](column, value);
        }
      } else {
        // TODO: add more cases;
        postgrestFilterBuilder[operator](column, value);
      }
    });

    if (postgrestFilterBuilder.url.toString() !== '') {
      query = query.or(postgrestFilterBuilder.url.toString());
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
          className="card-footer"
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
        <button onClick={handleClick} className="btn btn-outline">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.16668 9.26661C5.97779 9.26661 5.81946 9.20272 5.69168 9.07494C5.5639 8.94716 5.50001 8.78883 5.50001 8.59994C5.50001 8.41105 5.5639 8.2555 5.69168 8.13328C5.81946 8.01105 5.97779 7.94994 6.16668 7.94994H7.83334C8.02223 7.94994 8.18057 8.01383 8.30834 8.14161C8.43612 8.26939 8.50001 8.42216 8.50001 8.59994C8.50001 8.78883 8.43612 8.94716 8.30834 9.07494C8.18057 9.20272 8.02223 9.26661 7.83334 9.26661H6.16668ZM1.50001 2.04994C1.31112 2.04994 1.15279 1.98605 1.02501 1.85828C0.897232 1.7305 0.833344 1.57772 0.833344 1.39994C0.833344 1.21105 0.897232 1.05272 1.02501 0.924943C1.15279 0.797165 1.31112 0.733276 1.50001 0.733276H12.5C12.6889 0.733276 12.8472 0.797165 12.975 0.924943C13.1028 1.05272 13.1667 1.21105 13.1667 1.39994C13.1667 1.58883 13.1028 1.74439 12.975 1.86661C12.8472 1.98883 12.6889 2.04994 12.5 2.04994H1.50001ZM3.50001 5.66661C3.31112 5.66661 3.15279 5.60272 3.02501 5.47494C2.89723 5.34717 2.83334 5.18883 2.83334 4.99994C2.83334 4.81105 2.89723 4.65272 3.02501 4.52494C3.15279 4.39717 3.31112 4.33328 3.50001 4.33328H10.5C10.6889 4.33328 10.8472 4.39717 10.975 4.52494C11.1028 4.65272 11.1667 4.81105 11.1667 4.99994C11.1667 5.18883 11.1028 5.34717 10.975 5.47494C10.8472 5.60272 10.6889 5.66661 10.5 5.66661H3.50001Z"
              fill="#5F81FF"
            />
          </svg>
          &nbsp;Filter
        </button>
      </OverlayTrigger>
    </>
  );
};

export default Filter;
