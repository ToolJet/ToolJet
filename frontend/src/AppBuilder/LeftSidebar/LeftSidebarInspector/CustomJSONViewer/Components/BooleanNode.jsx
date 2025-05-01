import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

const BooleanNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: '#9467BD' }}>
      <OverflowTooltip style={{ width: '100%' }}>{value.toString()}</OverflowTooltip>
    </div>
  );
};

export default BooleanNode;
