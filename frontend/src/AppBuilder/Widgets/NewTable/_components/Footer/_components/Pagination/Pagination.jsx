import React, { useRef } from 'react';
import { PaginationButton } from './PaginationButton';
import useTableStore from '../../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { OverlayTriggerComponent } from '../OverlayTriggerComponent';
import Popover from 'react-bootstrap/Popover';
import { WindowedList } from '@/AppBuilder/_engines/rendering/WindowedList';

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
  const serverSideRowsPerPage = useTableStore((state) => state.getTableProperties(id)?.serverSideRowsPerPage, shallow);
  const totalRecords = useTableStore((state) => state.getTableProperties(id)?.totalRecords, shallow);

  const parsedServerSideRowsPerPage = Number(serverSideRowsPerPage);
  const parsedTotalRecords = Number(totalRecords);
  const knowTotalPages = serverSidePagination && parsedServerSideRowsPerPage > 0 && parsedTotalRecords > 0;
  const effectivePageCount = knowTotalPages
    ? Math.ceil(parsedTotalRecords / parsedServerSideRowsPerPage)
    : serverSidePagination
      ? 0
      : pageCount;

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
    const totalPages = effectivePageCount;

    // Server-side without known totalPages: show only current page
    if ((serverSidePagination && !knowTotalPages) || tableWidth <= 460) {
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
  const showFirstLastBtns =
    serverSidePagination && !knowTotalPages
      ? false
      : (tableWidth <= 460 && effectivePageCount > 1) || effectivePageCount > 3;
  const showPagesPopupBtn = showFirstLastBtns && pageNumbers.length < effectivePageCount;

  const PaginationPopoverContent = () => {
    const ref = useRef(null);
    return (
      <Popover.Body>
        <div ref={ref} className="tw-p-[8px] tw-overflow-auto tw-flex-1">
          {/* Only the page buttons in view are rendered; the current page is centered when the popover opens. */}
          <WindowedList
            count={effectivePageCount || 0}
            scrollRef={ref}
            itemHeight={32}
            overscan={15 * 32}
            measure
            initialIndex={pageIndex - 1}
            renderItem={(index) => {
              const pageNum = index + 1;
              return (
                <PaginationButton
                  dataCy={`page-${pageNum}-button-option`}
                  currentPageIndex={pageIndex}
                  pageIndex={pageNum}
                  onClick={() => {
                    goToPage(pageNum);
                  }}
                  className="!tw-w-full !tw-h-[32px] justify-content-start tw-px-[8px]"
                />
              );
            }}
          />
        </div>
      </Popover.Body>
    );
  };

  const paginationPopover = () => {
    return (
      <Popover
        id="popover-basic"
        data-cy="popover-card"
        className={`table-widget-popup pagination-popup ${darkMode && 'dark-theme'}`}
        style={{
          maxHeight: height - 79 > 128 ? `${height - 79}px` : '128px',
        }}
        placement="top-end"
      >
        <PaginationPopoverContent />
      </Popover>
    );
  };

  return (
    <div className={'d-flex align-items-center h-100'}>
      <div className="pagination-container d-flex h-100 align-items-center tw-space-x-1" data-cy="pagination-section">
        {showFirstLastBtns && (
          <PaginationButton
            onClick={() => {
              goToPage(1);
            }}
            disabled={pageIndex === 1 || (serverSidePagination && !enablePrevButton)}
            icon="IconChevronsLeft"
            dataCy="pagination-button-to-first"
          />
        )}

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
          <OverlayTriggerComponent
            id={id}
            trigger="click"
            overlay={paginationPopover()}
            rootClose={true}
            placement={'top-end'}
          >
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

        {showFirstLastBtns && (
          <PaginationButton
            onClick={() => {
              goToPage(effectivePageCount);
            }}
            disabled={pageIndex === effectivePageCount || (serverSidePagination && !enableNextButton)}
            icon="IconChevronsRight"
            dataCy="pagination-button-to-last"
          />
        )}
      </div>
    </div>
  );
};
