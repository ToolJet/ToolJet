import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';

import {
  // Re-exported unchanged
  DialogTrigger,
  DialogClose,
  DialogPortal,
} from '@/components/ui/Rocket/shadcn/dialog';

// ── DialogOverlay ────────────────────────────────────────────────────────────

const DialogOverlay = forwardRef(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        'tw-fixed tw-inset-0 tw-z-50 tw-bg-black/50',
        'data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0',
        className
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = 'DialogOverlay';

// ── DialogContent ────────────────────────────────────────────────────────────

const dialogContentVariants = cva(
  [
    'tw-bg-background-surface-layer-01',
    'tw-shadow-elevation-400',
    'tw-rounded-lg',
    'tw-border-solid tw-border tw-border-border-weak',
    'tw-flex tw-flex-col tw-p-0',
    'tw-ring-0',
    'tw-gap-0',
  ],
  {
    variants: {
      size: {
        small: 'tw-max-w-[400px]',
        default: 'tw-max-w-[480px]',
        large: 'tw-max-w-[640px]',
        extraLarge: 'tw-max-w-[768px]',
        fullscreen: 'tw-max-w-none tw-w-screen tw-h-screen tw-rounded-none tw-border-0',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const DialogContent = forwardRef(function DialogContent(
  { className, children, size, showCloseButton = true, preventClose = false, ...props },
  ref
) {
  const handleInteractOutside = (e) => {
    if (preventClose) e.preventDefault();
    props.onInteractOutside?.(e);
  };

  const handleEscapeKeyDown = (e) => {
    if (preventClose) e.preventDefault();
    props.onEscapeKeyDown?.(e);
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        className={cn(
          'tw-fixed tw-inset-0 tw-z-50 tw-m-auto tw-h-fit tw-w-full tw-max-w-[calc(100%-2rem)] tw-outline-none',
          'data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-95',
          dialogContentVariants({ size }),
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose asChild>
            <Button
              variant="ghost"
              iconOnly
              size="small"
              className="tw-absolute tw-right-3 tw-top-4"
              aria-label="Close"
            >
              <X className="tw-size-4" />
            </Button>
          </DialogClose>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = 'DialogContent';
DialogContent.propTypes = {
  size: PropTypes.oneOf(['small', 'default', 'large', 'extraLarge', 'fullscreen']),
  showCloseButton: PropTypes.bool,
  preventClose: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── DialogHeader ─────────────────────────────────────────────────────────────

function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'tw-flex tw-flex-row tw-items-center',
        'tw-h-14 tw-px-6 tw-py-0',
        'tw-gap-0',
        'tw-border-solid tw-border-0 tw-border-b tw-border-border-weak',
        className
      )}
      {...props}
    />
  );
}
DialogHeader.displayName = 'DialogHeader';

// ── DialogBody ───────────────────────────────────────────────────────────────
// Not in shadcn — custom sub-component for the content area between header/footer.

const DialogBody = forwardRef(function DialogBody(
  { className, noPadding = false, scrollable = false, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="dialog-body"
      className={cn(
        'tw-flex-1 tw-min-h-0',
        !noPadding && 'tw-p-6',
        scrollable && 'tw-overflow-y-auto tw-max-h-[85vh]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DialogBody.displayName = 'DialogBody';
DialogBody.propTypes = {
  noPadding: PropTypes.bool,
  scrollable: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── DialogFooter ─────────────────────────────────────────────────────────────

function DialogFooter({ className, ...props }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'tw-px-6 tw-py-4',
        'tw-flex tw-flex-row tw-items-center tw-justify-between tw-gap-2',
        'tw-border-solid tw-border-0 tw-border-t tw-border-border-weak',
        className
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = 'DialogFooter';

// ── DialogTitle ──────────────────────────────────────────────────────────────

const DialogTitle = forwardRef(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="dialog-title"
      className={cn('tw-font-title-large tw-text-text-default tw-mb-0', className)}
      {...props}
    />
  );
});
DialogTitle.displayName = 'DialogTitle';

// ── DialogDescription ────────────────────────────────────────────────────────

const DialogDescription = forwardRef(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="dialog-description"
      className={cn('tw-font-body-small tw-text-text-placeholder', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = 'DialogDescription';

// ── Dialog (root pass-through) ───────────────────────────────────────────────

const Dialog = DialogPrimitive.Root;

// ── Exports ──────────────────────────────────────────────────────────────────

export {
  Dialog,
  DialogContent,
  dialogContentVariants,
  DialogOverlay,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  // Re-exports from shadcn
  DialogTrigger,
  DialogClose,
  DialogPortal,
};
