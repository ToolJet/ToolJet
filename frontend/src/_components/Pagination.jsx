import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const Pagination = function Pagination({
  currentPage,
  count,
  pageChanged,
  itemsPerPage = 10,
  queryParams = {},
  darkMode,
}) {
  const { t } = useTranslation();
  const totalPages = useMemo(() => {
    return Math.floor((count - 1) / itemsPerPage) + 1;
  }, [count, itemsPerPage]);
  const getPageLinks = (index) => {
    if (index < 1 || index > totalPages) {
      return;
    } else {
      return (
        <li
          key={index}
          onClick={() => gotoPage(index)}
          className={`page-item ${currentPage === index ? 'active' : ''}`}
        >
          <a className="page-link">{index}</a>
        </li>
      );
    }
  };
  if (currentPage > totalPages) {
    currentPage = totalPages;
    pageChanged(currentPage);
  }
  function gotoPage(page) {
    pageChanged(page, itemsPerPage, queryParams);
  }

  function gotoFirstPage() {
    pageChanged(1, itemsPerPage, queryParams);
  }

  function gotoLastPage() {
    pageChanged(totalPages, itemsPerPage, queryParams);
  }

  function gotoNextPage() {
    gotoPage(currentPage + 1);
  }

  function gotoPreviousPage() {
    gotoPage(currentPage - 1);
  }

  function startingAppCount() {
    return (currentPage - 1) * itemsPerPage + 1;
  }

  function endingAppCount() {
    const num = currentPage * itemsPerPage;

    return num > count ? count : num;
  }

  // These arrows are anchors without an href, so the browser gives them neither focus nor a name.
  const arrowProps = (label, onActivate) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    style: { cursor: 'pointer' },
    className: 'page-link',
    onClick: onActivate,
    onKeyDown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onActivate(event);
    },
  });

  return (
    <div
      className={`card-footer d-flex align-items-center ${darkMode ? ' bg-transparent' : ''}`}
      style={{ padding: '16px' }}
      data-cy="container-pagination"
    >
      <p className={`m-0 ${darkMode ? 'text-light' : 'text-muted'}`}>
        {t('homePage.pagination.showing', 'Showing')} <span>{startingAppCount()}</span>{' '}
        {t('homePage.pagination.to', 'to')} <span>{endingAppCount()}</span> {t('homePage.pagination.of', 'of')}{' '}
        <span data-cy="total-count">{count}</span>
      </p>
      <ul className="pagination m-0 ms-auto">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <a {...arrowProps('First page', gotoFirstPage)} data-cy="first-page-link">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <polyline points="11 7 6 12 11 17" />
              <polyline points="17 7 12 12 17 17" />
            </svg>
          </a>
        </li>
        <li data-testid="previous-0" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <a data-testid="previous" {...arrowProps('Previous page', gotoPreviousPage)} data-cy="previous-page-link">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <polyline points="15 6 9 12 15 18"></polyline>
            </svg>
          </a>
        </li>
        {getPageLinks(currentPage - 1)}
        {getPageLinks(currentPage)}
        {getPageLinks(currentPage + 1)}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <a data-testid="next" {...arrowProps('Next page', gotoNextPage)} data-cy="next-page-link">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <polyline points="9 6 15 12 9 18"></polyline>
            </svg>
          </a>
        </li>
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <a {...arrowProps('Last page', gotoLastPage)} data-cy="last-page-link">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <polyline points="7 7 12 12 7 17" />
              <polyline points="13 7 18 12 13 17" />
            </svg>
          </a>
        </li>
      </ul>
    </div>
  );
};
