import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

const ArrayNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: '#1F99ED' }}>
      <OverflowTooltip maxLetters={32} style={{ width: '100%' }}>{`[${value.length}]`}</OverflowTooltip>
    </div>
  );
};

export default ArrayNode;
