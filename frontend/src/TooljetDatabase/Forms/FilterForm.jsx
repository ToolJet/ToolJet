import React, { useContext } from 'react';
import Select from 'react-select';
import { TooljetDatabaseContext } from '../index';

export const FilterForm = ({ filters, setFilters, index, column = '', operator = '', value = '' }) => {
  const { columns } = useContext(TooljetDatabaseContext);

  const operators = [
    { value: 'not', label: 'Not' },
    { value: 'eq', label: 'Eq' },
    { value: 'neq', label: 'Neq' },
  ];

  const handleColumnChange = ({ value }) => {
    const prevFilters = { ...filters };
    prevFilters[index].column = value;

    setFilters(prevFilters);
  };

  const handleOperatorChange = ({ value }) => {
    const prevFilters = { ...filters };
    prevFilters[index].operator = value;

    setFilters(prevFilters);
  };

  const handleValueChange = (event) => {
    const prevFilters = { ...filters };
    prevFilters[index].value = event.target.value;

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
      <div className="col-3 py-3">
        <Select
          placeholder="Select column"
          value={displayColumns.find((d) => d.value === column)}
          options={displayColumns}
          onChange={handleColumnChange}
        />
      </div>
      <div className="col-3 py-3">
        <Select
          placeholder="Select operation"
          value={operators.find((d) => d.value === operator)}
          options={operators}
          onChange={handleOperatorChange}
        />
      </div>
      <div className="col-3 py-3">
        <input value={value} type="text" className="form-control" placeholder="Value" onChange={handleValueChange} />
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
