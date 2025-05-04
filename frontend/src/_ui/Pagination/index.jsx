import React, { useEffect } from 'react';
import { Button } from '@/_ui/LeftSidebar';

const Pagination = ({
  darkMode,
  gotoNextPage,
  gotoPreviousPage,
  currentPage,
  totalPage,
  isDisabled,
  disableInput = false,
  showFirstLastButtons = false,
  gotoFirstPage,
  gotoLastPage,
  showPageNumbers = false,
  pageNumbersToShow = 5,
}) => {
  const [currentPageNumber, setCurrentPageNumber] = React.useState(currentPage);

  const handleOnChange = (value) => {
    const parsedValue = parseInt(value, 10);
    if (parsedValue > 0 && parsedValue <= totalPage && parsedValue !== currentPage) {
      gotoNextPage(true, parsedValue);
    } else if (parsedValue > totalPage) {
      setCurrentPageNumber(totalPage);
      gotoNextPage(true, totalPage);
    } else if (isNaN(parsedValue) || parsedValue === 0) {
      setCurrentPageNumber(1);
      gotoNextPage(true, 1);
    }
  };

  useEffect(() => {
    setCurrentPageNumber(currentPage);
  }, [currentPage]);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const halfPageNumbersToShow = Math.floor(pageNumbersToShow / 2);
    let startPage = Math.max(1, currentPage - halfPageNumbersToShow);
    let endPage = Math.min(totalPage, currentPage + halfPageNumbersToShow);

    if (currentPage <= halfPageNumbersToShow) {
      endPage = Math.min(totalPage, pageNumbersToShow);
    } else if (currentPage + halfPageNumbersToShow >= totalPage) {
      startPage = Math.max(1, totalPage - pageNumbersToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`page-number ${i === currentPage ? 'active' : ''}`}
          onClick={() => gotoNextPage(true, i)}
          disabled={isDisabled}
        >
          {i}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="pagination-container d-flex" data-cy="pagination-section">
      {showFirstLastButtons && (
        <Button.UnstyledButton
          onClick={(event) => {
            event.stopPropagation();
            gotoFirstPage();
          }}
          classNames={darkMode ? 'dark' : 'nothing'}
          styles={{ height: '20px', width: '20px' }}
          disabled={isDisabled || currentPage === 1}
        >
          <Button.Content iconSrc={'assets/images/icons/chevron-double-left.svg'} />
        </Button.UnstyledButton>
      )}

      <Button.UnstyledButton
        onClick={(event) => {
          event.stopPropagation();
          gotoPreviousPage();
        }}
        classNames={darkMode ? 'dark' : 'nothing'}
        styles={{ height: '20px', width: '20px' }}
        disabled={isDisabled || currentPage === 1}
      >
        <Button.Content iconSrc={'assets/images/icons/chevron-left.svg'} />
      </Button.UnstyledButton>

      {showPageNumbers && renderPageNumbers()}

      <div className="d-flex align-items-center mx-1">
        <input
          disabled={isDisabled || disableInput}
          type="text"
          className="form-control-pagination"
          data-cy={`current-page-number-${currentPageNumber}`}
          value={currentPageNumber}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleOnChange(event.target.value);
            }
          }}
          onBlur={(event) => {
            handleOnChange(event.target.value);
          }}
          onChange={(event) => {
            setCurrentPageNumber(event.target.value);
          }}
        />
        <span className="mx-1" data-cy={`total-page-number-${totalPage}`}>
          / {totalPage}
        </span>
      </div>

      <Button.UnstyledButton
        onClick={(event) => {
          event.stopPropagation();
          gotoNextPage();
        }}
        classNames={darkMode && 'dark'}
        styles={{ height: '20px', width: '20px' }}
        disabled={isDisabled || currentPage === totalPage}
      >
        <Button.Content iconSrc={'assets/images/icons/chevron-right.svg'} />
      </Button.UnstyledButton>

      {showFirstLastButtons && (
        <Button.UnstyledButton
          onClick={(event) => {
            event.stopPropagation();
            gotoLastPage();
          }}
          classNames={darkMode ? 'dark' : 'nothing'}
          styles={{ height: '20px', width: '20px' }}
          disabled={isDisabled || currentPage === totalPage}
        >
          <Button.Content iconSrc={'assets/images/icons/chevron-double-right.svg'} />
        </Button.UnstyledButton>
      )}
    </div>
  );
};

export default Pagination;
