import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { SortForm } from '../Forms/SortForm';
import { pluralize } from '@/_helpers/utils';
import { isEmpty } from 'lodash';
import { useMounted } from '@/_hooks/use-mount';

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
    <Popover id="storage-filter-popover" className={cx({ 'theme-dark': darkMode })}>
      <Popover.Content bsPrefix="storage-filter-popover">
        <div className="card-body">
          {Object.values(filters).map((filter, index) => {
            return (
              <SortForm {...filter} key={index} filters={filters} index={filterKeys[index]} setFilters={setFilters} />
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
          &nbsp;Add another
        </div>
      </Popover.Content>
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
    >
      <button className={cx('btn border-0', { 'bg-light-green': areFiltersApplied })}>
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.19591 1.02241C3.45626 0.762061 3.87837 0.762061 4.13872 1.02241L6.80539 3.68908C7.06574 3.94943 7.06574 4.37154 6.80539 4.63189C6.54504 4.89224 6.12293 4.89224 5.86258 4.63189L4.33398 3.10329V10.8271C4.33398 11.1953 4.03551 11.4938 3.66732 11.4938C3.29913 11.4938 3.00065 11.1953 3.00065 10.8271V3.10329L1.47206 4.63189C1.21171 4.89224 0.789596 4.89224 0.529247 4.63189C0.268897 4.37154 0.268897 3.94943 0.529247 3.68908L3.19591 1.02241ZM10.334 0.827148C10.7022 0.827148 11.0007 1.12563 11.0007 1.49382V9.21767L12.5292 7.68908C12.7896 7.42873 13.2117 7.42873 13.4721 7.68908C13.7324 7.94943 13.7324 8.37154 13.4721 8.63189L10.8054 11.2986C10.545 11.5589 10.1229 11.5589 9.86258 11.2986L7.19591 8.63189C6.93556 8.37154 6.93556 7.94943 7.19591 7.68908C7.45626 7.42873 7.87837 7.42873 8.13872 7.68908L9.66732 9.21767V1.49382C9.66732 1.12563 9.96579 0.827148 10.334 0.827148Z"
            fill="#889096"
          />
        </svg>
        &nbsp;&nbsp;Sort
        {areFiltersApplied && (
          <span>ed by {pluralize(Object.values(filters).filter(checkIsFilterObjectEmpty).length, 'column')}</span>
        )}
      </button>
    </OverlayTrigger>
  );
};

export default Sort;
