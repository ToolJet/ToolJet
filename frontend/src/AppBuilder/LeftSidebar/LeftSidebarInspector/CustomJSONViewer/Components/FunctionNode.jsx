import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

const FunctionNode = () => {
  return (
    <div className="json-viewer-node-value" style={{ color: '#4368E3' }}>
      <OverflowTooltip style={{ width: '100%' }}>function</OverflowTooltip>
    </div>
  );
};

export default FunctionNode;
