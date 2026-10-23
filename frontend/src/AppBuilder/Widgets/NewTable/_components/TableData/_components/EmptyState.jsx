import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

// The empty table's body (its one row): under the header row, across the table's full width, as tall as the space
// the table has below its header (table.scss, .tj-ntable-empty-body). It is in the flow, not placed absolutely:
// absolutely placed, it took no room, so the shadcn look (which sizes the table to its rows) drew a table as tall as
// its header, with the icon in the header row and the message cut off.
//
// In a table too short for it (110px: the toolbar and header leave 17px), the table's box cut the message to a sliver
// of its top. The message shows whole or not at all: hidden while the table's box cuts any of it.
export const EmptyState = memo(() => {
  const ref = useRef(null);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    const root = el?.closest('.jet-table');
    if (!el || !root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => setCut(entries[entries.length - 1].intersectionRatio < 0.98),
      { root, threshold: [0, 0.98, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`tj-ntable-empty-body${cut ? ' tj-ntable-empty-cut' : ''}`} data-cy="table-empty-state">
      <div ref={ref} className="d-flex flex-column align-items-center custom-gap-8">
        <div className="warning-no-data">
          <div className="warning-svg-wrapper">
            <SolidIcon name="warning" width="16" />
          </div>
        </div>
        <div className="warning-no-data-text">No data</div>
      </div>
    </div>
  );
});
