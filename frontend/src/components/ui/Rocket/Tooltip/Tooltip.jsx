import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import {
  Tooltip as ShadcnTooltip,
  TooltipTrigger as ShadcnTooltipTrigger,
  TooltipContent as ShadcnTooltipContent,
  TooltipProvider as ShadcnTooltipProvider,
} from '@/components/ui/Rocket/shadcn/tooltip';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

// ── Re-exports (no visual tokens to override) ────────────────────────────
const TooltipProvider = ShadcnTooltipProvider;
const Tooltip = ShadcnTooltip;
const TooltipTrigger = ShadcnTooltipTrigger;

// ── TooltipContent ───────────────────────────────────────────────────────
const tooltipContentClasses = [
  'tw-z-50 tw-overflow-hidden tw-rounded-lg',
  'tw-bg-background-inverse tw-text-text-on-solid',
  'tw-p-3 tw-text-xs tw-font-medium tw-leading-[18px]',
  'tw-shadow-elevation-400',
  'tw-animate-in tw-fade-in-0 tw-zoom-in-95',
  'data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=closed]:tw-zoom-out-95',
  'data-[side=bottom]:tw-slide-in-from-top-2',
  'data-[side=left]:tw-slide-in-from-right-2',
  'data-[side=right]:tw-slide-in-from-left-2',
  'data-[side=top]:tw-slide-in-from-bottom-2',
].join(' ');

const TooltipContent = forwardRef(function TooltipContent(
  { className, sideOffset = 4, children, showArrow = true, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(tooltipContentClasses, className)}
        {...props}
      >
        {children}
        {showArrow && (
          <TooltipArrow />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = 'TooltipContent';

TooltipContent.propTypes = {
  className: PropTypes.string,
  sideOffset: PropTypes.number,
  showArrow: PropTypes.bool,
  children: PropTypes.node,
};

// ── TooltipArrow ─────────────────────────────────────────────────────────
const TooltipArrow = forwardRef(function TooltipArrow(
  { className, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Arrow
      ref={ref}
      className={cn('tw-fill-[var(--background-inverse)]', className)}
      {...props}
    />
  );
});
TooltipArrow.displayName = 'TooltipArrow';

TooltipArrow.propTypes = {
  className: PropTypes.string,
};

// ── Exports ──────────────────────────────────────────────────────────────
export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
  tooltipContentClasses,
};
