import React, { memo } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const EmptyState = memo(() => {
  return (
    <div
      className="d-flex flex-column align-items-center custom-gap-8 justify-content-center h-100"
      style={{
        position: 'absolute',
        // Centred in the body under the header row (about 40px), not in the whole table: in a short empty table the
        // icon touched the header's rule.
        top: 'calc(50% + 20px)',
        left: '50%',
        transform: 'translateY(-50%) translateX(-50%)',
      }}
    >
      <div className="warning-no-data">
        <div className="warning-svg-wrapper">
          <SolidIcon name="warning" width="16" />
        </div>
      </div>
      <div className="warning-no-data-text">No data</div>
    </div>
  );
});
