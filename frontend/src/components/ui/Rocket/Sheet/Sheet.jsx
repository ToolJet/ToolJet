import React, { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';

import { SheetTrigger, SheetClose, SheetPortal } from '@/components/ui/Rocket/shadcn/sheet';

// ── Overflow context (SheetBody → SheetFooter) ──────────────────────────────

const SheetOverflowContext = createContext({ overflowing: false, setOverflowing: () => {} });

// ── Sheet (root pass-through) ───────────────────────────────────────────────

const Sheet = SheetPrimitive.Root;

// ── SheetOverlay ────────────────────────────────────────────────────────────

const SheetOverlay = forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Overlay
      ref={ref}
      data-slot="sheet-overlay"
      className={cn(
        'tw-fixed tw-inset-0 tw-z-50 tw-bg-black/50',
        'data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0',
        className
      )}
      {...props}
    />
  );
});
SheetOverlay.displayName = 'SheetOverlay';

// ── SheetContent ────────────────────────────────────────────────────────────

const sheetContentVariants = cva(
  [
    'tw-fixed tw-inset-y-0 tw-right-0 tw-z-50 tw-h-full',
    'tw-bg-background-surface-layer-01',
    'tw-shadow-elevation-400',
    'tw-border-solid tw-border-l tw-border-border-weak',
    'tw-flex tw-flex-col',
    'tw-outline-none',
    // Animations
    'data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out',
    'data-[state=open]:tw-slide-in-from-right data-[state=closed]:tw-slide-out-to-right',
    'tw-duration-200',
  ],
  {
    variants: {
      size: {
        large: 'tw-w-[720px]',
        default: 'tw-w-[560px]',
        small: 'tw-w-[400px]',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const SheetContent = forwardRef(function SheetContent(
  { className, children, size, showCloseButton = true, preventClose = false, ...props },
  ref
) {
  const [bodyOverflowing, setBodyOverflowing] = useState(false);
  const overflowCtx = useMemo(
    () => ({ overflowing: bodyOverflowing, setOverflowing: setBodyOverflowing }),
    [bodyOverflowing]
  );

  const handleInteractOutside = (e) => {
    if (preventClose) e.preventDefault();
    props.onInteractOutside?.(e);
  };

  const handleEscapeKeyDown = (e) => {
    if (preventClose) e.preventDefault();
    props.onEscapeKeyDown?.(e);
  };

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        className={cn(sheetContentVariants({ size }), className)}
        {...props}
      >
        <SheetOverflowContext.Provider value={overflowCtx}>{children}</SheetOverflowContext.Provider>
        {showCloseButton && (
          <SheetClose asChild>
            <Button
              variant="ghost"
              iconOnly
              size="small"
              className="tw-absolute tw-right-3 tw-top-4"
              aria-label="Close"
            >
              <X className="tw-size-4" />
            </Button>
          </SheetClose>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';
SheetContent.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  showCloseButton: PropTypes.bool,
  preventClose: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── SheetHeader ─────────────────────────────────────────────────────────────

function SheetHeader({ className, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        'tw-flex tw-flex-row tw-items-center',
        'tw-h-14 tw-px-6 tw-py-0',
        'tw-gap-0 tw-shrink-0',
        'tw-border-solid tw-border-0 tw-border-b tw-border-border-weak',
        className
      )}
      {...props}
    />
  );
}
SheetHeader.displayName = 'SheetHeader';

// ── SheetBody ───────────────────────────────────────────────────────────────

const SheetBody = forwardRef(function SheetBody({ className, noPadding = false, children, ...props }, ref) {
  const innerRef = useRef(null);
  const { setOverflowing } = useContext(SheetOverflowContext);

  const mergedRef = useCallback(
    (node) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    const check = () => setOverflowing(node.scrollHeight > node.clientHeight);
    const observer = new ResizeObserver(check);
    observer.observe(node);
    node.addEventListener('scroll', check);
    check();

    return () => {
      observer.disconnect();
      node.removeEventListener('scroll', check);
    };
  }, [setOverflowing]);

  return (
    <div
      ref={mergedRef}
      data-slot="sheet-body"
      className={cn('tw-flex-1 tw-min-h-0 tw-overflow-y-auto', !noPadding && 'tw-p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
});
SheetBody.displayName = 'SheetBody';
SheetBody.propTypes = {
  noPadding: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── SheetFooter ─────────────────────────────────────────────────────────────

function SheetFooter({ className, ...props }) {
  const { overflowing } = useContext(SheetOverflowContext);

  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'tw-px-6 tw-py-4 tw-shrink-0',
        'tw-flex tw-flex-row tw-items-center tw-justify-between tw-gap-2',
        'tw-border-solid tw-border-0 tw-border-t',
        overflowing ? 'tw-border-border-weak' : 'tw-border-transparent',
        className
      )}
      {...props}
    />
  );
}
SheetFooter.displayName = 'SheetFooter';

// ── SheetTitle ──────────────────────────────────────────────────────────────

const SheetTitle = forwardRef(function SheetTitle({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Title
      ref={ref}
      data-slot="sheet-title"
      className={cn('tw-font-title-large tw-text-text-default tw-mb-0', className)}
      {...props}
    />
  );
});
SheetTitle.displayName = 'SheetTitle';

// ── SheetDescription ────────────────────────────────────────────────────────

const SheetDescription = forwardRef(function SheetDescription({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Description
      ref={ref}
      data-slot="sheet-description"
      className={cn('tw-font-body-small tw-text-text-placeholder', className)}
      {...props}
    />
  );
});
SheetDescription.displayName = 'SheetDescription';

// ── Exports ─────────────────────────────────────────────────────────────────

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  sheetContentVariants,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
