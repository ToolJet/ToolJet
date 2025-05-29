import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';
const ObjectNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: '#FF7F0E' }}>
      <OverflowTooltip maxLetters={32} style={{ width: '100%' }}>{`{${Object.keys(value).length}}`}</OverflowTooltip>
    </div>
  );
};

export default ObjectNode;
