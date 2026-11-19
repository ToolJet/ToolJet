import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Rocket';
import {
  ELLIPSIS,
  pageWindow,
} from '@/modules/WorkspaceSettings/components/ManageOrgConstantsSettings/helpers/pageWindow';

export const PAGE_SIZES = [50, 100, 200, 500, 1000];

interface FooterViewProps {
  page: number;
  pageSize: number;
  total: number;
  /** A page is on its way: the size select and Previous/Next are disabled, the count stays. */
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface PageNavProps {
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

function PageNav({ page, totalPages, loading, onPageChange }: PageNavProps) {
  // A link without an href is neither focusable nor a link to assistive tech, so each gets `#` and cancels it.
  const goTo = (target: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    if (target !== page && target >= 1 && target <= totalPages) onPageChange(target);
  };
  return (
    <Pagination className="tw-mx-0 tw-w-auto">
      {/* Preflight is off: the `ul` keeps its browser margin and padding, which made the bar taller than 48px. */}
      <PaginationContent className="tw-m-0 tw-p-0">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            disabled={loading || page <= 1}
            onClick={goTo(page - 1)}
            data-cy="previous-page-button"
          />
        </PaginationItem>
        {pageWindow(page, totalPages).map((entry, index) => (
          <PaginationItem key={entry === ELLIPSIS ? `gap-${index}` : entry}>
            {entry === ELLIPSIS ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href="#" isActive={entry === page} onClick={goTo(entry)} data-cy={`page-${entry}-button`}>
                {entry}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            disabled={loading || page >= totalPages}
            onClick={goTo(page + 1)}
            data-cy="next-page-button"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

// Fixed to the bottom of the page content wrap (`contain: layout` in styles.scss makes that wrap its containing block).
// It wraps to two rows when the wrap is narrow, and then covers the bottom of the grid.
export function FooterView({ page, pageSize, total, loading, onPageChange, onPageSizeChange }: FooterViewProps) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // No total yet: the first load of a table. An empty bar keeps the layout; "0 records" would be a lie.
  let content: React.ReactNode = null;
  if (total > 0) {
    content = (
      <>
        <span data-cy="total-records-section">{`Showing ${from}–${to} of ${total} records`}</span>
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-w-[136px]" data-cy="records-dropdown-field">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={loading}
            >
              <SelectTrigger size="small" aria-label="Records per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {`${size} records`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PageNav page={page} totalPages={totalPages} loading={loading} onPageChange={onPageChange} />
        </div>
      </>
    );
  } else if (!loading) {
    content = <span data-cy="total-records-section">Showing 0 records</span>;
  }

  return (
    <div
      className="tw-fixed tw-bottom-0 tw-left-0 tw-box-border tw-flex tw-min-h-12 tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-2.5 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-bg-page-weak tw-px-4 tw-pb-2.5 tw-pt-[9px] tw-font-body-default tw-text-text-placeholder"
      data-cy="table-footer-section"
    >
      {content}
    </div>
  );
}
