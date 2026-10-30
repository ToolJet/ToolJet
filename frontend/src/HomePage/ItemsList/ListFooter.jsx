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
import { ITEMS_PER_PAGE, useItemsListStore } from './store/itemsListStore';

// Shared with the loading footer so both keep the same height and border.
export const FOOTER_CLASS =
  'tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-justify-between tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-[4.375rem]';

// First, last and the current page's neighbours; a gap of one page shows that page instead of an ellipsis.
function getPageItems(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sortedPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  return sortedPages.flatMap((page, index) => {
    const gap = page - (sortedPages[index - 1] ?? page);
    if (gap === 2) return [page - 1, page];
    if (gap > 2) return [`ellipsis-${page}`, page];
    return [page];
  });
}

// Defaults to the root list's page; pass `meta` to paginate another list, e.g. the folder opened in grid view.
export default function ListFooter({ meta: metaProp, itemLabel = 'items' }) {
  const rootMeta = useItemsListStore((state) => state.root.meta);
  const setPage = useItemsListStore((state) => state.setPage);
  const meta = metaProp ?? rootMeta;

  if (!meta?.total_count) return null;

  const { current_page: currentPage, total_pages: totalPages, total_count: totalCount } = meta;
  const perPage = meta.per_page ?? ITEMS_PER_PAGE;
  const firstItem = (currentPage - 1) * perPage + 1;
  const lastItem = Math.min(currentPage * perPage, totalCount);

  // Rocket's links are anchors; href="#" keeps them keyboard-focusable, so the navigation itself is prevented.
  const goToPage = (page) => (event) => {
    event.preventDefault();
    setPage(page);
  };

  return (
    <div className={FOOTER_CLASS}>
      <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">
        Showing {firstItem}-{lastItem} of {totalCount} {itemLabel}
      </p>

      <Pagination className="tw-mx-0 tw-w-auto">
        <PaginationContent className="tw-m-0 tw-p-0">
          <PaginationItem>
            <PaginationPrevious href="#" disabled={currentPage === 1} onClick={goToPage(currentPage - 1)} />
          </PaginationItem>
          {getPageItems(currentPage, totalPages).map((page) =>
            typeof page === 'string' ? (
              <PaginationItem key={page}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink href="#" isActive={page === currentPage} onClick={goToPage(page)}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext href="#" disabled={currentPage === totalPages} onClick={goToPage(currentPage + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
