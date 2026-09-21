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
  childrenClassName,
  style,
  width,
  ...domProps
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

  const isPrimitiveChildren = typeof children === 'string' || typeof children === 'number';

  const displayText =
    maxLetters && typeof children === 'string' && children.length > maxLetters
      ? `${children.substring(0, maxLetters)}...`
      : children;

  // The tooltip message must be a plain string; non-primitive children (e.g. an unresolved fx binding
  // or a React node like a highlighter) have no safe text representation, so fall back to empty.
  const tooltipMessage = isPrimitiveChildren ? children : '';

  useEffect(() => {
    checkOverflow();
  }, [maxLetters, checkOverflow]);

  return (
    <ToolTip
      className={className}
      delay={{ show: '0', hide: '0' }}
      tooltipClassName={`overflow-tooltip ${tooltipClassName}`}
      placement={placement}
      message={tooltipMessage}
      show={!!isOverflowed}
      width={width}
    >
      <div
        ref={textContentRef}
        className={childrenClassName}
        style={{
          whiteSpace,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...style,
        }}
        {...domProps}
      >
        {displayText}
      </div>
    </ToolTip>
  );
}
