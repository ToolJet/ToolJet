import React, { memo, useEffect, useRef } from 'react';
import Popover from 'react-bootstrap/Popover';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { getPageNumbers } from './pagerUtils';
import { OverlayTriggerComponent } from '@/AppBuilder/Shared/OverlayTriggerComponent';

const PagerButton = memo(
  ({ pageIndex, onClick, disabled, icon, dataCy, currentPageIndex, className, style, ariaLabel }) => {
    const isSelected = pageIndex && currentPageIndex && pageIndex === currentPageIndex;

    return (
      <ButtonSolid
        variant="ghostBlack"
        className={`tj-text-sm table-pagination-btn ${isSelected && 'selected'} ${className}`}
        leftIcon={icon}
        fill={disabled ? 'var(--slate8)' : 'var(--cc-primary-icon, var(--cc-default-icon))'}
        iconWidth="16"
        isTablerIcon={true}
        size="md"
        onClick={onClick}
        disabled={disabled}
        data-cy={dataCy}
        aria-label={ariaLabel}
        style={style}
      >
        {pageIndex}
      </ButtonSolid>
    );
  }
);

const PageList = ({ page, pageCount, onGoToPage }) => {
  const ref = useRef(null);
  const virtualizer = useVirtualizer({
    count: pageCount || 0,
    getScrollElement: () => ref.current,
    estimateSize: () => 32,
    overscan: 15,
  });

  useEffect(() => {
    // The DOM has to be rendered before the current page can be scrolled into view.
    const timeoutId = setTimeout(() => {
      if (ref.current) virtualizer.scrollToIndex(page - 1, { behavior: 'auto', align: 'center' });
    }, 0);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popover.Body>
      <div ref={ref} className="tw-p-[8px] tw-overflow-auto tw-flex-1">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const pageNum = virtualItem.index + 1;
            return (
              <PagerButton
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                dataCy={`page-${pageNum}-button-option`}
                currentPageIndex={page}
                pageIndex={pageNum}
                onClick={() => onGoToPage(pageNum)}
                className="!tw-w-full !tw-h-[32px] justify-content-start tw-px-[8px]"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </Popover.Body>
  );
};

/**
 * The Table footer pager as a plain component: the caller owns the page and says what each button may do.
 * `pageCount` 0 means unknown. `maxPageButtons` is 1 or 3 numbered buttons.
 */
export const Pager = function Pager({
  id,
  page = 1,
  pageCount,
  onGoToPage,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  canFirst = page > 1,
  canLast = page < pageCount,
  maxPageButtons = 3,
  showFirstLast = false,
  showPageList = false,
  darkMode,
  height,
}) {
  const pageNumbers = getPageNumbers(page, pageCount, maxPageButtons);
  const showPageListButton = showPageList && pageNumbers.length < pageCount;

  const pageListPopover = (
    <Popover
      id="popover-basic"
      data-cy="popover-card"
      className={`table-widget-popup pagination-popup ${darkMode && 'dark-theme'}`}
      style={{
        maxHeight: height - 79 > 128 ? `${height - 79}px` : '128px',
      }}
      placement="top-end"
    >
      <PageList page={page} pageCount={pageCount} onGoToPage={onGoToPage} />
    </Popover>
  );

  return (
    <div className={'d-flex align-items-center h-100'}>
      <div className="pagination-container d-flex h-100 align-items-center tw-space-x-1" data-cy="pagination-section">
        {showFirstLast && (
          <PagerButton
            onClick={() => onGoToPage(1)}
            disabled={!canFirst}
            icon="IconChevronsLeft"
            dataCy="pagination-button-to-first"
            ariaLabel="First page"
          />
        )}

        <PagerButton
          onClick={onPrevious}
          disabled={!canPrevious}
          icon="IconChevronLeft"
          dataCy="pagination-button-to-previous"
          ariaLabel="Previous page"
        />

        {pageNumbers.map((pageNum) => (
          <PagerButton
            key={pageNum}
            onClick={() => onGoToPage(pageNum)}
            dataCy="pagination-button-go-to-page"
            currentPageIndex={page}
            pageIndex={pageNum}
          />
        ))}

        {showPageListButton && (
          <OverlayTriggerComponent
            id={id}
            trigger="click"
            overlay={pageListPopover}
            rootClose={true}
            placement={'top-end'}
          >
            <PagerButton icon="IconDots" dataCy="pagination-button-more-pages" ariaLabel="More pages" />
          </OverlayTriggerComponent>
        )}

        <PagerButton
          onClick={onNext}
          disabled={!canNext}
          icon="IconChevronRight"
          dataCy="pagination-button-to-next"
          ariaLabel="Next page"
        />

        {showFirstLast && (
          <PagerButton
            onClick={() => onGoToPage(pageCount)}
            disabled={!canLast}
            icon="IconChevronsRight"
            dataCy="pagination-button-to-last"
            ariaLabel="Last page"
          />
        )}
      </div>
    </div>
  );
};
