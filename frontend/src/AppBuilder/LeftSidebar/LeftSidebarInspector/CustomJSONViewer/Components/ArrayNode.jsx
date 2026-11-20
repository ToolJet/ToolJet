import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

const ArrayNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: 'var(--blue11)' }}>
      <OverflowTooltip
        tooltipClassName="inspector-node-tooltip"
        style={{ width: '100%' }}
      >{`[${value.length}]`}</OverflowTooltip>
    </div>
  );
};

export default ArrayNode;
