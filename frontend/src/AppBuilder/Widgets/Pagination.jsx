import React, { useState, useEffect, useRef } from 'react';

export const Pagination = ({
  id,
  height,
  properties,
  styles,
  setExposedVariable,
  fireEvent,
  darkMode,
  dataCy,
  width,
}) => {
  const isInitialRender = useRef(true);
  const { visibility, disabledState, boxShadow } = styles;
  const [currentPage, setCurrentPage] = useState(() => properties?.defaultPageIndex ?? 1);

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
      if (!isInitialRender.current) {
        pageChanged(properties.defaultPageIndex);
      } else {
        setCurrentPage(properties.defaultPageIndex);
        setExposedVariable('currentPageIndex', properties.defaultPageIndex);
        isInitialRender.current = false;
      }
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
    <div data-disabled={disabledState} className="d-flex align-items-center" data-cy={dataCy} style={{ boxShadow }}>
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
          containerWidth={width}
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

const PageLinks = ({ currentPage, totalPages, callback, darkMode, containerWidth }) => {
  const itemWidth = 28; // Width of each item

  const [maxItems, setMaxItems] = useState(0); // for max items that can fit in container

  useEffect(() => {
    if (!containerWidth || isNaN(totalPages) || totalPages <= 0) {
      return;
    }

    // Calculate the maximum number of items that can fit within the container width
    const availableWidth = containerWidth;
    const calculatedMaxItems = Math.floor(availableWidth / itemWidth);
    setMaxItems(calculatedMaxItems);
  }, [containerWidth, totalPages]);

  const renderPageNumbers = () => {
    const pageNumbers = [];

    // Calculate the number of page numbers that can fit, excluding arrows
    const maxPageNumbers = maxItems - 4;

    // Calculate the starting and ending page numbers based on the current page and the total pages
    let startPage = 1;
    let endPage = totalPages;

    // Adjust startPage and endPage if total pages exceed the maximum displayable page numbers
    if (totalPages > maxPageNumbers) {
      const leftPageNumbers = Math.ceil(maxPageNumbers / 2) - 1;
      const rightPageNumbers = maxPageNumbers - leftPageNumbers - 1;

      startPage = currentPage - leftPageNumbers;
      endPage = currentPage + rightPageNumbers;

      // Ensure startPage and endPage are within valid ranges
      if (startPage <= 1) {
        startPage = 1;
        endPage = maxPageNumbers;
      } else if (endPage >= totalPages) {
        endPage = totalPages;
        startPage = totalPages - maxPageNumbers + 1;
      }
    }

    // Render page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i} onClick={() => callback(i)} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <a className={`page-link ${darkMode && 'text-light'}`}>{i}</a>
        </li>
      );
    }
    // If total pages exceed the maximum displayable page numbers, add ellipsis
    if (totalPages > maxPageNumbers) {
      // If there is enough space, remove one number and add ellipsis
      if (endPage < totalPages) {
        pageNumbers.pop(); // Remove one number for ellipsis
        pageNumbers.pop(); // Remove one number for 1

        pageNumbers.push(
          <li key="right-ellipsis" className="page-item">
            <span className="page-link">...</span>
          </li>
        );

        pageNumbers.push(
          <li key={totalPages} onClick={() => callback(totalPages)} className={`page-item`}>
            <a className={`page-link ${darkMode && 'text-light'}`}>{totalPages}</a>
          </li>
        );
      }

      // If the beginning of the pages is not visible, add ellipsis and remove one number
      if (startPage > 1) {
        pageNumbers.shift();
        pageNumbers.shift();

        pageNumbers.unshift(
          <li key="left-ellipsis" className="page-item">
            <span className="page-link">...</span>
          </li>
        );
        pageNumbers.unshift(
          <li key={1} onClick={() => callback(1)} className={`page-item`}>
            <a className={`page-link ${darkMode && 'text-light'}`}>1</a>
          </li>
        );
      }
    }

    return pageNumbers;
  };

  return <>{renderPageNumbers()}</>;
};

Pagination.Operator = Operator;
Pagination.PageLinks = PageLinks;
