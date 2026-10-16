import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { clampPage, pageCountOf, pageItems } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { justify } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Pagination ------------------------------------------------------------------------------------------------------

const PAGE_RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const PAGE_IDLE =
  'border border-transparent text-[color:var(--lk-fg,var(--sc-foreground))] hover:bg-[color:var(--lk-hover,var(--sc-accent))] hover:text-[color:var(--lk-fg,var(--sc-accent-foreground))]';

export const PAGE_ACTIVE =
  'border border-[color:var(--lk-on-border,var(--sc-input))] bg-[color:var(--lk-on-bg,var(--sc-background))] text-[color:var(--lk-on-fg,var(--sc-foreground))] shadow-sm hover:bg-[color:var(--lk-on-bg,var(--sc-accent))]';

interface PageButton {
  label: string;
  onClick: () => void;
  active?: boolean;
  isDisabled?: boolean;
  children: ReactNode;
  wide?: boolean;
}

export const ShadPagination = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent } = props;
  const count = pageCountOf(p);
  const [page, setPage] = useState(() => clampPage(p.defaultPageIndex, count));
  const live = useRef({ page, count });
  live.current = { page, count };
  const go = (target: unknown) => {
    const { page: now, count: total } = live.current;
    const next = clampPage(target, total, now);
    if (next === now) return;
    setPage(next);
    live.current.page = next;
    setExposedVariable('currentPageIndex', next);
    fireEvent('onPageChange');
  };
  // A changed default page moves the pager (and fires onPageChange), as the native Pagination does.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    go(clampPage(p.defaultPageIndex, count));
  }, [p.defaultPageIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  // Fewer pages than the current one: stay on the last page.
  useEffect(() => {
    if (page > count) {
      setPage(count);
      setExposedVariable('currentPageIndex', count);
    }
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownPage = Math.min(page, count);
  useExposed(setExposedVariables, p, {
    totalPages: count,
    currentPageIndex: shownPage,
    setPage: async (n: unknown) => go(n),
  });
  const disabled = busy(p);
  const small = p.size === 'sm';
  const square = small ? 'h-8 min-w-8 px-2 text-xs' : 'h-9 min-w-9 px-2.5 text-sm';
  // Too narrow for the whole pager, it drops the Previous and Next words, then the pages beside the current one, before
  // it would wrap: at 445px a ten-page pager put Next on a second line, below the widget's box. Decided before paint;
  // a new width or page count starts again from the whole pager.
  const navRef = useRef<HTMLElement>(null);
  const [fit, setFit] = useState({ level: 0, width: 0 });
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      setFit((f) => (f.width === width ? f : { level: 0, width }));
    });
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => setFit((f) => (f.level ? { ...f, level: 0 } : f)), [count]);
  useLayoutEffect(() => {
    const list = navRef.current?.querySelector('ul');
    const first = list?.firstElementChild;
    if (!list || !(first instanceof HTMLElement) || fit.level >= 2) return;
    if (list.offsetHeight > first.offsetHeight * 1.5) setFit((f) => ({ ...f, level: f.level + 1 }));
  });
  const labelled = p.showLabels !== false && fit.level < 1;
  const button = (key: string, { label, onClick, active, isDisabled, children, wide }: PageButton) => (
    <li key={key}>
      <Button
        type="button"
        variant="ghost"
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        disabled={disabled || isDisabled}
        onClick={onClick}
        className={cn(
          PAGE_RADIUS,
          square,
          'tabular-nums shadow-none',
          active ? PAGE_ACTIVE : PAGE_IDLE,
          wide && (small ? 'gap-1 px-2.5' : 'gap-1 px-3')
        )}
      >
        {children}
      </Button>
    </li>
  );
  const items = pageItems(shownPage, count, fit.level >= 2 ? 0 : p.siblingCount ?? 1);
  return (
    <Shell {...props}>
      <nav
        ref={navRef}
        role="navigation"
        aria-label="pagination"
        className={cn('flex w-full items-center gap-3', justify(props.styles))}
      >
        <ul className="m-0 flex list-none flex-row flex-wrap items-center gap-1 p-0">
          {p.showFirstLast === true
            ? button('first', {
                label: 'Go to first page',
                onClick: () => go(1),
                isDisabled: shownPage <= 1,
                children: <ChevronsLeft className="h-4 w-4" />,
              })
            : null}
          {button('prev', {
            label: 'Go to previous page',
            onClick: () => go(shownPage - 1),
            isDisabled: shownPage <= 1,
            wide: labelled,
            children: (
              <>
                <ChevronLeft className="h-4 w-4" />
                {labelled ? <span>Previous</span> : null}
              </>
            ),
          })}
          {items.map((item) =>
            typeof item === 'string' ? (
              <li key={item} aria-hidden="true">
                <span
                  className={cn(
                    'flex items-center justify-center text-[color:var(--lk-fg,var(--sc-muted-foreground))]',
                    small ? 'h-8 w-8' : 'h-9 w-9'
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              </li>
            ) : (
              button(`page-${item}`, {
                label: `Page ${item}`,
                onClick: () => go(item),
                active: item === shownPage,
                children: item,
              })
            )
          )}
          {button('next', {
            label: 'Go to next page',
            onClick: () => go(shownPage + 1),
            isDisabled: shownPage >= count,
            wide: labelled,
            children: (
              <>
                {labelled ? <span>Next</span> : null}
                <ChevronRight className="h-4 w-4" />
              </>
            ),
          })}
          {p.showFirstLast === true
            ? button('last', {
                label: 'Go to last page',
                onClick: () => go(count),
                isDisabled: shownPage >= count,
                children: <ChevronsRight className="h-4 w-4" />,
              })
            : null}
        </ul>
        {p.loadingState ? <Spinner /> : null}
      </nav>
    </Shell>
  );
};

export default withControlState(ShadPagination);
