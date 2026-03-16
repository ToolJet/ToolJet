import React from 'react';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Rocket/tooltip';

import { useTextOverflow } from './hooks/useTextOverflow';

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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{element}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
