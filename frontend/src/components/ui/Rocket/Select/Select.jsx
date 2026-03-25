import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  Select as ShadcnSelect,
  SelectTrigger as ShadcnSelectTrigger,
  SelectContent as ShadcnSelectContent,
  SelectItem as ShadcnSelectItem,
  // Re-exported unchanged
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/Rocket/shadcn/select';

// ── SelectTrigger ─────────────────────────────────────────────────────────

const selectTriggerVariants = cva(
  [
    // Resets (preflight is off — browser adds outset border on buttons)
    'tw-appearance-none tw-outline-none tw-border-solid',
    // Base tokens (mirrors Input)
    'tw-bg-background-surface-layer-01 tw-border-border-default tw-text-text-default tw-shadow-elevation-none',
    'data-[placeholder]:tw-text-text-placeholder',
    // Chevron icon colour
    '[&>svg]:tw-text-icon-default [&>svg]:tw-opacity-100',
    // Focus ring (override shadcn)
    'focus:tw-ring-2 focus:tw-ring-interactive-focus-outline',
    // Hover
    'hover:tw-border-border-strong',
    // Error (via aria-invalid)
    'aria-[invalid=true]:tw-border-border-danger-strong aria-[invalid=true]:tw-bg-background-error-weak',
    // Disabled
    'disabled:tw-bg-background-surface-layer-02 disabled:tw-text-text-disabled disabled:tw-border-transparent disabled:tw-shadow-none',
  ],
  {
    variants: {
      size: {
        large: 'tw-h-10 tw-text-lg tw-px-3',
        default: 'tw-h-8 tw-text-base tw-px-3',
        small: 'tw-h-7 tw-text-base tw-px-3',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const SelectTrigger = forwardRef(function SelectTrigger({ className, size, ...props }, ref) {
  return <ShadcnSelectTrigger ref={ref} className={cn(selectTriggerVariants({ size }), className)} {...props} />;
});
SelectTrigger.displayName = 'SelectTrigger';
SelectTrigger.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  className: PropTypes.string,
};

// ── SelectContent ─────────────────────────────────────────────────────────

const SelectContent = forwardRef(function SelectContent({ className, ...props }, ref) {
  return (
    <ShadcnSelectContent
      ref={ref}
      className={cn(
        'tw-bg-background-surface-layer-01 tw-border-border-weak tw-rounded-lg tw-shadow-elevation-300',
        className
      )}
      {...props}
    />
  );
});
SelectContent.displayName = 'SelectContent';

// ── SelectItem ────────────────────────────────────────────────────────────

const SelectItem = forwardRef(function SelectItem({ className, ...props }, ref) {
  return (
    <ShadcnSelectItem
      ref={ref}
      className={cn(
        'tw-h-8 tw-text-base tw-text-text-default tw-rounded-md tw-pl-[30px] tw-pr-2 tw-py-1.5',
        'focus:tw-bg-interactive-hover focus:tw-text-text-default',
        // Move check indicator from right → left
        '[&>span:first-child]:tw-left-2 [&>span:first-child]:tw-right-auto',
        '[&>span:first-child_svg]:tw-text-text-brand',
        className
      )}
      {...props}
    />
  );
});
SelectItem.displayName = 'SelectItem';

// ── Select (root pass-through) ────────────────────────────────────────────

function Select(props) {
  return <ShadcnSelect {...props} />;
}
Select.displayName = 'Select';

// ── Exports ───────────────────────────────────────────────────────────────

export {
  Select,
  SelectTrigger,
  selectTriggerVariants,
  SelectContent,
  SelectItem,
  // Re-exports from shadcn
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};
