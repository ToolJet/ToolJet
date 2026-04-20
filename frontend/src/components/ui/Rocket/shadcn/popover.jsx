import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

function Popover({ ...props }) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({ className, align = 'center', sideOffset = 4, ...props }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'tw-z-50 tw-flex tw-w-72 tw-origin-[var(--radix-popover-content-transform-origin)] tw-flex-col tw-gap-2.5 tw-rounded-lg tw-bg-popover tw-p-2.5 tw-text-sm tw-text-popover-foreground tw-shadow-md tw-ring-1 tw-ring-foreground/10 tw-outline-none tw-duration-100 data-[side=bottom]:tw-slide-in-from-top-2 data-[side=left]:tw-slide-in-from-right-2 data-[side=right]:tw-slide-in-from-left-2 data-[side=top]:tw-slide-in-from-bottom-2 data-[state=open]:tw-animate-in data-[state=open]:tw-fade-in-0 data-[state=open]:tw-zoom-in-95 data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=closed]:tw-zoom-out-95',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({ ...props }) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverHeader({ className, ...props }) {
  return (
    <div data-slot="popover-header" className={cn('tw-flex tw-flex-col tw-gap-0.5 tw-text-sm', className)} {...props} />
  );
}

function PopoverTitle({ className, ...props }) {
  return <div data-slot="popover-title" className={cn('tw-font-medium', className)} {...props} />;
}

function PopoverDescription({ className, ...props }) {
  return <p data-slot="popover-description" className={cn('tw-text-muted-foreground', className)} {...props} />;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
