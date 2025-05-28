import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

const NullNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: '#ca3973' }}>
      <OverflowTooltip style={{ width: '100%' }}>{value === null ? 'null' : 'undefined'}</OverflowTooltip>
    </div>
  );
};

export default NullNode;
