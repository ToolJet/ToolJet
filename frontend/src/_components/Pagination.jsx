import React, { useMemo } from 'react';

export const Pagination = function Pagination({ currentPage, count, pageChanged, itemsPerPage = 10, darkMode }) {
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

  function gotoPage(page) {
    pageChanged(page);
  }

  function gotoFirstPage() {
    pageChanged(1);
  }

  function gotoLastPage() {
    pageChanged(totalPages);
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

  return (
    <div className="card-footer d-flex align-items-center px-1">
      <p className={`m-0 ${darkMode ? 'text-white-50' : 'text-muted'}`}>
        Showing <span>{startingAppCount()}</span> to <span>{endingAppCount()}</span> of <span>{count}</span>
      </p>
      <ul className="pagination m-0 ms-auto">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <a style={{ cursor: 'pointer' }} className="page-link" onClick={gotoFirstPage}>
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
        {getPageLinks(currentPage - 1)}
        {getPageLinks(currentPage)}
        {getPageLinks(currentPage + 1)}
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
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <a style={{ cursor: 'pointer' }} className="page-link" onClick={gotoLastPage}>
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
