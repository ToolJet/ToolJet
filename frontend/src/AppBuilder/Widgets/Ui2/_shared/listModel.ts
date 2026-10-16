// ToolJet UI 2.0 List view: paging and the look, kept apart from the component so they are tested on
// their own.
import type { CSSProperties } from 'react';
import type { CssVars, Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';

const isSet = (value: unknown): boolean => value !== undefined && value !== null && String(value).trim() !== '';
const px = (value: unknown): string => (/^\d+(\.\d+)?$/.test(String(value).trim()) ? `${value}px` : String(value));
const positive = (value: unknown, fallback: number): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** The items to show and the paging state. Client side slices the data; server side shows the data as the page and
 *  counts pages from totalRecords (pageCount null when the total is unknown: next stays possible while a full page
 *  came back). `page` is 1-based and clamped into range. */
/** How a list pages: rowsPerPage and totalRecords are bound values (junk falls back to 10 rows, an unknown total). */
export interface PageOptions {
  enablePagination?: boolean;
  serverSidePagination?: boolean;
  rowsPerPage?: unknown;
  totalRecords?: unknown;
  page?: number;
}

/** The items on the current page and the paging state. */
export interface ListPage<T> {
  items: T[];
  /** Null when the server-side total is unknown. */
  pageCount: number | null;
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const pageOf = <T>(
  data: T[] | null | undefined,
  { enablePagination, serverSidePagination, rowsPerPage, totalRecords, page }: PageOptions = {}
): ListPage<NonNullable<T>> => {
  const rows = Array.isArray(data)
    ? data.filter((row): row is NonNullable<T> => row !== undefined && row !== null)
    : [];
  const size = positive(rowsPerPage, 10);
  const wanted = positive(page, 1);
  if (!enablePagination) return { items: rows, pageCount: 1, page: 1, hasNext: false, hasPrevious: false };
  if (serverSidePagination) {
    const total = positive(totalRecords, 0);
    const pageCount = total ? Math.max(1, Math.ceil(total / size)) : null;
    const current = pageCount ? Math.min(wanted, pageCount) : wanted;
    return {
      items: rows,
      pageCount,
      page: current,
      hasPrevious: current > 1,
      hasNext: pageCount ? current < pageCount : rows.length >= size,
    };
  }
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(wanted, pageCount);
  const start = (current - 1) * size;
  return {
    items: rows.slice(start, start + size),
    pageCount,
    page: current,
    hasPrevious: current > 1,
    hasNext: current < pageCount,
  };
};

/** A stable key for an item: its id field when it has one, else its position. */
export const itemKey = (item: unknown, idField: string, index: number): string =>
  item && typeof item === 'object' && isSet((item as Record<string, unknown>)[idField])
    ? String((item as Record<string, unknown>)[idField])
    : `#${index}`;

const SHADOWS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 10px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -6px rgb(0 0 0 / 0.16)',
};

const VARIABLES: [styleKey: string, cssVar: string][] = [
  ['accentColor', '--sc-primary'],
  ['itemHoverBackgroundColor', '--lv-hover-bg'],
  ['selectedItemBackgroundColor', '--lv-selected-bg'],
  ['dividerColor', '--lv-divider'],
  ['itemBorderColor', '--lv-item-border'],
  ['emptyTextColor', '--lv-empty'],
];

/** The list's look: variables for its root, each item's style, whether items draw a border, and the list's own
 *  background and padding. */
export interface ListLook {
  vars: CssVars;
  item: CSSProperties;
  framed: boolean;
  background: string;
  padding: string;
}

export const listLook = (styles: Resolved = {}): ListLook => ({
  vars: Object.fromEntries(
    VARIABLES.filter(([key]) => isSet(styles[key])).map(([key, name]) => [name, String(styles[key])])
  ),
  item: {
    // Outlined card: the theme's card surface and radius; each set colour or radius below still wins.
    ...(styles.itemVariant === 'outline' ? { background: 'var(--sc-card)', borderRadius: 'var(--sc-radius)' } : {}),
    ...(isSet(styles.itemBackgroundColor) ? { background: styles.itemBackgroundColor } : {}),
    ...(isSet(styles.itemBorderRadius) ? { borderRadius: px(styles.itemBorderRadius) } : {}),
    boxShadow: SHADOWS[styles.itemShadow] ?? (isSet(styles.itemShadow) ? styles.itemShadow : 'none'),
  },
  // The pack's base styles zero every border with !important, so an inline border never drew: a framed item takes
  // the border class instead, coloured by --lv-item-border (Item border color) or the theme border.
  framed: styles.itemVariant === 'outline' || isSet(styles.itemBorderColor),
  background: isSet(styles.backgroundColor) ? styles.backgroundColor : 'transparent',
  padding: isSet(styles.padding) ? px(styles.padding) : '0px',
});
