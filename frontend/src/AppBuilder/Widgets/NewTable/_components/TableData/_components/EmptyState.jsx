import React, { memo } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

// The empty table's body (its one row): under the header row, across the table's full width, as tall as the space
// the table has below its header (table.scss, .tj-table-empty-body). It is in the flow, not placed absolutely:
// absolutely placed, it took no room, so the shadcn look (which sizes the table to its rows) drew a table as tall as
// its header, with the icon in the header row and the message cut off.
export const EmptyState = memo(() => {
  return (
    <div className="tj-table-empty-body" data-cy="table-empty-state">
      <div className="d-flex flex-column align-items-center custom-gap-8">
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
