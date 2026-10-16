import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useExposed, useLatest, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { clampPage, pageCountOf, pageItems } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { justify } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Pagination ------------------------------------------------------------------------------------------------------

const PAGE_RADIUS = 'tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const PAGE_IDLE =
  'tw-border tw-border-transparent tw-text-[color:var(--lk-fg,var(--sc-foreground))] hover:tw-bg-[color:var(--lk-hover,var(--sc-accent))] hover:tw-text-[color:var(--lk-fg,var(--sc-accent-foreground))]';

export const PAGE_ACTIVE =
  'tw-border tw-border-[color:var(--lk-on-border,color-mix(in_srgb,var(--sc-primary)_35%,var(--sc-input)))] tw-bg-[color:var(--lk-on-bg,var(--sc-accent-soft))] tw-text-[color:var(--lk-on-fg,var(--sc-primary-ink))] tw-shadow-sm hover:tw-bg-[color:var(--lk-on-bg,var(--sc-accent-soft))]';

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
  // Only the default page triggers it; the page count and the handlers are read from refs.
  const mounted = useRef(false);
  const goToDefault = useLatest(() => go(clampPage(p.defaultPageIndex, count)));
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    goToDefault.current();
  }, [p.defaultPageIndex, goToDefault]);
  // Fewer pages than the current one: stay on the last page.
  const exposeOne = useLatest(setExposedVariable);
  useEffect(() => {
    if (page > count) {
      setPage(count);
      exposeOne.current('currentPageIndex', count);
    }
  }, [count, page, exposeOne]);
  const shownPage = Math.min(page, count);
  useExposed(setExposedVariables, p, {
    totalPages: count,
    currentPageIndex: shownPage,
    setPage: async (n: unknown) => go(n),
  });
  const disabled = busy(p);
  const small = p.size === 'sm';
  const square = small ? 'tw-h-8 tw-min-w-8 tw-px-2 tw-text-xs' : 'tw-h-9 tw-min-w-9 tw-px-2.5 tw-text-ui2-sm';
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
  // Checked again whenever something that changes the pager's width renders: the step, the page, the buttons, the size.
  const { siblingCount, showFirstLast, showLabels, loadingState } = p;
  useLayoutEffect(() => {
    const list = navRef.current?.querySelector('ul');
    const first = list?.firstElementChild;
    if (!list || !(first instanceof HTMLElement) || fit.level >= 2) return;
    if (list.offsetHeight > first.offsetHeight * 1.5) setFit((f) => ({ ...f, level: f.level + 1 }));
  }, [fit, shownPage, count, siblingCount, showFirstLast, showLabels, small, loadingState, props.styles]);
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
          'tw-tabular-nums tw-shadow-none',
          active ? PAGE_ACTIVE : PAGE_IDLE,
          wide && (small ? 'tw-gap-1 tw-px-2.5' : 'tw-gap-1 tw-px-3')
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
        className={cn('tw-flex tw-w-full tw-items-center tw-gap-3', justify(props.styles))}
      >
        <ul className="tw-m-0 tw-flex tw-list-none tw-flex-row tw-flex-wrap tw-items-center tw-gap-1 tw-p-0">
          {p.showFirstLast === true
            ? button('first', {
                label: 'Go to first page',
                onClick: () => go(1),
                isDisabled: shownPage <= 1,
                children: <ChevronsLeft className="tw-h-4 tw-w-4" />,
              })
            : null}
          {button('prev', {
            label: 'Go to previous page',
            onClick: () => go(shownPage - 1),
            isDisabled: shownPage <= 1,
            wide: labelled,
            children: (
              <>
                <ChevronLeft className="tw-h-4 tw-w-4" />
                {labelled ? <span>Previous</span> : null}
              </>
            ),
          })}
          {items.map((item) =>
            typeof item === 'string' ? (
              <li key={item} aria-hidden="true">
                <span
                  className={cn(
                    'tw-flex tw-items-center tw-justify-center tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]',
                    small ? 'tw-h-8 tw-w-8' : 'tw-h-9 tw-w-9'
                  )}
                >
                  <MoreHorizontal className="tw-h-4 tw-w-4" />
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
                <ChevronRight className="tw-h-4 tw-w-4" />
              </>
            ),
          })}
          {p.showFirstLast === true
            ? button('last', {
                label: 'Go to last page',
                onClick: () => go(count),
                isDisabled: shownPage >= count,
                children: <ChevronsRight className="tw-h-4 tw-w-4" />,
              })
            : null}
        </ul>
        {p.loadingState ? <Spinner /> : null}
      </nav>
    </Shell>
  );
};

export default withControlState(ShadPagination);
