import React, { forwardRef, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';

// ── Size context ─────────────────────────────────────────────────────────────
// DialogContent provides size so Header/Footer can conditionally show borders.
const DialogSizeContext = createContext('default');
import {
  Dialog as ShadcnDialog,
  DialogContent as ShadcnDialogContent,
  DialogOverlay as ShadcnDialogOverlay,
  DialogHeader as ShadcnDialogHeader,
  DialogFooter as ShadcnDialogFooter,
  DialogTitle as ShadcnDialogTitle,
  DialogDescription as ShadcnDialogDescription,
  // Re-exported unchanged
  DialogTrigger,
  DialogClose,
  DialogPortal,
} from '@/components/ui/Rocket/shadcn/dialog';

// ── DialogContent ────────────────────────────────────────────────────────────

const dialogContentVariants = cva(
  [
    'tw-bg-background-surface-layer-01',
    'tw-shadow-[var(--elevation-400-box-shadow)]',
    'tw-rounded-lg',
    'tw-border-solid tw-border tw-border-border-weak',
    'tw-flex tw-flex-col tw-p-0',
    'tw-ring-0',
    'tw-gap-0',
  ],
  {
    variants: {
      size: {
        sm: 'tw-max-w-[400px]',
        default: 'tw-max-w-[480px]',
        lg: 'tw-max-w-[640px]',
        xl: 'tw-max-w-[768px]',
        fullscreen:
          'tw-max-w-none tw-w-screen tw-h-screen tw-rounded-none tw-border-0',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const DialogContent = forwardRef(function DialogContent(
  {
    className,
    children,
    size,
    showCloseButton = true,
    preventClose = false,
    noPadding = false,
    scrollable = false,
    ...props
  },
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
    <ShadcnDialogContent
      ref={ref}
      showCloseButton={false}
      onInteractOutside={handleInteractOutside}
      onEscapeKeyDown={handleEscapeKeyDown}
      className={cn(dialogContentVariants({ size }), className)}
      {...props}
    >
      <DialogSizeContext.Provider value={size || 'default'}>
        {children}
      </DialogSizeContext.Provider>
      {showCloseButton && (
        <DialogClose asChild>
          <Button
            variant="ghost"
            iconOnly
            size="small"
            className="tw-absolute tw-right-3 tw-top-3"
            aria-label="Close"
          >
            <X className="tw-size-4" />
          </Button>
        </DialogClose>
      )}
    </ShadcnDialogContent>
  );
});
DialogContent.displayName = 'DialogContent';
DialogContent.propTypes = {
  size: PropTypes.oneOf(['sm', 'default', 'lg', 'xl', 'fullscreen']),
  showCloseButton: PropTypes.bool,
  preventClose: PropTypes.bool,
  noPadding: PropTypes.bool,
  scrollable: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── DialogOverlay ────────────────────────────────────────────────────────────

const DialogOverlay = forwardRef(function DialogOverlay(
  { className, ...props },
  ref
) {
  return (
    <ShadcnDialogOverlay
      ref={ref}
      className={cn('tw-bg-black/50', className)}
      {...props}
    />
  );
});
DialogOverlay.displayName = 'DialogOverlay';

// ── DialogHeader ─────────────────────────────────────────────────────────────

function DialogHeader({ className, ...props }) {
  const size = useContext(DialogSizeContext);
  return (
    <ShadcnDialogHeader
      className={cn(
        'tw-flex tw-flex-row tw-items-center',
        'tw-h-14 tw-px-6 tw-py-0',
        'tw-gap-0',
        size !== 'sm' && 'tw-border-solid tw-border-0 tw-border-b tw-border-border-weak',
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
  const size = useContext(DialogSizeContext);
  return (
    <ShadcnDialogFooter
      className={cn(
        'tw-px-6 tw-py-4',
        'tw-flex tw-flex-row tw-items-center tw-justify-end tw-gap-2',
        size !== 'sm' && 'tw-border-solid tw-border-0 tw-border-t tw-border-border-weak',
        className
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = 'DialogFooter';

// ── DialogTitle ──────────────────────────────────────────────────────────────

const DialogTitle = forwardRef(function DialogTitle(
  { className, ...props },
  ref
) {
  return (
    <ShadcnDialogTitle
      ref={ref}
      className={cn(
        'tw-text-base tw-font-medium tw-leading-6 tw-text-text-default',
        className
      )}
      {...props}
    />
  );
});
DialogTitle.displayName = 'DialogTitle';

// ── DialogDescription ────────────────────────────────────────────────────────

const DialogDescription = forwardRef(function DialogDescription(
  { className, ...props },
  ref
) {
  return (
    <ShadcnDialogDescription
      ref={ref}
      className={cn('tw-text-sm tw-text-text-placeholder', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = 'DialogDescription';

// ── Dialog (root pass-through) ───────────────────────────────────────────────

const Dialog = ShadcnDialog;

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
