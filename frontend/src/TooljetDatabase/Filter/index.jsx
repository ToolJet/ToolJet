import React, { useState } from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FilterForm } from '../Forms/FilterForm';
import { isEmpty } from 'lodash';
import { pluralize } from '@/_helpers/utils';

const Filter = ({ onClose }) => {
  const [filters, setFilters] = useState({ 0: {} });
  const [show, setShow] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const filterKeys = Object.keys(filters);
  const popover = (
    <Popover id="storage-filter-popover" className={cx({ 'theme-dark': darkMode })}>
      <Popover.Content bsPrefix="storage-filter-popover">
        <div className="card-body">
          {Object.values(filters).map((filter, index) => {
            return (
              <div key={index}>
                <FilterForm {...filter} filters={filters} index={filterKeys[index]} setFilters={setFilters} />
              </div>
            );
          })}
        </div>
        <div
          className="card-footer cursor-pointer"
          onClick={() =>
            setFilters((prevFilters) => ({ ...prevFilters, [+Object.keys(prevFilters).pop() + 1 || 0]: {} }))
          }
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

  const checkIsFilterObjectEmpty = (filter) =>
    !isEmpty(filter.column) && !isEmpty(filter.operator) && !isEmpty(filter.value);
  const areFiltersApplied = !show && Object.values(filters).some(checkIsFilterObjectEmpty);

  return (
    <>
      <OverlayTrigger
        rootClose
        trigger="click"
        show={show}
        onToggle={(show) => {
          if (!show) onClose(filters);
          if (show && isEmpty(filters)) setFilters({ 0: {} });
          setShow(show);
        }}
        placement="bottom"
        overlay={popover}
      >
        <button className={cx('btn border-0', { 'bg-light-green': areFiltersApplied })}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.44676 0.864716C1.51766 0.83985 1.59225 0.827148 1.66739 0.827148H10.3341C10.4092 0.827148 10.4838 0.83985 10.5547 0.864716C10.7467 0.932061 10.9208 1.04246 11.0635 1.18747C11.2063 1.33247 11.314 1.50823 11.3783 1.70128C11.4427 1.89432 11.462 2.09954 11.4348 2.3012C11.4076 2.50287 11.3346 2.69563 11.2214 2.86472C11.2031 2.89202 11.1828 2.91794 11.1607 2.94226L8.00072 6.41822V10.8271C8.00072 11.0797 7.85805 11.3105 7.6322 11.4234C7.40634 11.5364 7.13607 11.512 6.93406 11.3605L4.26739 9.36048C4.09952 9.23458 4.00072 9.03699 4.00072 8.82715V6.41822L0.840763 2.94226C0.818655 2.91795 0.798376 2.89202 0.780091 2.86472C0.666878 2.69563 0.593872 2.50287 0.566662 2.3012C0.539452 2.09954 0.55876 1.89433 0.62311 1.70128C0.687459 1.50823 0.795141 1.33247 0.937907 1.18747C1.08067 1.04246 1.25473 0.93206 1.44676 0.864716ZM1.932 2.16048L5.16068 5.71203C5.27224 5.83475 5.33406 5.99464 5.33406 6.16048V8.49381L6.66739 9.49381V6.16048C6.66739 5.99464 6.7292 5.83475 6.84076 5.71203L10.0694 2.16048H1.932Z"
              fill="#889096"
            />
          </svg>
          &nbsp;&nbsp;Filter
          {areFiltersApplied && (
            <span>ed by {pluralize(Object.values(filters).filter(checkIsFilterObjectEmpty).length, 'column')}</span>
          )}
        </button>
      </OverlayTrigger>
    </>
  );
};

export default Filter;
