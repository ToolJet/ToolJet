import React, { memo, useState, useEffect } from 'react';

export const PaginationInput = memo(({ pageIndex, serverSidePagination, pageCount, table }) => {
  // Add local state to handle input value
  const [inputValue, setInputValue] = useState(pageIndex);

  // Update input value when pageIndex prop changes
  useEffect(() => {
    setInputValue(pageIndex);
  }, [pageIndex]);

  function gotoPage(page) {
    if (!serverSidePagination) {
      table.setPageIndex(page - 1);
    }
  }

  return (
    <div className="d-flex align-items-center tj-text-xsm h-100 page-info custom-gap-4" data-cy={`page-index-details`}>
      {serverSidePagination && <span className="color-slate-11">{pageIndex}</span>}
      {!serverSidePagination && (
        <>
          <input
            type="text"
            className={`form-control h-100`}
            value={inputValue}
            onChange={(event) => {
              const value = event.target.value;

              // Only update page if value is a valid number and within range
              const pageNumber = parseInt(value, 10);
              if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= pageCount) {
                setInputValue(pageNumber);
                gotoPage(pageNumber);
              } else if (value === '') {
                setInputValue('');
              }
            }}
          />
          <span className="font-weight-500 total-page-number" style={{ width: 'max-content' }}>
            of {pageCount || 1}
          </span>
        </>
      )}
    </div>
  );
});
