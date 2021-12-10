import React, { useMemo } from 'react';

export const Pagination = function Pagination({ currentPage, count, pageChanged, itemsPerPage = 10 }) {
  const totalPages = useMemo(() => {
    return Math.floor(((count - 1) / itemsPerPage)) + 1;
  }, [count, itemsPerPage]);

  const pageArray = useMemo(() => {
    const array = new Array(totalPages)
    if (totalPages > 10) {
      array.fill(0);
    } else {
      array.fill(1);
    }
    array[0]++; // 1st Page
    array[1]++; // 2nd Page
    array[totalPages - 1]++; // last Page
    array[totalPages - 2]++; // second last Page
    array[currentPage - 2]++;
    array[currentPage - 1]++;
    array[currentPage]++;

    if (currentPage <= 4 || totalPages - currentPage < 4) {
      const middle = Math.floor(totalPages / 2)
      array[middle - 2]++;
      array[middle - 1]++;
      array[middle]++;
    }
    return array.slice(0, totalPages);
  }, [totalPages, currentPage]);

  const getPageLinks = () => {
    return pageArray.map((v, i) => {
      if (v > 0) {
        return (
          <li key={i} onClick={() => gotoPage(i + 1)} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
            <a className="page-link">{i + 1}</a>
          </li>
        )
      } else if (!v && pageArray[i - 1] > 0) {
        return '...'
      }
    });
  }

  function gotoPage(page) {
    pageChanged(page);
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
      <p className="m-0 text-muted">
        Showing <span>{startingAppCount()}</span> to <span>{endingAppCount()}</span> of{' '}
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
        {getPageLinks()}
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
