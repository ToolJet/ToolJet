import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui';

// shadcn/ui pack (experiment): the pager the List view and Table share. Page numbers around the current one (1 … 4 5 6
// … 20) when the page count is known, else previous / next only.

const pageWindow = (page, count) => {
  if (!count) return [page];
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
};

export const Pager = ({ page, pageCount, hasPrevious, hasNext, disabled, onPage }) => (
  <div className="flex items-center gap-1">
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0"
      aria-label="Previous page"
      disabled={!hasPrevious || disabled}
      onClick={() => onPage(page - 1)}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    {pageWindow(page, pageCount).map((p) =>
      typeof p === 'string' ? (
        <span key={p} className="px-1 text-xs text-muted-foreground">
          …
        </span>
      ) : (
        <Button
          key={p}
          variant={p === page ? 'outline' : 'ghost'}
          size="sm"
          className="h-8 min-w-8 px-2 tabular-nums"
          aria-current={p === page ? 'page' : undefined}
          disabled={disabled}
          onClick={() => p !== page && onPage(p)}
        >
          {p}
        </Button>
      )
    )}
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0"
      aria-label="Next page"
      disabled={!hasNext || disabled}
      onClick={() => onPage(page + 1)}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);
