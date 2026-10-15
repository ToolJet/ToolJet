// ToolJet UI 2.0 pack List view: paging and the look, kept apart from the component so they are tested on
// their own.

const isSet = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const px = (value) => (/^\d+(\.\d+)?$/.test(String(value).trim()) ? `${value}px` : String(value));
const positive = (value, fallback) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** The items to show and the paging state. Client side slices the data; server side shows the data as the page and
 *  counts pages from totalRecords (pageCount null when the total is unknown: next stays possible while a full page
 *  came back). `page` is 1-based and clamped into range. */
export const pageOf = (data, { enablePagination, serverSidePagination, rowsPerPage, totalRecords, page } = {}) => {
  const rows = Array.isArray(data) ? data.filter((row) => row !== undefined && row !== null) : [];
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
export const itemKey = (item, idField, index) =>
  item && typeof item === 'object' && isSet(item[idField]) ? String(item[idField]) : `#${index}`;

const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 10px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -6px rgb(0 0 0 / 0.16)',
};

const VARIABLES = [
  ['accentColor', '--sc-primary'],
  ['itemHoverBackgroundColor', '--lv-hover-bg'],
  ['selectedItemBackgroundColor', '--lv-selected-bg'],
  ['dividerColor', '--lv-divider'],
  ['itemBorderColor', '--lv-item-border'],
  ['emptyTextColor', '--lv-empty'],
];

export const listLook = (styles = {}) => ({
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
