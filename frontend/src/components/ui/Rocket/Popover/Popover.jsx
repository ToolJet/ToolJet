import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

import { PopoverTrigger } from '@/components/ui/Rocket/shadcn/popover';

// ── PopoverContent ───────────────────────────────────────────────────────────

const PopoverContent = forwardRef(function PopoverContent(
  { className, align = 'center', side = 'bottom', sideOffset = 4, children, ...props },
  ref
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          'tw-z-50 tw-w-72 tw-flex tw-flex-col tw-gap-2.5',
          'tw-bg-background-surface-layer-01',
          'tw-shadow-elevation-400',
          'tw-rounded-lg',
          'tw-border-solid tw-border tw-border-border-weak',
          'tw-p-3',
          'tw-outline-none',
          'tw-origin-[var(--radix-popover-content-transform-origin)]',
          'data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out',
          'data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-fade-out-0',
          'data-[state=open]:tw-zoom-in-95 data-[state=closed]:tw-zoom-out-95',
          'data-[side=bottom]:tw-slide-in-from-top-2 data-[side=top]:tw-slide-in-from-bottom-2',
          'data-[side=left]:tw-slide-in-from-right-2 data-[side=right]:tw-slide-in-from-left-2',
          className
        )}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = 'PopoverContent';
PopoverContent.propTypes = {
  align: PropTypes.oneOf(['start', 'center', 'end']),
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  sideOffset: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── PopoverHeader ────────────────────────────────────────────────────────────

function PopoverHeader({ className, ...props }) {
  return <div data-slot="popover-header" className={cn('tw-flex tw-flex-col tw-gap-0.5', className)} {...props} />;
}
PopoverHeader.displayName = 'PopoverHeader';
PopoverHeader.propTypes = {
  className: PropTypes.string,
};

// ── PopoverTitle ─────────────────────────────────────────────────────────────

const PopoverTitle = forwardRef(function PopoverTitle({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="popover-title"
      className={cn('tw-font-title-large tw-text-text-default', className)}
      {...props}
    />
  );
});
PopoverTitle.displayName = 'PopoverTitle';
PopoverTitle.propTypes = {
  className: PropTypes.string,
};

// ── PopoverDescription ───────────────────────────────────────────────────────

const PopoverDescription = forwardRef(function PopoverDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="popover-description"
      className={cn('tw-font-body-small tw-text-text-placeholder tw-m-0', className)}
      {...props}
    />
  );
});
PopoverDescription.displayName = 'PopoverDescription';
PopoverDescription.propTypes = {
  className: PropTypes.string,
};

// ── Popover (root pass-through) ──────────────────────────────────────────────

const Popover = PopoverPrimitive.Root;

// ── Exports ──────────────────────────────────────────────────────────────────

export { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverTrigger };
