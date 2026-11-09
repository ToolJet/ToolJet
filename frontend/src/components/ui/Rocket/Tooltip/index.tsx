import React, { type ReactElement, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';

export interface TooltipProps {
  children: ReactElement;
  /** Nothing is shown when empty. */
  content?: ReactNode;
  classes?: { content?: string };
  arrow?: boolean;
  /** Wraps the child so a disabled button can still trigger the tooltip. */
  isTooltipForInteractiveDisabledElement?: boolean;
  open?: boolean;
}

export default function TooltipComp({
  children,
  classes,
  content,
  arrow = false,
  isTooltipForInteractiveDisabledElement = false,
  open,
}: TooltipProps) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  if (content === undefined || content === null || content === '') {
    return children;
  }

  const triggerElement = isTooltipForInteractiveDisabledElement ? (
    <div className="tw-inline-block tw-w-fit">{children}</div>
  ) : (
    children
  );

  return (
    <TooltipProvider>
      <Tooltip {...(open !== undefined && { open })}>
        <TooltipTrigger asChild>{triggerElement}</TooltipTrigger>

        <TooltipContent
          showArrow={arrow}
          className={cn(
            darkMode && 'dark-theme',
            'tw-bg-background-inverse tw-text-text-inverse tw-p-3 tw-rounded-lg tw-text-base tw-font-medium',
            classes?.content
          )}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
