import React, { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';
import { useTextOverflow } from '@/_hooks/useTextOverflow';
import TooltipComp from '@/components/ui/Rocket/Tooltip';

const TOOLTIP_DELAY = 700; // matches Radix Tooltip default delayDuration

// Note: The element needs a constrained width (e.g. tw-max-w-*, a flex/grid parent, etc.)
// for overflow to be detected. Without a width constraint, text expands and never truncates.
export default function TruncatedText({ as: Tag = 'p', className, children, content, ...props }) {
  const timerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { ref, isOverflowing } = useTextOverflow();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setOpen(true), TOOLTIP_DELAY);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setOpen(false);
  };

  return (
    <TooltipComp content={content} open={isOverflowing && open}>
      <Tag
        {...props}
        ref={ref}
        className={cn('tw-truncate', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </Tag>
    </TooltipComp>
  );
}
