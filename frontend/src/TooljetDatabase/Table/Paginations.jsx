import React from 'react';
import { Button } from '@/_ui/LeftSidebar';

const Pagination = ({ darkMode, gotoNextPage, gotoPreviousPage, currentPage, totalPage }) => {
  const handleOnChange = (value) => {
    const parsedValue = parseInt(value, 10);

    if (parsedValue > 0 && parsedValue <= totalPage && parsedValue !== currentPage) {
      gotoNextPage(true, event.target.value);
    }
  };

  return (
    <div className="tooljet-db-pagination-container d-flex">
      <Button.UnstyledButton
        onClick={(event) => {
          event.stopPropagation();
          gotoPreviousPage();
        }}
        classNames={darkMode ? 'dark' : 'nothing'}
        styles={{ height: '20px', width: '20px' }}
        disabled={currentPage === 1}
      >
        <Button.Content iconSrc={'assets/images/icons/chevron-left.svg'} />
      </Button.UnstyledButton>

      <div className="d-flex">
        <input
          type="text"
          className="form-control mx-1"
          defaultValue={currentPage}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleOnChange(event.target.value);
            }
          }}
        />
        <span className="mx-1">/ {totalPage}</span>
      </div>

      <Button.UnstyledButton
        onClick={(event) => {
          event.stopPropagation();
          gotoNextPage();
        }}
        classNames={darkMode && 'dark'}
        styles={{ height: '20px', width: '20px' }}
        disabled={currentPage === totalPage}
      >
        <Button.Content iconSrc={'assets/images/icons/chevron-right.svg'} />
      </Button.UnstyledButton>
    </div>
  );
};

export default Pagination;
