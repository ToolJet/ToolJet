import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { SortForm } from '../Forms/SortForm';
import { pluralize } from '@/_helpers/utils';
import { isEmpty } from 'lodash';
import { useMounted } from '@/_hooks/use-mount';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const Sort = ({ filters, setFilters, handleBuildSortQuery, resetSortQuery }) => {
  const [show, setShow] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const filterKeys = Object.keys(filters);

  const isMounted = useMounted();

  const reset = () => {
    setFilters({});
    setShow(false);
  };

  useEffect(() => {
    if (Object.keys(filters).length === 0 && isMounted) {
      reset();
      resetSortQuery();
    } else {
      Object.keys(filters).map((key) => {
        if (!isEmpty(filters[key])) {
          const { column, order } = filters[key];
          if (!isEmpty(column) && !isEmpty(order)) {
            handleBuildSortQuery(filters);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const popover = (
    <Popover id="storage-sort-popover" className={cx({ 'theme-dark dark-theme': darkMode })} data-cy="sort-section">
      <Popover.Body bsPrefix="storage-filter-popover">
        <div className="card-body" data-cy="sort-card-body">
          {Object.values(filters).map((filter, index) => {
            return (
              <SortForm {...filter} key={index} filters={filters} index={filterKeys[index]} setFilters={setFilters} />
            );
          })}
        </div>
        <div
          className="card-footer cursor-pointer"
          data-cy="sort-card-footer"
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
            data-cy="add-another-condition-link"
          >
            <path
              d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
              fill="#466BF2"
            />
          </svg>
          &nbsp;Add another
        </div>
      </Popover.Body>
    </Popover>
  );

  const checkIsFilterObjectEmpty = (filter) => !isEmpty(filter.column) && !isEmpty(filter.order);
  const areFiltersApplied = !show && Object.values(filters).some(checkIsFilterObjectEmpty);

  return (
    <OverlayTrigger
      rootClose
      onToggle={(show) => {
        if (show && isEmpty(filters)) setFilters({ 0: {} });
        setShow(show);
      }}
      show={show}
      trigger="click"
      placement="bottom"
      overlay={popover}
      className="sort-overlay-wrapper"
    >
      <button
        className={cx('border-0 tj-db-sort-btn tj-text-xsm font-weight-500 ghost-black-operation', {
          'tj-db-sort-btn-applied': areFiltersApplied,
          'tj-db-sort-btn-active': show,
        })}
        data-cy="sort-button"
      >
        <SolidIcon
          name="arrowsortrectangle"
          width="14"
          fill={areFiltersApplied ? '#46A758' : show ? '#3E63DD' : '#889096'}
        />
        &nbsp;&nbsp;Sort
        {areFiltersApplied && (
          <span>ed by {pluralize(Object.values(filters).filter(checkIsFilterObjectEmpty).length, 'column')}</span>
        )}
      </button>
    </OverlayTrigger>
  );
};

export default Sort;
