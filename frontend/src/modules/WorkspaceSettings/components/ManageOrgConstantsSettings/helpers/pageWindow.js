export const ELLIPSIS = '…';
const MAX_SLOTS = 7;

// The page numbers to show: first and last always, the current page with a neighbour each side, and an ellipsis
// for each gap. Always MAX_SLOTS entries once there are more pages than that, so the bar keeps its width.
export function pageWindow(page, totalPages) {
  if (totalPages <= MAX_SLOTS) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (page <= 4) return [...range(1, 5), ELLIPSIS, totalPages];
  if (page >= totalPages - 3) return [1, ELLIPSIS, ...range(totalPages - 4, totalPages)];
  return [1, ELLIPSIS, page - 1, page, page + 1, ELLIPSIS, totalPages];
}
