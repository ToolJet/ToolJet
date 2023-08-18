import React, { useState, useEffect } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

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
  // eslint-disable-next-line no-unused-vars
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
    <div className="pagination-container d-flex h-100 align-items-center custom-gap-4" data-cy="pagination-section">
      <div className="d-flex">
        {!serverSide && (
          <ButtonSolid
            variant="ghostBlack"
            className="tj-text-xsm"
            style={{
              minWidth: '28px',
              width: '28px',
              height: '28px',
              padding: '7px',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'center',
              cursor: pageIndex === 1 ? 'not-allowed' : 'pointer',
            }}
            leftIcon="cheveronleftdouble"
            fill={`var(--slate12)`}
            iconWidth="14"
            size="md"
            disabled={pageIndex === 1}
            onClick={(event) => {
              event.stopPropagation();
              gotoPage(1);
            }}
            data-cy={`pagination-button-to-first`}
          ></ButtonSolid>
        )}
        <ButtonSolid
          variant="ghostBlack"
          className="tj-text-xsm"
          style={{
            minWidth: '28px',
            width: '28px',
            height: '28px',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'center',
            cursor: pageIndex === 1 || !enablePrevButton ? 'not-allowed' : 'pointer',
          }}
          leftIcon="cheveronleft"
          fill={`var(--slate12)`}
          iconWidth="14"
          size="md"
          disabled={pageIndex === 1 || !enablePrevButton}
          onClick={(event) => {
            event.stopPropagation();
            goToPreviousPage();
          }}
          data-cy={`pagination-button-to-previous`}
        ></ButtonSolid>
      </div>

      <div
        className="d-flex align-items-center tj-text-xsm h-100 page-info custom-gap-4"
        data-cy={`page-index-details`}
      >
        {serverSide && <span className="color-slate-11">{pageIndex}</span>}
        {!serverSide && (
          <>
            <input
              type="text"
              className={`form-control h-100`}
              value={pageIndex}
              onChange={(event) => {
                if (event.target.value <= pageCount) gotoPage(event.target.value);
              }}
            />
            <span
              className="font-weight-500 total-page-number"
              style={{ width: 'max-content' }}
              data-cy={`total-page-number-${autoPageOptions.length || 1}`}
            >
              of {pageCount || 1}
            </span>
          </>
        )}
      </div>
      <div className="d-flex">
        <ButtonSolid
          variant="ghostBlack"
          className="tj-text-xsm"
          style={{
            minWidth: '28px',
            width: '28px',
            height: '28px',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'center',
            cursor: (!autoCanNextPage && !serverSide) || !enableNextButton ? 'not-allowed' : 'pointer',
          }}
          leftIcon="cheveronright"
          fill={`var(--slate12)`}
          iconWidth="14"
          size="md"
          disabled={(!autoCanNextPage && !serverSide) || !enableNextButton}
          onClick={(event) => {
            event.stopPropagation();
            goToNextPage();
          }}
          data-cy={`pagination-button-to-next`}
        ></ButtonSolid>
        {!serverSide && (
          <ButtonSolid
            variant="ghostBlack"
            className="tj-text-xsm"
            style={{
              minWidth: '28px',
              width: '28px',
              height: '28px',
              padding: '7px',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'center',
              cursor: !autoCanNextPage && !serverSide ? 'not-allowed' : 'pointer',
            }}
            leftIcon="cheveronrightdouble"
            fill={`var(--slate12)`}
            iconWidth="14"
            size="md"
            onClick={(event) => {
              event.stopPropagation();
              gotoPage(pageCount);
            }}
            disabled={!autoCanNextPage && !serverSide}
            data-cy={`pagination-button-to-last`}
          ></ButtonSolid>
        )}
      </div>
    </div>
  );
};
