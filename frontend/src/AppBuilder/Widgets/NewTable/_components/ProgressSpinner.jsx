import React, { memo } from 'react';

// The Table's small spinner while a search or filter over many rows runs. Decorative: the text next to it, or the
// element it sits in, says what runs.
export const ProgressSpinner = memo((props) => (
  <div
    className="spinner-border spinner-border-sm"
    aria-hidden="true"
    style={{
      width: 14,
      height: 14,
      borderWidth: 2,
      flex: 'none',
      color: 'var(--cc-weak-icon, var(--cc-default-icon))',
    }}
    {...props}
  />
));
