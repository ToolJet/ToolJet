import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// Shared by the widget and the dynamic height calculation, so the measured height matches what renders.
export const NEW_LIST_STYLES = ['bordered', 'container', 'plain'];
export const LEGACY_PADDING = 7;
export const NEW_STYLE_PADDING = 12;
export const DIVIDER_WIDTH = 1;
// Fixed by design (Figma 238:1379, 294:45127): no setting and no drag-resize.
export const HEADER_HEIGHT = 60;
// Inside HEADER_HEIGHT, not added to it.
export const HEADER_DIVIDER_HEIGHT = 1;
// Pager footer (Figma 993:21793), divider inside; shared with the dynamic height calculation.
export const PAGER_FOOTER_HEIGHT = 60;

// A hand-written or bound Layout can be capitalised, so every reader goes through here.
export const getListviewMode = (mode) => String(mode ?? 'list').toLowerCase();

// A page size is a whole number of at least one: a negative runs the slice backwards and a fraction lands mid-record.
export const getRowsPerPage = (rowsPerPage) => {
  const requested = Math.floor(Number(rowsPerPage));
  return requested >= 1 ? requested : 10;
};

// Anything but a known new style is Legacy, so a saved ListView keeps today's look.
export const getListStyle = (listStyle) => (NEW_LIST_STYLES.includes(listStyle) ? listStyle : 'legacy');

export const getRecordGap = (listStyle, gap) => (listStyle === 'legacy' ? 0 : Math.max(0, Number(gap) || 0));

// Bordered puts half the gap on each side of a divider, so the first and last rows get that half too.
export const getVerticalEdgePadding = (listStyle, gap) => {
  if (listStyle === 'legacy') return LEGACY_PADDING;
  return listStyle === 'bordered' ? getRecordGap(listStyle, gap) / 2 : NEW_STYLE_PADDING;
};

// Saved grids have no gridRecordHeight and keep their rowHeight.
export const getRecordHeight = (mode, rowHeight, gridRecordHeight) =>
  getListviewMode(mode) === 'grid' ? (gridRecordHeight ?? rowHeight) : rowHeight;

// A card's 1px border sits inside the record (border-box), so both sides come off the row canvas.
export const getRecordBorderInset = (listStyle) => (listStyle === 'container' ? 2 : 0);

// The row canvas is sized from the widget width, so the wider padding, gaps and card borders come off it.
export const getRecordCanvasWidth = ({ listStyle, width, gap, recordsPerLine }) =>
  listStyle === 'legacy'
    ? width
    : width -
      2 * (NEW_STYLE_PADDING - LEGACY_PADDING) -
      (recordsPerLine - 1) * getRecordGap(listStyle, gap) -
      recordsPerLine * getRecordBorderInset(listStyle);

// Pixels of one canvas grid column inside a record, as the record's SubContainer computes it (Container.jsx).
export const getRecordColumnPx = ({ mode, listStyle, width, gap, columns }) => {
  const isGrid = getListviewMode(mode) === 'grid';
  const recordsPerLine = isGrid ? Math.max(1, Number(columns) || 1) : 1;
  const canvas = getRecordCanvasWidth({ listStyle: getListStyle(listStyle), width, gap, recordsPerLine });
  return (isGrid ? (canvas - 2) / recordsPerLine : canvas - 2) / NO_OF_GRIDS;
};
