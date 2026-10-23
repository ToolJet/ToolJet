import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/cn';
import { own, pageItems } from '../lib/ui2/nav/model';
import { lookVars, px } from '../lib/ui2/nav/look';
import '../styles/ui2-nav.css';

const JUSTIFY: Record<string, string> = { left: 'n2-justify-left', center: 'n2-justify-center', right: 'n2-justify-right' };
const finite = (v: unknown, fallback: number) => {
  const n = Number(v);
  return v !== '' && v !== null && v !== undefined && Number.isFinite(n) ? n : fallback;
};

// UI 2.0 Pagination: page numbers with gaps, Previous / Next (and First / Last). Too narrow for the whole pager, it
// drops the Previous and Next words, then the pages beside the current one, before it would wrap.
export const Pagination = () => {
  const [numberOfPages] = ToolJet.useStateNumber({ name: 'numberOfPages', label: 'Number of pages', description: 'Ignored when total records is set.', initialValue: 10 });
  const [totalRecords] = ToolJet.useStateString({ name: 'totalRecords', label: 'Total records (instead of pages)', initialValue: '' });
  const [pageSize] = ToolJet.useStateNumber({ name: 'pageSize', label: 'Page size (with total records)', initialValue: 10 });
  const [defaultPageIndex] = ToolJet.useStateNumber({ name: 'defaultPageIndex', label: 'Default page index', initialValue: 1 });
  const [currentPageIndex, setCurrentPageIndex] = ToolJet.useStateNumber({ name: 'currentPageIndex', label: 'Current page', initialValue: 1 });
  const [siblingCount] = ToolJet.useStateNumber({ name: 'siblingCount', label: 'Pages beside the current one', initialValue: 1, min: 0, max: 5 });
  const [showFirstLast] = ToolJet.useStateBoolean({ name: 'showFirstLast', label: 'First and last buttons', initialValue: false });
  const [showLabels] = ToolJet.useStateBoolean({ name: 'showLabels', label: 'Previous / Next labels', initialValue: true });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default'],
    enumLabels: { sm: 'Sm', default: 'Default' },
    initialValue: 'default',
    inspector: 'switch',
  });
  const [, setTotalPages] = ToolJet.useStateNumber({ name: 'totalPages', initialValue: 10, inspector: 'hidden' });
  const onPageChange = ToolJet.useEventCallback({ name: 'onPageChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Page text color', inspector: 'color', initialValue: '' });
  const hoverBackgroundColor = ToolJet.useStyleString({ name: 'hoverBackgroundColor', label: 'Hover background', inspector: 'color', initialValue: '' });
  const activeBackgroundColor = ToolJet.useStyleString({ name: 'activeBackgroundColor', label: 'Current page background', inspector: 'color', initialValue: '' });
  const activeTextColor = ToolJet.useStyleString({ name: 'activeTextColor', label: 'Current page text color', inspector: 'color', initialValue: '' });
  const activeBorderColor = ToolJet.useStyleString({ name: 'activeBorderColor', label: 'Current page border color', inspector: 'color', initialValue: '' });
  const radius = ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Button radius', initialValue: '' });
  const alignment = ToolJet.useStyleEnumeration({ name: 'alignment', label: 'Alignment', enumDefinition: ['left', 'center', 'right'], initialValue: 'left', inspector: 'switch' });
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 4 });

  // numberOfPages, else ceil(totalRecords / pageSize) when both are given; at least 1, at most 1e6.
  const records = finite(totalRecords, NaN);
  const count =
    Number.isFinite(records) && records >= 0
      ? Math.max(1, Math.min(1e6, Math.ceil(records / Math.max(1, finite(pageSize, 10)))))
      : Math.max(1, Math.min(1e6, Math.floor(finite(numberOfPages, 1))));
  const page = Math.min(count, Math.max(1, Math.floor(finite(currentPageIndex, 1))));
  const live = useRef({ page, count });
  live.current = { page, count };
  const go = (target: unknown, fire = true) => {
    const { page: now, count: total } = live.current;
    const next = Math.min(total, Math.max(1, Math.floor(finite(target, now))));
    if (next === now) return;
    live.current.page = next;
    setCurrentPageIndex(next);
    if (fire) onPageChange();
  };
  useEffect(() => setTotalPages(count), [count, setTotalPages]);
  // A changed default page moves the pager and fires onPageChange, as the native Pagination does; on the first render
  // it only sets the page.
  const mounted = useRef(false);
  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (first && Number(defaultPageIndex) === 1) return;
    go(defaultPageIndex, !first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPageIndex]);
  // Fewer pages than the current one: stay on the last page.
  useEffect(() => {
    if (Number(currentPageIndex) > count) setCurrentPageIndex(count);
  }, [count, currentPageIndex, setCurrentPageIndex]);
  ToolJet.useAction({ name: 'setPage', displayName: 'Set page', params: [{ handle: 'page', displayName: 'Page' }] }, (p) => go(p));

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
  }, [fit, page, count, siblingCount, showFirstLast, showLabels, size]);

  const small = size === 'sm';
  const labelled = showLabels !== false && fit.level < 1;
  const button = (key: string, label: string, onClick: () => void, children: React.ReactNode, opts: { active?: boolean; off?: boolean; wide?: boolean } = {}) => (
    <li key={key}>
      <button
        type="button"
        aria-label={label}
        aria-current={opts.active ? 'page' : undefined}
        disabled={disabled || opts.off}
        onClick={onClick}
        className={cn('n2-page', opts.active && 'is-active', opts.wide && 'is-wide')}
      >
        {children}
      </button>
    </li>
  );
  const items = pageItems(page, count, fit.level >= 2 ? 0 : finite(siblingCount, 1));
  return (
    <nav
      ref={navRef}
      aria-label="pagination"
      className={cn('ui n2-pagination', small && 'is-sm', own(JUSTIFY, alignment) ?? JUSTIFY.left)}
      style={lookVars([
        [textColor, '--lk-fg'],
        [hoverBackgroundColor, '--lk-hover'],
        [activeBackgroundColor, '--lk-on-bg'],
        [activeTextColor, '--lk-on-fg'],
        [activeBorderColor, '--lk-on-border'],
        [radius, '--lk-radius', px],
      ])}
    >
      <ul>
        {showFirstLast ? button('first', 'Go to first page', () => go(1), <ChevronsLeft size={16} />, { off: page <= 1 }) : null}
        {button(
          'prev',
          'Go to previous page',
          () => go(page - 1),
          <>
            <ChevronLeft size={16} />
            {labelled ? <span>Previous</span> : null}
          </>,
          { off: page <= 1, wide: labelled }
        )}
        {items.map((item) =>
          typeof item === 'string' ? (
            <li key={item} aria-hidden="true">
              <span className="n2-page-gap">
                <MoreHorizontal size={16} />
              </span>
            </li>
          ) : (
            button(`page-${item}`, `Page ${item}`, () => go(item), item, { active: item === page })
          )
        )}
        {button(
          'next',
          'Go to next page',
          () => go(page + 1),
          <>
            {labelled ? <span>Next</span> : null}
            <ChevronRight size={16} />
          </>,
          { off: page >= count, wide: labelled }
        )}
        {showFirstLast ? button('last', 'Go to last page', () => go(count), <ChevronsRight size={16} />, { off: page >= count }) : null}
      </ul>
      {loading ? <span className="n2-spinner" /> : null}
    </nav>
  );
};
