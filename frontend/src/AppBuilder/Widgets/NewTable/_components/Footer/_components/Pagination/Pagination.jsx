import React, { useEffect } from 'react';
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

  const PaginationPopoverContent = () => {
    const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);

    useEffect(() => {
      // Use a small timeout to ensure the DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const popoverContainer = document.getElementsByClassName('table-widget-popup')[0];
        if (popoverContainer) {
          const currentPageButton = popoverContainer.querySelector(`[data-cy="page-${pageIndex}-button-option"]`);
          if (currentPageButton) {
            // Scroll the current page button into view within the popover container when popover mounts
            currentPageButton.scrollIntoView({
              behavior: 'auto',
              block: 'center',
            });
          }
        }
      }, 0);

      return () => clearTimeout(timeoutId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getPopoverContainer = () => {
      return document.getElementsByClassName('table-widget-popup')[0];
    };

    return (
      <Popover.Body>
        <PaginationButton
          key={'lastpage'}
          onClick={(e) => {
            const popup = getPopoverContainer();
            if (popup) {
              popup.scrollTo({
                top: popup.scrollHeight,
                behavior: 'smooth',
              });
            }
            e.target.blur(); // To remove focus styling that gets applied after clicking on the button
          }}
          dataCy={`last-page-button-option`}
          currentPageIndex={pageIndex}
          pageIndex={'Last page'}
          className="!tw-w-full !tw-h-[32px] justify-content-start tw-px-[8px]"
        />

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

        <PaginationButton
          key={'firstpage'}
          onClick={(e) => {
            const popup = getPopoverContainer();
            if (popup) {
              popup.scrollTo({
                top: 0,
                behavior: 'smooth',
              });
            }
            e.target.blur(); // To remove focus styling that gets applied after clicking on the button
          }}
          dataCy={`first-page-button-option`}
          currentPageIndex={pageIndex}
          pageIndex={'First page'}
          className="!tw-w-full !tw-h-[32px] justify-content-start tw-px-[8px]"
        />
      </Popover.Body>
    );
  };

  const paginationPopover = () => {
    return (
      <Popover
        id="popover-basic"
        data-cy="popover-card"
        className={`table-widget-popup pagination-popup ${darkMode && 'dark-theme'}`}
        style={{ maxHeight: `${height - 79}px` }}
        placement="top-end"
      >
        <PaginationPopoverContent />
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
      </div>
    </div>
  );
};
