import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/shadcn/button';
import { XIcon } from 'lucide-react';

function Sheet({ ...props }) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'tw-fixed tw-inset-0 tw-z-50 tw-bg-black/10 tw-duration-100 supports-backdrop-filter:tw-backdrop-blur-sm data-[state=open]:tw-animate-in data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0',
        className
      )}
      {...props}
    />
  );
}

function SheetContent({ className, children, side = 'right', showCloseButton = true, ...props }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          'tw-fixed tw-z-50 tw-flex tw-flex-col tw-gap-4 tw-bg-popover tw-bg-clip-padding tw-text-sm tw-text-popover-foreground tw-shadow-lg tw-transition tw-duration-200 tw-ease-in-out data-[side=bottom]:tw-inset-x-0 data-[side=bottom]:tw-bottom-0 data-[side=bottom]:tw-h-auto data-[side=bottom]:tw-border-t data-[side=left]:tw-inset-y-0 data-[side=left]:tw-left-0 data-[side=left]:tw-h-full data-[side=left]:tw-w-3/4 data-[side=left]:tw-border-r data-[side=right]:tw-inset-y-0 data-[side=right]:tw-right-0 data-[side=right]:tw-h-full data-[side=right]:tw-w-3/4 data-[side=right]:tw-border-l data-[side=top]:tw-inset-x-0 data-[side=top]:tw-top-0 data-[side=top]:tw-h-auto data-[side=top]:tw-border-b data-[side=left]:sm:tw-max-w-sm data-[side=right]:sm:tw-max-w-sm data-[state=open]:tw-animate-in data-[state=open]:tw-fade-in-0 data-[side=bottom]:data-[state=open]:tw-slide-in-from-bottom-10 data-[side=left]:data-[state=open]:tw-slide-in-from-left-10 data-[side=right]:data-[state=open]:tw-slide-in-from-right-10 data-[side=top]:data-[state=open]:tw-slide-in-from-top-10 data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[side=bottom]:data-[state=closed]:tw-slide-out-to-bottom-10 data-[side=left]:data-[state=closed]:tw-slide-out-to-left-10 data-[side=right]:data-[state=closed]:tw-slide-out-to-right-10 data-[side=top]:data-[state=closed]:tw-slide-out-to-top-10',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button variant="ghost" className="tw-absolute tw-top-3 tw-right-3" size="icon-sm">
              <XIcon />
              <span className="tw-sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }) {
  return <div data-slot="sheet-header" className={cn('tw-flex tw-flex-col tw-gap-0.5 tw-p-4', className)} {...props} />;
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('tw-mt-auto tw-flex tw-flex-col tw-gap-2 tw-p-4', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('tw-text-base tw-font-medium tw-text-foreground', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('tw-text-sm tw-text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
