import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
import { Button } from './Button/Button';

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
};

export const Default = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Button>Hover Me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip.</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
