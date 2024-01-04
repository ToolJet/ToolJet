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
}) => {
  const [currentPageNumber, setCurrentPageNumber] = React.useState(currentPage);

  const handleOnChange = (value) => {
    const parsedValue = parseInt(value, 10);

    if (parsedValue > 0 && parsedValue <= totalPage && parsedValue !== currentPage) {
      gotoNextPage(true, parsedValue);
    }
  };

  useEffect(() => {
    setCurrentPageNumber(currentPage);
  }, [currentPage]);

  return (
    <div className="pagination-container d-flex" data-cy="pagination-section">
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

      <div className="d-flex">
        <input
          disabled={isDisabled || disableInput}
          type="text"
          className="form-control mx-1"
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
    </div>
  );
};

export default Pagination;
