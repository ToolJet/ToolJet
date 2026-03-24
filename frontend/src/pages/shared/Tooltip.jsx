import React from 'react';

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Rocket/tooltip';

import { cn } from '@/lib/utils';

export default function TooltipComp({ children, classes, content }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  if (content === undefined || content === null || content === '') {
    return children;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>

          <TooltipContent
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
    </>
  );
}
