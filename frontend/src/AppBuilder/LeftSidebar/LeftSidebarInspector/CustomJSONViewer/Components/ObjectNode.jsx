import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';
const ObjectNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: 'var(--orange11)' }}>
      <OverflowTooltip tooltipClassName="inspector-node-tooltip" style={{ width: '100%' }}>
        {
          // Empty reads as {} rather than {0} (DB-11b).
          Object.keys(value).length ? `{${Object.keys(value).length}}` : '{}'
        }
      </OverflowTooltip>
    </div>
  );
};

export default ObjectNode;
