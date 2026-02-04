import React, { useMemo } from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

const MAX_TOOLTIP_LENGTH = 500;

const StringNode = ({ value }) => {
  // Truncate large values to prevent tooltip from freezing when rendering massive strings
  const displayValue = useMemo(() => {
    if (typeof value === 'string' && value.length > MAX_TOOLTIP_LENGTH) {
      return `${value.substring(0, MAX_TOOLTIP_LENGTH)}... {${value.length}} characters total`;
    }
    return value;
  }, [value]);

  return (
    <div className="json-viewer-node-value" style={{ color: '#2CA02C' }}>
      <OverflowTooltip tooltipClassName="inspector-node-tooltip" maxLetters={32}>{`"${displayValue}"`}</OverflowTooltip>
    </div>
  );
};

export default StringNode;
