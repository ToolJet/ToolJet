import * as React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { TablePaginationFooterSkeleton } from './TablePaginationFooterSkeleton';

export function TablePaginationFooter({ table, isLoading }) {
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  // Helper function to generate page numbers with ellipsis
  const generatePageNumbers = () => {
    const pages = [];
    const delta = 2; // Number of pages to show around current page

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 4) {
        pages.push('ellipsis-start');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  if (isLoading) {
    return <TablePaginationFooterSkeleton />;
  }

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-h-12">
      <div className="tw-flex tw-items-center tw-gap-2 tw-grow">
        <span className="tw-text-sm tw-text-text-placeholder">{table.getRowCount()} records</span>
      </div>
      <Pagination className="tw-w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              className={!table.getCanPreviousPage() ? 'tw-pointer-events-none tw-opacity-50' : 'tw-cursor-pointer'}
            />
          </PaginationItem>

          {pageNumbers.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => table.setPageIndex(page - 1)}
                  isActive={page === currentPage}
                  className="tw-cursor-pointer tw-size-7"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              className={!table.getCanNextPage() ? 'tw-pointer-events-none tw-opacity-50' : 'tw-cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
