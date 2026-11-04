// Numbered buttons shown around the current page: one, or a window of three that stops at both ends.
export const getPageNumbers = (page, pageCount, maxPageButtons = 3) => {
  if (maxPageButtons <= 1) return [page];
  if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 2) return [1, 2, 3];
  if (page >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
  return [page - 1, page, page + 1];
};

// Widest widget that still fits `‹ 1 ›` is 140px; 28px buttons with 4px gaps need 188px for `‹ 1 2 3 ••• ›`
// and 124px for `‹ 1 ••• ›`. The cut-offs sit between the three Figma frames (260, 180, 140px).
export const PAGER_FULL_MIN_WIDTH = 220;
export const PAGER_COMPACT_MIN_WIDTH = 160;

// Width steps for a pager inside a widget: three numbers and the page list, one number and the page list, or one number.
export const getWidthRule = (width) => {
  if (width >= PAGER_FULL_MIN_WIDTH) return { maxPageButtons: 3, showPageList: true };
  if (width >= PAGER_COMPACT_MIN_WIDTH) return { maxPageButtons: 1, showPageList: true };
  return { maxPageButtons: 1, showPageList: false };
};
