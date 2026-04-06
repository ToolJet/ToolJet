import React from 'react';

import { cn } from '@/lib/utils';
import { useTextOverflow } from '@/_hooks/useTextOverflow';
import TooltipComp from '@/components/ui/Rocket/Tooltip';

// Note: The element needs a constrained width (e.g. tw-max-w-*, a flex/grid parent, etc.)
// for overflow to be detected. Without a width constraint, text expands and never truncates.
export default function TruncatedText({ as: Tag = 'p', className, children, content, ...props }) {
  const { ref, isOverflowing } = useTextOverflow();

  const element = (
    <Tag ref={ref} className={cn('tw-truncate', className)} {...props}>
      {children}
    </Tag>
  );

  if (!isOverflowing) return element;

  return <TooltipComp content={content}>{element}</TooltipComp>;
}
