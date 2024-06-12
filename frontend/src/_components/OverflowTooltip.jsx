import React, { useEffect, useRef, useState } from 'react';
import { ToolTip } from '@/_components';

export default function OverflowTooltip({ children, className, whiteSpace = 'nowrap', ...rest }) {
  const [isOverflowed, setIsOverflow] = useState(false);
  const textElementRef = useRef();

  useEffect(() => {
    setIsOverflow(
      textElementRef.current.scrollWidth > textElementRef.current.clientWidth ||
        textElementRef.current.clientHeight < textElementRef.current.scrollHeight - 4
    );
  }, [children]);

  return (
    <ToolTip
      className={className}
      delay={{ show: '0', hide: '0' }}
      tooltipClassName="overflow-tooltip"
      placement="bottom"
      message={children}
      show={isOverflowed}
      width={rest?.width}
    >
      <div
        ref={textElementRef}
        style={{
          whiteSpace,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...rest.style,
        }}
      >
        {children}
      </div>
    </ToolTip>
  );
}
