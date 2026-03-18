import * as React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/Rocket/pagination';
import { PaginationFooterSkeleton } from '../PaginationFooterSkeleton';

function PaginationFooterInternal({
  table, // Kept for backward compatibility, will be removed
  isLoading,
  recordCount,
  currentPage,
  totalPages,
  onPageChange,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
}) {
  // Determine values from either table or direct props
  const finalCurrentPage = currentPage ?? table?.getState().pagination.pageIndex + 1;
  const finalTotalPages = totalPages ?? table?.getPageCount();
  const finalRecordCount = recordCount ?? table?.getRowCount();
  const finalCanPreviousPage = canPreviousPage ?? table?.getCanPreviousPage();
  const finalCanNextPage = canNextPage ?? table?.getCanNextPage();
  const handlePageChange = onPageChange ?? ((pageIndex) => table?.setPageIndex(pageIndex));
  const handlePreviousPage = onPreviousPage ?? (() => table?.previousPage());
  const handleNextPage = onNextPage ?? (() => table?.nextPage());

  // Helper function to generate page numbers with ellipsis
  const generatePageNumbers = () => {
    const pages = [];
    const delta = 2; // Number of pages to show around current page

    if (finalTotalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= finalTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (finalCurrentPage > 4) {
        pages.push('ellipsis-start');
      }
      const start = Math.max(2, finalCurrentPage - delta);
      const end = Math.min(finalTotalPages - 1, finalCurrentPage + delta);
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== finalTotalPages) {
          pages.push(i);
        }
      }
      if (finalCurrentPage < finalTotalPages - 3) {
        pages.push('ellipsis-end');
      }
      if (finalTotalPages > 1) {
        pages.push(finalTotalPages);
      }
    }
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  if (isLoading) {
    return <PaginationFooterSkeleton />;
  }

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-h-12">
      <div className="tw-flex tw-items-center tw-gap-2 tw-grow">
        {finalRecordCount > 0 && (
          <span className="tw-text-sm tw-text-text-placeholder">{finalRecordCount} records</span>
        )}
      </div>
      {finalTotalPages > 1 && (
        <Pagination className="tw-w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePreviousPage}
                className={!finalCanPreviousPage ? 'tw-pointer-events-none tw-opacity-50' : 'tw-cursor-pointer'}
              />
            </PaginationItem>

            {pageNumbers.map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => handlePageChange(page - 1)}
                    isActive={page === finalCurrentPage}
                    className="tw-cursor-pointer tw-size-7"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={handleNextPage}
                className={!finalCanNextPage ? 'tw-pointer-events-none tw-opacity-50' : 'tw-cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export const PaginationFooter = React.memo(PaginationFooterInternal);
