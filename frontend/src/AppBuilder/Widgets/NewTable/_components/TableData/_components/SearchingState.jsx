import React, { memo } from 'react';
import { ProgressSpinner } from '../../ProgressSpinner';

const CENTERED = { top: '50%', left: '50%', transform: 'translateY(-50%) translateX(-50%)' };
// Over the rows found so far, when the search box (with its spinner) isn't shown.
const FLOATING = {
  bottom: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 11,
  padding: '4px 10px',
  borderRadius: 6,
  background: 'var(--cc-surface1-surface)',
  border: '1px solid var(--cc-weak-border)',
};

// While a search or filter over many rows runs: in place of the rows until the first is found (they fill in as found),
// or `floating` over them.
export const SearchingState = memo(({ label, floating = false, componentName }) => {
  return (
    <div
      className="d-flex align-items-center custom-gap-8 justify-content-center"
      role="status"
      data-cy={`${componentName}-searching-state`}
      style={{
        position: 'absolute',
        ...(floating ? FLOATING : CENTERED),
        color: 'var(--cc-weak-icon, var(--cc-default-icon))',
      }}
    >
      <ProgressSpinner />
      <div className="warning-no-data-text">{label}…</div>
    </div>
  );
});
