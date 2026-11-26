import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

const BooleanNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: 'var(--purple11)' }}>
      <OverflowTooltip tooltipClassName="inspector-node-tooltip" style={{ width: '100%' }}>
        {value.toString()}
      </OverflowTooltip>
    </div>
  );
};

export default BooleanNode;
