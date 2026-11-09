import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/Rocket';
import { ELLIPSIS, pageWindow } from '../helpers/pageWindow';

function summarize({ status, meta, itemCount }) {
  // Hidden until this list's own response arrived, so a tab switch never shows the previous tab's numbers.
  if (status !== 'success' || !meta) return null;
  if (meta.total === 0) return 'Showing 0 items';
  const from = (meta.page - 1) * meta.page_size + 1;
  return `Showing ${from}-${from + itemCount - 1} of ${meta.total} items`;
}

function PageNav({ page, totalPages, onPageChange }) {
  // A link without an href is neither focusable nor a link to assistive tech, so each gets `#` and cancels it.
  const goTo = (target) => (event) => {
    event.preventDefault();
    if (target !== page && target >= 1 && target <= totalPages) onPageChange(target);
  };
  return (
    <Pagination className="tw-mx-0 tw-w-auto">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" disabled={page <= 1} onClick={goTo(page - 1)} />
        </PaginationItem>
        {pageWindow(page, totalPages).map((entry, index) => (
          <PaginationItem key={entry === ELLIPSIS ? `gap-${index}` : entry}>
            {entry === ELLIPSIS ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href="#" isActive={entry === page} onClick={goTo(entry)}>
                {entry}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="#" disabled={page >= totalPages} onClick={goTo(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

// The bar always renders so the layout does not jump when the summary appears.
export default function ConstantsTableFooter({ status, meta, itemCount, onPageChange }) {
  const summary = summarize({ status, meta, itemCount });
  const totalPages = status === 'success' && meta ? Math.ceil(meta.total / meta.page_size) : 0;
  return (
    <footer className="tw-sticky tw-bottom-0 tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-justify-between tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-px-[70px] tw-font-body-default tw-text-text-placeholder">
      <span>{summary}</span>
      {totalPages > 1 && <PageNav page={meta.page} totalPages={totalPages} onPageChange={onPageChange} />}
    </footer>
  );
}
