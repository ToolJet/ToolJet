import React, { useEffect, useRef, useState } from 'react';
import { ToolTip } from '@/_components';

export default function OverflowTooltip({ children }) {
  const [isOverflowed, setIsOverflow] = useState(false);
  const textElementRef = useRef();

  useEffect(() => {
    setIsOverflow(textElementRef.current.scrollWidth > textElementRef.current.clientWidth);
  }, []);

  return (
    <ToolTip
      className
      delay={{ show: '0', hide: '0' }}
      tooltipClassName="overflow-tooltip"
      placement="bottom"
      message={children}
      show={isOverflowed}
    >
      <div
        ref={textElementRef}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {children}
      </div>
    </ToolTip>
  );
}
