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
      <ul
        className="pagination m-0"
        style={computedStyles}
      >
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
          <path
            stroke="none"
            d="M0 0h24v24H0z"
            fill="none"
          />
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
          <path
            stroke="none"
            d="M0 0h24v24H0z"
            fill="none"
          />
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
          <path
            stroke="none"
            d="M0 0h24v24H0z"
            fill="none"
          ></path>
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
          <path
            stroke="none"
            d="M0 0h24v24H0z"
            fill="none"
          ></path>
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
        <a
          style={{ cursor: 'pointer' }}
          className={`page-link ${darkMode && 'text-light'}`}
          onClick={handleOnClick}
        >
          {getOperator(operator)}
        </a>
      </li>
    </React.Fragment>
  );
};

const PageLinks = ({ currentPage, totalPages, callback, darkMode }) => {
  return Array.from(Array(totalPages).keys()).map((index) => {
    const pageNumber = index + 1;
    return (
      <li
        key={pageNumber}
        onClick={() => callback(pageNumber)}
        className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
      >
        <a className={`page-link ${darkMode && 'text-light'}`}>{pageNumber}</a>
      </li>
    );
  });
};

Pagination.Operator = Operator;
Pagination.PageLinks = PageLinks;
