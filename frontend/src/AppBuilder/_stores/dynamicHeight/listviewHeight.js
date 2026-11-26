// ─────────────────────────────────────────────────────────────────────────────
// List view heights: the native List view repeats one row of components per
// data row. Each row is as tall as its own content (a Text that grew in row 2
// makes row 2 taller only), and the widget is its rows stacked plus its chrome.
//
// Pure arithmetic: what a row's content bottom is (its components solved at
// that row) is worked out by the engine and passed in.
// ─────────────────────────────────────────────────────────────────────────────

// The pagination bar under the rows.
const PAGINATION_BAR_HEIGHT = 61;
// 7px padding and a 1px border, top and bottom, plus 2px for the canvas
// drawing 1px past it (`calc(100% + 1px)`) and rounding.
const OUTER_CHROME = 18;
const DEFAULT_ROWS_PER_PAGE = 10;

// Rows the current page draws. With data bound to the list, the selector holds
// the resolved rows themselves; with "Raw JSON" they are in `data`.
export const listviewRowCount = (properties = {}) => {
  const { dataSourceSelector, data, enablePagination = false, rowsPerPage } = properties;
  const rows = dataSourceSelector === 'rawJson' ? data : dataSourceSelector;
  const total = Array.isArray(rows) ? rows.length : 0;
  if (!enablePagination) return total;
  return Math.min(Number(rowsPerPage) || DEFAULT_ROWS_PER_PAGE, total);
};

// One row's height: its content, whether or not Dynamic height is on (a row
// always fits what is on it). An empty row takes the Row height property, or
// the list's drawn height when that is not set.
export const listviewRowHeight = ({ contentBottom, properties = {}, savedHeight }) =>
  contentBottom > 0 ? contentBottom : (properties.rowHeight ?? savedHeight);

// The height to assume for a row that has not been sized yet: what the row's
// components fill as saved, else the Row height property, else the list's
// drawn height.
export const listviewFallbackRowHeight = ({ templateBottom, properties = {}, savedHeight }) =>
  templateBottom || properties.rowHeight || savedHeight || 0;

// Rows side by side in grid mode: each band of `columns` rows is as tall as
// its tallest row.
const stackBands = (rowHeights, columns) => {
  let total = 0;
  for (let first = 0; first < rowHeights.length; first += columns) {
    total += Math.max(...rowHeights.slice(first, first + columns));
  }
  return total;
};

/**
 * The List view widget's height: its rows stacked, plus a pixel of border per
 * row in list mode, the pagination bar and its outer chrome. Not floored at the
 * drawn height; whether it may go below that is the caller's call.
 * @param {object} options
 * @param {object} options.properties  the list's resolved properties
 * @param {Array<number|undefined>} options.rowHeights  each drawn row's height; undefined when not sized yet
 * @param {number} options.fallbackRowHeight  used for a row not sized yet (`listviewFallbackRowHeight`)
 */
export const listviewHeight = ({ properties = {}, rowHeights, fallbackRowHeight }) => {
  const heights = rowHeights.map((height) => height ?? fallbackRowHeight);
  const isGrid = properties.mode === 'grid';
  const columns = Math.max(Number(properties.columns) || 1, 1);

  const rows = isGrid ? stackBands(heights, columns) : heights.reduce((total, height) => total + height, 0);
  const rowBorders = properties.showBorder && !isGrid ? heights.length : 0;
  const pagination = properties.enablePagination ? PAGINATION_BAR_HEIGHT : 0;

  return rows + rowBorders + pagination + OUTER_CHROME;
};
