import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/shadcn/button';

function AlertDialog({ ...props }) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({ ...props }) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'tw-fixed tw-inset-0 tw-z-50 tw-bg-black/10 tw-duration-100 supports-backdrop-filter:tw-backdrop-blur-xs data-[open]:tw-animate-in data-[open]:tw-fade-in-0 data-[closed]:tw-animate-out data-[closed]:tw-fade-out-0',
        className
      )}
      {...props}
    />
  );
}

function AlertDialogContent({ className, size = 'default', ...props }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          'tw-group/alert-dialog-content tw-fixed tw-top-1/2 tw-left-1/2 tw-z-50 tw-grid tw-w-full tw--translate-x-1/2 tw--translate-y-1/2 tw-gap-4 tw-rounded-xl tw-bg-popover tw-p-4 tw-text-popover-foreground tw-ring-1 tw-ring-foreground/10 tw-duration-100 tw-outline-none data-[size=default]:tw-max-w-xs data-[size=sm]:tw-max-w-xs data-[size=default]:sm:tw-max-w-sm data-[open]:tw-animate-in data-[open]:tw-fade-in-0 data-[open]:tw-zoom-in-95 data-[closed]:tw-animate-out data-[closed]:tw-fade-out-0 data-[closed]:tw-zoom-out-95',
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'tw-grid tw-grid-rows-[auto_1fr] tw-place-items-center tw-gap-1.5 tw-text-center has-[[data-slot=alert-dialog-media]]:tw-grid-rows-[auto_auto_1fr] has-[[data-slot=alert-dialog-media]]:tw-gap-x-4 sm:group-data-[size=default]/alert-dialog-content:tw-place-items-start sm:group-data-[size=default]/alert-dialog-content:tw-text-left sm:group-data-[size=default]/alert-dialog-content:has-[[data-slot=alert-dialog-media]]:tw-grid-rows-[auto_1fr]',
        className
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'tw--mx-4 tw--mb-4 tw-flex tw-flex-col-reverse tw-gap-2 tw-rounded-b-xl tw-border-t tw-bg-muted/50 tw-p-4 group-data-[size=sm]/alert-dialog-content:tw-grid group-data-[size=sm]/alert-dialog-content:tw-grid-cols-2 sm:tw-flex-row sm:tw-justify-end',
        className
      )}
      {...props}
    />
  );
}

function AlertDialogMedia({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        'tw-mb-2 tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-md tw-bg-muted sm:group-data-[size=default]/alert-dialog-content:tw-row-span-2 *:[svg:not([class*=size-])]:tw-size-6',
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        'tw-text-base tw-font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-[[data-slot=alert-dialog-media]]/alert-dialog-content:tw-col-start-2',
        className
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        'tw-text-sm tw-text-balance tw-text-muted-foreground md:tw-text-pretty *:[a]:tw-underline *:[a]:tw-underline-offset-3 *:[a]:hover:tw-text-foreground',
        className
      )}
      {...props}
    />
  );
}

function AlertDialogAction({ className, variant = 'default', size = 'default', ...props }) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn(className)} {...props} />
    </Button>
  );
}

function AlertDialogCancel({ className, variant = 'outline', size = 'default', ...props }) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(className)} {...props} />
    </Button>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
