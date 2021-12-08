import React from 'react';

export const Pagination = function Pagination({
  currentPage,
  count,
  totalPages,
  pageChanged,
  perPage = 10,
  queryParams = {},
}) {
  function renderPageItem(i) {
    return (
      <li onClick={() => gotoPage(i + 1)} key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
        <a className="page-link">{i + 1}</a>
      </li>
    );
  }

  function gotoPage(page) {
    pageChanged(page, perPage, queryParams);
  }

  function gotoNextPage() {
    gotoPage(currentPage + 1);
  }

  function gotoPreviousPage() {
    gotoPage(currentPage - 1);
  }

  function startingCount(currentPage) {
    return (currentPage - 1) * perPage + 1;
  }

  function endingCount(currentPage, totalCount) {
    const num = currentPage * perPage;

    return num > totalCount ? totalCount : num;
  }

  return (
    <div className="card-footer d-flex align-items-center px-1">
      <p className="m-0 text-muted">
        Showing <span>{startingCount(currentPage)}</span> to <span>{endingCount(currentPage, count)}</span> of{' '}
        <span>{count}</span>
      </p>
      <ul className="pagination m-0 ms-auto">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <a style={{ cursor: 'pointer' }} className="page-link" onClick={gotoPreviousPage}>
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
        {Array.from(Array(totalPages).keys()).map((i) => renderPageItem(i))}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <a style={{ cursor: 'pointer' }} className="page-link" onClick={gotoNextPage}>
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
      </ul>
    </div>
  );
};
