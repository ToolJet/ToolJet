// What the footer of a table shows. In the shadcn look a table whose rows fit on one page shows no pager (a lone
// "1" and "N Records" read as unfinished chrome under a short table); with no buttons or unsaved edits either, the
// footer is left out. Server-side paging knows more pages than the rows in hand, so it always keeps the pager.
export const footerPlan = ({ look, pageCount, serverSide, editedCount, hasButtons }) => {
  if (look !== 'shadcn' || serverSide || editedCount > 0 || pageCount > 1) return 'full';
  return hasButtons ? 'noPager' : 'none';
};
