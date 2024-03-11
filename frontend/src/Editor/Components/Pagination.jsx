import React, { useState, useEffect } from 'react';

export const Pagination = ({
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  fireEvent,
  darkMode,
  dataCy,
  width,
}) => {
  const { visibility, disabledState, boxShadow } = styles;
  const [currentPage, setCurrentPage] = useState(() => properties?.defaultPageIndex ?? 1);

  useEffect(() => {
    if (exposedVariables.currentPageIndex === null) setExposedVariable('currentPageIndex', currentPage);

    if (exposedVariables.totalPages === null) setExposedVariable('totalPages', properties.numberOfPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exposedVariables]);

  const pageChanged = (number) => {
    setCurrentPage(number);
    setExposedVariable('currentPageIndex', number);
    fireEvent('onPageChange');
  };

  function gotoPage(page) {
    pageChanged(page);
  }

  function gotoFirstPage() {
    pageChanged(1);
  }

  function gotoLastPage() {
    pageChanged(properties.numberOfPages);
  }

  function gotoNextPage() {
    gotoPage(currentPage + 1);
  }

  function gotoPreviousPage() {
    gotoPage(currentPage - 1);
  }

  useEffect(() => {
    if (properties.defaultPageIndex) {
      pageChanged(properties.defaultPageIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.defaultPageIndex]);

  useEffect(() => {
    setExposedVariable('totalPages', properties.numberOfPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.numberOfPages]);

  const computedStyles = {
    height,
    display: visibility ? 'flex' : 'none',
  };

  return (
    <div
      data-disabled={disabledState}
      className="d-flex align-items-center px-1"
      data-cy={dataCy}
      style={{ boxShadow }}
    >
      <ul className="pagination m-0" style={computedStyles}>
        <Pagination.Operator
          operator="<<"
          currentPage={currentPage}
          totalPages={properties.numberOfPages}
          handleOnClick={gotoFirstPage}
          darkMode={darkMode}
        />
        <Pagination.Operator
          operator="<"
          currentPage={currentPage}
          totalPages={properties.numberOfPages}
          handleOnClick={gotoPreviousPage}
          darkMode={darkMode}
        />
        <Pagination.PageLinks
          currentPage={currentPage}
          totalPages={properties.numberOfPages}
          callback={gotoPage}
          darkMode={darkMode}
          width={width}
        />
        <Pagination.Operator
          operator=">"
          currentPage={currentPage}
          totalPages={properties.numberOfPages}
          handleOnClick={gotoNextPage}
          darkMode={darkMode}
        />
        <Pagination.Operator
          operator=">>"
          currentPage={currentPage}
          totalPages={properties.numberOfPages}
          handleOnClick={gotoLastPage}
          darkMode={darkMode}
        />
      </ul>
    </div>
  );
};

/**
 * ? Operator
 * ">>" right-shift operator.
 * "<<" left-shift operator.
 * "<"  less-than operator
 * ">"  greater-than operator
 */

function getOperator(operator) {
  switch (operator) {
    case '<<':
      return (
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
      );

    case '>>':
      return (
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
      );

    case '<':
      return (
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
      );

    case '>':
      return (
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
      );

    default:
      break;
  }
}

const Operator = ({ operator, currentPage, totalPages, handleOnClick, darkMode }) => {
  const getDisableCls = (operator, currentPage, totalPages) => {
    if (operator == '<<' || operator == '<') {
      return currentPage === 1 ? 'disabled' : '';
    } else {
      return currentPage === totalPages ? 'disabled' : '';
    }
  };
  return (
    <React.Fragment>
      <li className={`page-item ${getDisableCls(operator, currentPage, totalPages)}`}>
        <a style={{ cursor: 'pointer' }} className={`page-link ${darkMode && 'text-light'}`} onClick={handleOnClick}>
          {getOperator(operator)}
        </a>
      </li>
    </React.Fragment>
  );
};

const PageLinks = ({ currentPage, totalPages, callback, darkMode, width }) => {
  // Define constants for page number width and operator width
  const ELEMENT_WIDTH = 28;

  // Calculate the maximum number of visible pages
  const containerWidth = width; // Width of the container
  const maxVisiblePages = Math.floor((containerWidth - 5 * ELEMENT_WIDTH) / ELEMENT_WIDTH);

  // Ensure that the first and last page numbers are always displayed
  let startPage = 1;
  let endPage = totalPages;

  // Calculate the number of pages to show on each side of the current page
  let numPagesToShowOnEachSide = Math.floor((maxVisiblePages - 3) / 2);

  // If the total number of pages is less than the maximum visible pages
  if (totalPages <= maxVisiblePages) {
    numPagesToShowOnEachSide = Math.floor((totalPages - 3) / 2);
  }

  // Calculate the start and end of the range of middle pages to display
  let startMiddlePage = currentPage - numPagesToShowOnEachSide;
  let endMiddlePage = currentPage + numPagesToShowOnEachSide;

  // Adjust the range if it goes out of bounds
  if (startMiddlePage < startPage + 1) {
    endMiddlePage += startPage + 1 - startMiddlePage;
    startMiddlePage = startPage + 1;
  }
  if (endMiddlePage > endPage - 1) {
    startMiddlePage -= endMiddlePage - (endPage - 1);
    endMiddlePage = endPage - 1;
  }

  // Render the page numbers with ellipsis
  const pageNumbers = [];
  if (totalPages > 1) {
    pageNumbers.push(
      <li
        key={startPage}
        onClick={() => callback(startPage)}
        className={`page-item ${currentPage === startPage ? 'active' : ''}`}
      >
        <a className={`page-link ${darkMode && 'text-light'}`}>{startPage}</a>
      </li>
    );

    // Display ellipsis only if there are more than two pages
    if (totalPages > 2) {
      pageNumbers.push(
        <li key="start-ellipsis" className="page-item disabled">
          <span className="page-link">...</span>
        </li>
      );
    }

    // Render middle pages
    for (let i = startMiddlePage; i <= endMiddlePage; i++) {
      pageNumbers.push(
        <li key={i} onClick={() => callback(i)} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <a className={`page-link ${darkMode && 'text-light'}`}>{i}</a>
        </li>
      );
    }

    // Display ellipsis only if there are more than two pages
    if (totalPages > 2) {
      pageNumbers.push(
        <li key="end-ellipsis" className="page-item disabled">
          <span className="page-link">...</span>
        </li>
      );
    }

    pageNumbers.push(
      <li
        key={endPage}
        onClick={() => callback(endPage)}
        className={`page-item ${currentPage === endPage ? 'active' : ''}`}
      >
        <a className={`page-link ${darkMode && 'text-light'}`}>{endPage}</a>
      </li>
    );
  }

  return <React.Fragment>{pageNumbers}</React.Fragment>;
};

Pagination.Operator = Operator;
Pagination.PageLinks = PageLinks;
