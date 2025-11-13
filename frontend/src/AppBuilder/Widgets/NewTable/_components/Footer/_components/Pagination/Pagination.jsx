import React from 'react';
import { PaginationButton } from './PaginationButton';
import { PaginationInput } from './PaginationInput';
import useTableStore from '../../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

// TODO: Need to replace all the default data

export const Pagination = function Pagination({
  id,
  pageIndex = 1,
  tableWidth,
  table,
  pageCount,
  paginationBtnClicked,
}) {
  const serverSidePagination = useTableStore((state) => state.getTableProperties(id)?.serverSidePagination, shallow);
  const enablePrevButton = useTableStore((state) => state.getTableProperties(id)?.enablePrevButton, shallow);
  const enableNextButton = useTableStore((state) => state.getTableProperties(id)?.enableNextButton, shallow);

  const canGoToNextPage = serverSidePagination ? enableNextButton : table.getCanNextPage();
  const canGoToPreviousPage = serverSidePagination ? enablePrevButton : table.getCanPreviousPage();

  const showGoToFirstAndLast = !serverSidePagination && tableWidth > 460;

  function goToNextPage() {
    paginationBtnClicked.current = true;
    table.nextPage();
  }

  function goToPreviousPage() {
    paginationBtnClicked.current = true;
    table.previousPage();
  }

  return (
    <div className={'col d-flex justify-content-center h-100'}>
      <div className="pagination-container d-flex h-100 align-items-center custom-gap-4" data-cy="pagination-section">
        <div className="d-flex">
          {showGoToFirstAndLast && (
            <PaginationButton
              onClick={() => {
                paginationBtnClicked.current = true;
                table.firstPage();
              }}
              disabled={!canGoToPreviousPage}
              icon="cheveronleftdouble"
              dataCy="pagination-button-to-first"
            />
          )}

          <PaginationButton
            onClick={() => {
              goToPreviousPage();
            }}
            disabled={!canGoToPreviousPage}
            icon="cheveronleft"
            dataCy="pagination-button-to-previous"
          />
        </div>

        <PaginationInput
          pageIndex={pageIndex}
          serverSidePagination={serverSidePagination}
          table={table}
          pageCount={pageCount}
          paginationBtnClicked={paginationBtnClicked}
        />

        <div className="d-flex">
          <PaginationButton
            onClick={() => {
              goToNextPage();
            }}
            disabled={!canGoToNextPage}
            icon="cheveronright"
            dataCy="pagination-button-to-next"
          />
          {showGoToFirstAndLast && (
            <PaginationButton
              onClick={() => {
                paginationBtnClicked.current = true;
                table.lastPage();
              }}
              disabled={!canGoToNextPage}
              icon="cheveronrightdouble"
              dataCy="pagination-button-to-last"
            />
          )}
        </div>
      </div>
    </div>
  );
};
