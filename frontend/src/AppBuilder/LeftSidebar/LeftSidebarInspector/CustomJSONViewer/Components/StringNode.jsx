import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

const StringNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: '#2CA02C' }}>
      <OverflowTooltip tooltipClassName="inspector-node-tooltip" maxLetters={32}>{`"${value}"`}</OverflowTooltip>
    </div>
  );
};

export default StringNode;
