import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ToolTip } from '@/_components';

const isTextOverflowing = (element, maxLetters, children, verticalTolerance = 4) => {
  if (!element) return false;

  const horizontalOverflow = element.scrollWidth > element.clientWidth;
  const verticalOverflow = element.scrollHeight > element.clientHeight + verticalTolerance;
  const isMaxLettersOverflowing = maxLetters && typeof children === 'string' && children.length > maxLetters;

  return horizontalOverflow || verticalOverflow || isMaxLettersOverflowing;
};

export default function OverflowTooltip({
  children,
  className,
  whiteSpace = 'nowrap',
  placement = 'bottom',
  boxWidth,
  maxLetters,
  tooltipClassName,
  ...rest
}) {
  const [isOverflowed, setIsOverflowed] = useState(false);
  const textContentRef = useRef(null);

  const checkOverflow = useCallback(() => {
    if (textContentRef.current) {
      setIsOverflowed(isTextOverflowing(textContentRef.current, maxLetters, children));
    }
  }, [children, maxLetters]);

  useEffect(() => {
    const currentTextElement = textContentRef.current;
    if (!currentTextElement) {
      return;
    }

    checkOverflow();

    const observer = new ResizeObserver((entries) => {
      checkOverflow();
    });

    observer.observe(currentTextElement);

    return () => {
      observer.unobserve(currentTextElement);
      observer.disconnect();
    };
  }, [children, checkOverflow, maxLetters]);

  const displayText =
    maxLetters && typeof children === 'string' && children.length > maxLetters
      ? `${children.substring(0, maxLetters)}...`
      : children;

  useEffect(() => {
    checkOverflow();
  }, [maxLetters, checkOverflow]);

  return (
    <ToolTip
      className={className}
      delay={{ show: '0', hide: '0' }}
      tooltipClassName={`overflow-tooltip ${tooltipClassName}`}
      placement={placement}
      message={children}
      show={!!isOverflowed}
      width={rest?.width}
    >
      <div
        ref={textContentRef}
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
