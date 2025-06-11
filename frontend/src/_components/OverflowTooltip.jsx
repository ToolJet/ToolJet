import React, { useEffect, useRef, useState } from 'react';
import { ToolTip } from '@/_components';

export default function OverflowTooltip({
  children,
  className,
  whiteSpace = 'nowrap',
  placement = 'bottom',
  maxLetters,
  ...rest
}) {
  const [isOverflowed, setIsOverflow] = useState(false);
  const textElementRef = useRef();

  useEffect(() => {
    setIsOverflow(
      textElementRef.current.scrollWidth > textElementRef.current.clientWidth ||
        textElementRef.current.clientHeight < textElementRef.current.scrollHeight - 4
    );
  }, [children]);

  const displayText =
    maxLetters && typeof children === 'string' && children.length > maxLetters
      ? `${children.substring(0, maxLetters)}...`
      : children;

  return (
    <ToolTip
      className={className}
      delay={{ show: '0', hide: '0' }}
      tooltipClassName="overflow-tooltip"
      placement={placement}
      message={children}
      show={isOverflowed}
      width={rest?.width}
    >
      <div
        ref={textElementRef}
        className={rest.childrenClassName}
        style={{
          whiteSpace,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...rest.style,
        }}
      >
        {displayText}
      </div>
    </ToolTip>
  );
}
