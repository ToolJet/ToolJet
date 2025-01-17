import React, { useState, useEffect } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useTableStore from '../../_stores/tableStore';

// TODO: Need to replace all the default data

export const Pagination = function Pagination({
  id,
  onPageIndexChanged = () => {},
  autoGotoPage = () => {},
  autoCanNextPage = true,
  autoPageCount = 1,
  autoPageOptions = [],
  lastActivePageIndex = 1,
  pageIndex = 1,
  setPageIndex = () => {},
  tableWidth,
}) {
  const { getTableProperties } = useTableStore();
  const { enablePrevButton, enableNextButton, serverSidePagination } = getTableProperties(id);
  const [pageCount, setPageCount] = useState(autoPageCount);

  useEffect(() => {
    setPageCount(autoPageCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPageCount]);

  useEffect(() => {
    if (serverSidePagination && lastActivePageIndex > 0) {
      setPageCount(lastActivePageIndex);
    } else if (serverSidePagination || lastActivePageIndex === 0) {
      setPageIndex(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSidePagination, lastActivePageIndex]);

  function gotoPage(page) {
    setPageIndex(page);
    onPageIndexChanged(page);
    if (!serverSidePagination) {
      autoGotoPage(page - 1);
    }
  }

  function goToNextPage() {
    gotoPage(Number(pageIndex) + 1);
  }

  function goToPreviousPage() {
    gotoPage(Number(pageIndex) - 1);
  }

  return (
    <div className={'col d-flex justify-content-center h-100'}>
      <div className="pagination-container d-flex h-100 align-items-center custom-gap-4" data-cy="pagination-section">
        <div className="d-flex">
          {!serverSidePagination && tableWidth > 460 && (
            <ButtonSolid
              variant="ghostBlack"
              className="tj-text-xsm table-pagination-btn"
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
              fill={`var(--icons-default)`}
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
            className="tj-text-xsm table-pagination-btn"
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
            fill={`var(--icons-default)`}
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
          {serverSidePagination && <span className="color-slate-11">{pageIndex}</span>}
          {!serverSidePagination && (
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
            className="tj-text-xsm table-pagination-btn"
            style={{
              minWidth: '28px',
              width: '28px',
              height: '28px',
              padding: '7px',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'center',
              cursor: (!autoCanNextPage && !serverSidePagination) || !enableNextButton ? 'not-allowed' : 'pointer',
            }}
            leftIcon="cheveronright"
            fill={`var(--icons-default)`}
            iconWidth="14"
            size="md"
            disabled={(!autoCanNextPage && !serverSidePagination) || !enableNextButton}
            onClick={(event) => {
              event.stopPropagation();
              goToNextPage();
            }}
            data-cy={`pagination-button-to-next`}
          ></ButtonSolid>
          {!serverSidePagination && tableWidth > 460 && (
            <ButtonSolid
              variant="ghostBlack"
              className="tj-text-xsm table-pagination-btn"
              style={{
                minWidth: '28px',
                width: '28px',
                height: '28px',
                padding: '7px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'center',
                cursor: !autoCanNextPage && !serverSidePagination ? 'not-allowed' : 'pointer',
              }}
              leftIcon="cheveronrightdouble"
              fill={`var(--icons-default)`}
              iconWidth="14"
              size="md"
              onClick={(event) => {
                event.stopPropagation();
                gotoPage(pageCount);
              }}
              disabled={!autoCanNextPage && !serverSidePagination}
              data-cy={`pagination-button-to-last`}
            ></ButtonSolid>
          )}
        </div>
      </div>
    </div>
  );
};
