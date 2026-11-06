import React from 'react';

function summarize({ status, meta, itemCount }) {
  // Hidden until this list's own response arrived, so a tab switch never shows the previous tab's numbers.
  if (status !== 'success' || !meta) return null;
  if (meta.total === 0) return 'Showing 0 items';
  const from = (meta.page - 1) * meta.page_size + 1;
  return `Showing ${from}-${from + itemCount - 1} of ${meta.total} items`;
}

// The bar always renders so the layout does not jump when the summary appears.
export default function ConstantsTableFooter({ status, meta, itemCount }) {
  const summary = summarize({ status, meta, itemCount });
  return (
    <footer className="tw-sticky tw-bottom-0 tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-px-[70px] tw-font-body-default tw-text-text-placeholder">
      {summary}
    </footer>
  );
}
