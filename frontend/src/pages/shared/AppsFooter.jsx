import React from 'react';

import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/Rocket/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Rocket/select';

const PAGE_SIZE_OPTIONS = ['9'];

/**
 * Returns the list of page numbers (or null for ellipsis) to render.
 * Always shows up to 3 consecutive pages around the current page.
 */
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, null];
  }
  if (currentPage >= totalPages - 2) {
    return [null, totalPages - 2, totalPages - 1, totalPages];
  }
  return [null, currentPage - 1, currentPage, currentPage + 1, null];
}

export default function AppsFooter({ currentPage = 1, totalItems = 0, pageSize = 50, onPageChange, onPageSizeChange }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const totalPages = Math.ceil(totalItems / pageSize);
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="tw-h-12 tw-flex tw-items-center tw-justify-between tw-px-20 tw-border-t tw-border-solid tw-border-border-weak">
      {/* Left: page-size selector + item count */}
      <div className="tw-flex tw-items-center tw-gap-1.5">
        <span className="tw-text-xs tw-text-text-placeholder">Showing</span>

        <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange?.(Number(val))}>
          <SelectTrigger className="tw-h-7 tw-w-14 tw-text-xs tw-px-1.5 tw-py-1 tw-rounded-md tw-border-border-default">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={cn('tw-border-border-weak', { 'dark-theme theme-dark': darkMode })}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size} className="tw-text-xs">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="tw-text-xs tw-text-text-default">of {totalItems} apps</span>
      </div>

      {/* Right: pagination */}
      <Pagination className="tw-w-auto tw-mx-0">
        <PaginationContent className="tw-gap-1">
          <PaginationItem>
            <PaginationPrevious
              size="medium"
              onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
              className={currentPage === 1 ? 'tw-pointer-events-none tw-opacity-40' : 'tw-cursor-pointer'}
            />
          </PaginationItem>

          {pages.map((page, i) =>
            page === null ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis className="tw-size-7" />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  size="medium"
                  onClick={() => onPageChange?.(page)}
                  className="tw-cursor-pointer tw-text-text-default tw-font-body-default tw-size-7"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              size="medium"
              onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
              className={currentPage === totalPages ? 'tw-pointer-events-none tw-opacity-40' : 'tw-cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
