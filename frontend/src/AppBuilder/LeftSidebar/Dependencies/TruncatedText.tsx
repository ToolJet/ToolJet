import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ToolTip } from '@/_components/ToolTip';

const ToolTipComponent = ToolTip as React.ComponentType<any>;

const MAX_TOOLTIP_LENGTH = 500;

type TruncatedTextProps = {
  /** Full text, shown in the tooltip when the visible text is cut off. */
  text: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Text cut off with an ellipsis that shows its full text in a tooltip, only while it is cut off.
 * Children may be a richer rendering of `text` (e.g. with search highlights).
 */
const TruncatedText = ({ text, className, children }: TruncatedTextProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (el) setTruncated(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, text, truncated]);

  const message = text.length > MAX_TOOLTIP_LENGTH ? `${text.slice(0, MAX_TOOLTIP_LENGTH)}…` : text;

  return (
    <ToolTipComponent
      message={message}
      show={truncated}
      placement="bottom"
      delay={{ show: 300, hide: 0 }}
      tooltipClassName="dependency-row-full-text"
    >
      <span ref={ref} className={className}>
        {children ?? text}
      </span>
    </ToolTipComponent>
  );
};

export default TruncatedText;
