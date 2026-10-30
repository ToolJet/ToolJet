import React from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/Rocket/Pagination/Pagination';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';

// Shared with the loading footer so both keep the same height and border.
export const FOOTER_CLASS =
  'tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-justify-between tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-[4.375rem]';

interface PageFooterProps {
  isLoading?: boolean;
  /** 1-based current page. */
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  /** Singular noun after the count, pluralised when `totalCount` is above 1; omit to hide the label. */
  singularItemLabel?: string;
}

// Pinned footer for a paginated list: "Showing x-y of N <items>" plus numbered pages, or a skeleton while loading.
export default function PageFooter({
  isLoading,
  page,
  pageSize,
  totalCount,
  onPageChange,
  singularItemLabel = '',
}: PageFooterProps) {
  // Rocket's links are anchors; href="#" keeps them keyboard-focusable, so the navigation itself is prevented.
  const handlePageChange = (targetPage: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onPageChange(targetPage);
  };

  if (isLoading)
    return (
      <div className={FOOTER_CLASS}>
        <Skeleton className="tw-h-6 tw-w-32" />
        <Skeleton className="tw-h-6 tw-w-32" />
      </div>
    );

  if (!totalCount) return <div className={FOOTER_CLASS}></div>;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalCount);
  const totalPages = Math.ceil(totalCount / pageSize);

  const pageItems = getPageItems(page, totalPages);
  const finalItemLabel = singularItemLabel && totalCount > 1 ? `${singularItemLabel}s` : singularItemLabel;

  return (
    <div className={FOOTER_CLASS}>
      <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">
        Showing {firstItem}-{lastItem} of {totalCount} {finalItemLabel}
      </p>

      <Pagination className="tw-mx-0 tw-w-auto">
        <PaginationContent className="tw-m-0 tw-p-0">
          <PaginationItem>
            <PaginationPrevious href="#" disabled={page === 1} onClick={handlePageChange(page - 1)} />
          </PaginationItem>

          {pageItems.map((pageItem) =>
            typeof pageItem === 'string' ? (
              <PaginationItem key={pageItem}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageItem}>
                <PaginationLink href="#" isActive={pageItem === page} onClick={handlePageChange(pageItem)}>
                  {pageItem}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext href="#" disabled={page === totalPages} onClick={handlePageChange(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

// First, last and the current page's neighbours; a gap of one page shows that page instead of an ellipsis.
function getPageItems(currentPage: number, totalPages: number): (number | string)[] {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sortedPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  return sortedPages.flatMap((page, index) => {
    const gap = page - (sortedPages[index - 1] ?? page);
    if (gap === 2) return [page - 1, page];
    if (gap > 2) return [`ellipsis-${page}`, page];
    return [page];
  });
}
