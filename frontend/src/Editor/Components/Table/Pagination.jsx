import React, { useState, useEffect } from 'react';
import { Button } from '@/_ui/LeftSidebar';

export const Pagination = function Pagination({
  onPageIndexChanged,
  serverSide,
  autoGotoPage,
  autoCanNextPage,
  autoPageCount,
  autoPageOptions,
  lastActivePageIndex,
  pageIndex,
  setPageIndex,
  enablePrevButton,
  enableNextButton,
  darkMode,
}) {
  const [pageCount, setPageCount] = useState(autoPageCount);

  useEffect(() => {
    setPageCount(autoPageCount);
  }, [autoPageCount]);

  useEffect(() => {
    if (serverSide && lastActivePageIndex > 0) {
      setPageCount(lastActivePageIndex);
    } else if (serverSide || lastActivePageIndex === 0) {
      setPageIndex(1);
    } else {
      gotoPage(lastActivePageIndex + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSide, lastActivePageIndex]);

  function gotoPage(page) {
    setPageIndex(page);
    onPageIndexChanged(page);
    if (!serverSide) {
      autoGotoPage(page - 1);
    }
  }

  function goToNextPage() {
    gotoPage(pageIndex + 1);
  }

  function goToPreviousPage() {
    gotoPage(pageIndex - 1);
  }

  return (
    <div className="pagination-container d-flex" data-cy="pagination-section">
      {!serverSide && (
        <Button.UnstyledButton
          onClick={(event) => {
            event.stopPropagation();
            gotoPage(1);
          }}
          classNames={darkMode ? 'dark' : 'nothing'}
          data-cy={`pagination-button-to-first`}
          styles={{ height: '20px', width: '20px' }}
          disabled={pageIndex === 1}
        >
          <Button.Content iconSrc={'assets/images/icons/chevron-left.svg'} />
        </Button.UnstyledButton>
      )}
      <Button.UnstyledButton
        onClick={(event) => {
          event.stopPropagation();
          goToPreviousPage();
        }}
        classNames={darkMode ? 'dark' : 'nothing'}
        styles={{ height: '20px', width: '20px' }}
        disabled={pageIndex === 1 || !enablePrevButton}
        data-cy={`pagination-button-to-previous`}
      >
        <Button.Content iconSrc={'assets/images/icons/chevron-left.svg'} />
      </Button.UnstyledButton>

      <div className="d-flex tj-text-xsm text-black-000 font-weight-500" data-cy={`page-index-details`}>
        {serverSide && <span>{pageIndex}</span>}
        {!serverSide && (
          <>
            <input
              type="text"
              className="form-control mx-1"
              value={pageIndex}
              onChange={(event) => {
                if (event.target.value <= pageCount) gotoPage(event.target.value);
              }}
            />
            <span className="mx-1 " data-cy={`total-page-number-${autoPageOptions.length || 1}`}>
              / {pageCount || 1}
            </span>
          </>
        )}
      </div>

      <Button.UnstyledButton
        onClick={(event) => {
          event.stopPropagation();
          goToNextPage();
        }}
        classNames={darkMode && 'dark'}
        styles={{ height: '20px', width: '20px' }}
        disabled={(!autoCanNextPage && !serverSide) || !enableNextButton}
        data-cy={`pagination-button-to-next`}
      >
        <Button.Content iconSrc={'assets/images/icons/chevron-right.svg'} />
      </Button.UnstyledButton>
      {!serverSide && (
        <Button.UnstyledButton
          onClick={(event) => {
            event.stopPropagation();
            gotoPage(pageCount);
          }}
          classNames={darkMode && 'dark'}
          styles={{ height: '20px', width: '20px' }}
          disabled={!autoCanNextPage && !serverSide}
          data-cy={`pagination-button-to-last`}
        >
          <Button.Content iconSrc={'assets/images/icons/chevron-right.svg'} />
        </Button.UnstyledButton>
      )}
    </div>
  );
};
