import React, { useState } from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FilterForm } from '../Forms/FilterForm';
import { isEmpty } from 'lodash';
// import { pluralize } from '@/_helpers/utils';
import { useMounted } from '@/_hooks/use-mount';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const Filter = ({ filters, setFilters, handleBuildFilterQuery, resetFilterQuery }) => {
  const [show, setShow] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const filterKeys = Object.keys(filters);
  const isMounted = useMounted();

  const popover = (
    <Popover id="storage-filter-popover" className={cx({ 'dark-theme': darkMode })} data-cy="filter-section">
      <Popover.Body bsPrefix="storage-filter-popover">
        <div className="card-body" data-cy="filter-card-body">
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
          data-cy="filter-card-footer"
          onClick={() =>
            setFilters((prevFilters) => ({ ...prevFilters, [+Object.keys(prevFilters).pop() + 1 || 0]: {} }))
          }
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            data-cy="add-condition-link"
          >
            <path
              d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
              fill="#466BF2"
            />
          </svg>
          &nbsp;Add Condition
        </div>
      </Popover.Body>
    </Popover>
  );

  const checkIsFilterObjectEmpty = (filter) =>
    !isEmpty(filter.column) && !isEmpty(filter.operator) && !isEmpty(filter.value);
  const areFiltersApplied = !show && Object.values(filters).some(checkIsFilterObjectEmpty);

  React.useEffect(() => {
    if (Object.keys(filters).length === 0 && isMounted) {
      resetFilterQuery();
    } else {
      Object.keys(filters).map((key) => {
        if (!isEmpty(filters[key])) {
          const { column, operator, value } = filters[key];
          if (!isEmpty(column) && !isEmpty(operator) && !isEmpty(value)) {
            handleBuildFilterQuery(filters);
          }
        }
      });
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
          if (show && isEmpty(filters)) setFilters({ 0: {} });
          setShow(show);
        }}
        placement="bottom"
        overlay={popover}
      >
        <button
          data-cy="filter-button"
          className={cx('tj-db-filter-btn tj-text-xsm font-weight-500 ghost-black-operation', {
            'tj-db-filter-btn-applied': areFiltersApplied,
            'tj-db-filter-btn-active': show,
          })}
        >
          <SolidIcon name="filter" width="14" fill={areFiltersApplied ? '#46A758' : show ? '#3E63DD' : '#889096'} />
          &nbsp;&nbsp;Filter
          {/* {areFiltersApplied && (
            <span>ed by {pluralize(Object.values(filters).filter(checkIsFilterObjectEmpty).length, 'column')}</span>
          )} */}
        </button>
      </OverlayTrigger>
    </>
  );
};

export default Filter;
