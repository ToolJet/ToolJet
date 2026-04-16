import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

import { AlertDialogTrigger, AlertDialogPortal } from '@/components/ui/Rocket/shadcn/alert-dialog';

// ── AlertDialog (root pass-through) ─────────────────────────────────────────

const AlertDialog = AlertDialogPrimitive.Root;

// ── AlertDialogOverlay ──────────────────────────────────────────────────────

const AlertDialogOverlay = forwardRef(function AlertDialogOverlay({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      data-slot="alert-dialog-overlay"
      className={cn(
        'tw-fixed tw-inset-0 tw-z-50 tw-bg-black/20',
        'data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0',
        className
      )}
      {...props}
    />
  );
});
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

// ── AlertDialogContent ──────────────────────────────────────────────────────

const alertDialogContentVariants = cva(
  [
    'tw-bg-background-surface-layer-01',
    'tw-shadow-elevation-400',
    'tw-rounded-lg',
    'tw-border-solid tw-border tw-border-border-weak',
    'tw-flex tw-flex-col tw-gap-6',
    'tw-p-6',
  ],
  {
    variants: {
      size: {
        default: 'tw-max-w-[460px]',
        small: 'tw-max-w-[320px]',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const AlertDialogContent = forwardRef(function AlertDialogContent(
  { className, children, size, preventClose = true, ...props },
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
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        data-slot="alert-dialog-content"
        data-size={size || 'default'}
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        className={cn(
          'tw-group/alert-dialog-content tw-fixed tw-inset-0 tw-z-50 tw-m-auto tw-h-fit tw-w-full tw-max-w-[calc(100%-2rem)] tw-outline-none',
          'data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-95',
          alertDialogContentVariants({ size }),
          className
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = 'AlertDialogContent';
AlertDialogContent.propTypes = {
  size: PropTypes.oneOf(['default', 'small']),
  preventClose: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── AlertDialogMedia ────────────────────────────────────────────────────────
// Icon or image slot. Placed inside AlertDialogHeader.
// Default size: uses media beside title on default, stacked on small.

function AlertDialogMedia({ className, children, ...props }) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn('tw-flex tw-items-center tw-justify-center tw-size-10 tw-shrink-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}
AlertDialogMedia.displayName = 'AlertDialogMedia';
AlertDialogMedia.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── AlertDialogHeader ───────────────────────────────────────────────────────
// Groups media + title + description.
// Layout adapts based on size (via group-data) and media presence (via has-[]).

function AlertDialogHeader({ className, children, ...props }) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'tw-flex tw-flex-col tw-gap-0.5',
        // 8px total between media and title: 6px margin + 2px gap
        '[&>[data-slot=alert-dialog-media]]:tw-mb-1.5',
        // When small: center text
        'group-data-[size=small]/alert-dialog-content:tw-items-center group-data-[size=small]/alert-dialog-content:tw-text-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
AlertDialogHeader.displayName = 'AlertDialogHeader';

// ── AlertDialogTitle ────────────────────────────────────────────────────────

const AlertDialogTitle = forwardRef(function AlertDialogTitle({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      data-slot="alert-dialog-title"
      className={cn('tw-font-title-x-large tw-text-text-default tw-mb-0', className)}
      {...props}
    />
  );
});
AlertDialogTitle.displayName = 'AlertDialogTitle';

// ── AlertDialogDescription ──────────────────────────────────────────────────

const AlertDialogDescription = forwardRef(function AlertDialogDescription({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      data-slot="alert-dialog-description"
      className={cn('tw-font-body-default tw-text-text-default tw-m-0', className)}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = 'AlertDialogDescription';

// ── AlertDialogFooter ───────────────────────────────────────────────────────

function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('tw-flex tw-items-center tw-justify-between tw-gap-2', className)}
      {...props}
    />
  );
}
AlertDialogFooter.displayName = 'AlertDialogFooter';

// ── AlertDialogAction ───────────────────────────────────────────────────────

const AlertDialogAction = forwardRef(function AlertDialogAction({ className, ...props }, ref) {
  return <AlertDialogPrimitive.Action ref={ref} data-slot="alert-dialog-action" className={cn(className)} {...props} />;
});
AlertDialogAction.displayName = 'AlertDialogAction';

// ── AlertDialogCancel ───────────────────────────────────────────────────────

const AlertDialogCancel = forwardRef(function AlertDialogCancel({ className, ...props }, ref) {
  return <AlertDialogPrimitive.Cancel ref={ref} data-slot="alert-dialog-cancel" className={cn(className)} {...props} />;
});
AlertDialogCancel.displayName = 'AlertDialogCancel';

// ── Exports ─────────────────────────────────────────────────────────────────

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  alertDialogContentVariants,
  AlertDialogOverlay,
  AlertDialogMedia,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};
