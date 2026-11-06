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
  tooltipClassName = '',
  childrenClassName,
  style,
  width,
  lines,
  contentKey,
  ...domProps
}) {
  const [isOverflowed, setIsOverflowed] = useState(false);
  const [renderedText, setRenderedText] = useState('');
  const textContentRef = useRef(null);
  // Rich children (markdown, HTML) change identity every render; `contentKey` says when the content really changed.
  const watched = contentKey ?? children;

  const checkOverflow = useCallback(() => {
    const element = textContentRef.current;
    if (element) {
      const overflowing = isTextOverflowing(element, maxLetters, watched);
      setIsOverflowed(overflowing);
      if (overflowing) setRenderedText(element.textContent ?? '');
    }
  }, [watched, maxLetters]);

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
  }, [watched, checkOverflow, maxLetters]);

  const isPrimitiveChildren = typeof children === 'string' || typeof children === 'number';

  const displayText =
    maxLetters && typeof children === 'string' && children.length > maxLetters
      ? `${children.substring(0, maxLetters)}...`
      : children;

  // The tooltip message must be a plain string. Rich content (markdown, HTML) has none, so it uses the rendered
  // text, which is read only once it overflows; other non-primitive children (e.g. an unresolved fx binding) show none.
  const hasRichContent = lines !== undefined || !!domProps.dangerouslySetInnerHTML;
  const tooltipMessage = isPrimitiveChildren ? children : hasRichContent ? renderedText : '';

  // A line clamp wraps like normal text and cuts the last visible line with an ellipsis.
  const clampStyle =
    lines === undefined
      ? {}
      : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, whiteSpace: 'normal' };

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
      show={!!isOverflowed && !!tooltipMessage}
      width={width}
    >
      <div
        ref={textContentRef}
        className={childrenClassName}
        style={{
          whiteSpace,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...clampStyle,
          ...style,
        }}
        {...domProps}
      >
        {displayText}
      </div>
    </ToolTip>
  );
}
