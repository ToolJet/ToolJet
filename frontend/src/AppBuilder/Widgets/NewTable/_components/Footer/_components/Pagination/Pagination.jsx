import React from 'react';
import { PaginationButton } from './PaginationButton';
import useTableStore from '../../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { OverlayTriggerComponent } from '../OverlayTriggerComponent';
import Popover from 'react-bootstrap/Popover';

// TODO: Need to replace all the default data

export const Pagination = function Pagination({
  id,
  pageIndex = 1,
  tableWidth,
  table,
  pageCount,
  paginationBtnClicked,
  darkMode,
  height,
}) {
  const serverSidePagination = useTableStore((state) => state.getTableProperties(id)?.serverSidePagination, shallow);
  const enablePrevButton = useTableStore((state) => state.getTableProperties(id)?.enablePrevButton, shallow);
  const enableNextButton = useTableStore((state) => state.getTableProperties(id)?.enableNextButton, shallow);

  const canGoToNextPage = serverSidePagination ? enableNextButton : table.getCanNextPage();
  const canGoToPreviousPage = serverSidePagination ? enablePrevButton : table.getCanPreviousPage();

  function goToNextPage() {
    paginationBtnClicked.current = true;
    table.nextPage();
  }

  function goToPreviousPage() {
    paginationBtnClicked.current = true;
    table.previousPage();
  }

  function goToPage(targetPage) {
    paginationBtnClicked.current = true;
    table.setPageIndex(targetPage - 1);
  }

  const getPageNumbers = () => {
    const currentPage = pageIndex;
    const totalPages = pageCount;

    if (serverSidePagination || tableWidth <= 460) {
      return [currentPage];
    }

    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 2) {
      return [1, 2, 3];
    }

    if (currentPage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }

    return [currentPage - 1, currentPage, currentPage + 1];
  };

  const pageNumbers = getPageNumbers();
  const showPagesPopupBtn = !serverSidePagination && ((tableWidth <= 460 && pageCount > 1) || pageCount > 3);

  const paginationPopover = () => {
    const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);

    return (
      <Popover
        id="popover-basic"
        data-cy="popover-card"
        className={`table-widget-popup pagination-popup ${darkMode && 'dark-theme'}`}
        style={{ maxHeight: `${height - 79}px` }}
        placement="top-end"
      >
        <Popover.Body>
          {allPages.map((pageNum) => (
            <PaginationButton
              key={pageNum}
              onClick={() => {
                goToPage(pageNum);
              }}
              dataCy={`page-${pageNum}-button-option`}
              currentPageIndex={pageIndex}
              pageIndex={pageNum}
              className="!tw-w-full !tw-h-[32px] justify-content-start tw-px-[8px]"
            />
          ))}
        </Popover.Body>
      </Popover>
    );
  };

  return (
    <div className={'d-flex align-items-center h-100'}>
      <div className="pagination-container d-flex h-100 align-items-center tw-space-x-1" data-cy="pagination-section">
        <PaginationButton
          onClick={() => {
            goToPreviousPage();
          }}
          disabled={!canGoToPreviousPage}
          icon="IconChevronLeft"
          dataCy="pagination-button-to-previous"
        />

        {pageNumbers.map((pageNum) => (
          <PaginationButton
            key={pageNum}
            onClick={() => {
              goToPage(pageNum);
            }}
            dataCy="pagination-button-go-to-page"
            currentPageIndex={pageIndex}
            pageIndex={pageNum}
          />
        ))}

        {showPagesPopupBtn && (
          <OverlayTriggerComponent trigger="click" overlay={paginationPopover()} rootClose={true} placement={'top-end'}>
            <PaginationButton icon="IconDots" dataCy="pagination-button-more-pages" />
          </OverlayTriggerComponent>
        )}

        <PaginationButton
          onClick={() => {
            goToNextPage();
          }}
          disabled={!canGoToNextPage}
          icon="IconChevronRight"
          dataCy="pagination-button-to-next"
        />
      </div>
    </div>
  );
};
