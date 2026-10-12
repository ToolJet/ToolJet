// What the footer of a table shows. In the shadcn look a table whose rows fit on one page shows no pager (a lone
// "1" and "N Records" read as unfinished chrome under a short table): its footer keeps only what it has to act on, the
// buttons or the save and discard bar of unsaved edits, and is left out when there is neither. Server-side paging
// knows more pages than the rows in hand, so it always keeps the pager.
export const footerPlan = ({ look, pageCount, serverSide, editedCount, hasButtons }) => {
  if (look !== 'shadcn' || serverSide || pageCount > 1) return 'full';
  return hasButtons || editedCount > 0 ? 'noPager' : 'none';
};
