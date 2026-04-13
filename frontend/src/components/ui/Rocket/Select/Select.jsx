import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  Select as ShadcnSelect,
  SelectContent as ShadcnSelectContent,
  // Re-exported unchanged
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/Rocket/shadcn/select';

// ── SelectTrigger ─────────────────────────────────────────────────────────

const selectTriggerVariants = cva(
  [
    // Layout (from shadcn base)
    'tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-1 tw-whitespace-nowrap',
    // Resets (preflight is off — browser adds outset border on buttons)
    'tw-appearance-none tw-outline-none tw-border tw-border-solid tw-rounded-md',
    // Base tokens (mirrors Input)
    'tw-bg-background-surface-layer-01 tw-border-border-default tw-text-text-default tw-shadow-elevation-000',
    'data-[placeholder]:tw-text-text-placeholder',
    // SelectValue text truncation
    '[&>span]:tw-line-clamp-1',
    // Chevron icon colour
    '[&>svg]:tw-text-icon-default [&>svg]:tw-opacity-100',
    // Focus ring (override shadcn)
    'focus:tw-ring-2 focus:tw-ring-interactive-focus-outline',
    // Hover
    'hover:tw-border-border-strong',
    // Error (via aria-invalid)
    'aria-[invalid=true]:tw-border-border-danger-strong aria-[invalid=true]:tw-bg-background-error-weak',
    // Disabled
    'disabled:tw-cursor-not-allowed disabled:tw-opacity-50 disabled:tw-bg-background-surface-layer-02 disabled:tw-text-text-disabled disabled:tw-border-transparent disabled:tw-shadow-none',
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

const SelectTrigger = forwardRef(function SelectTrigger(
  { className, size, showArrow = true, children, ...props },
  ref
) {
  return (
    <SelectPrimitive.Trigger ref={ref} className={cn(selectTriggerVariants({ size }), className)} {...props}>
      {children}

      {showArrow && (
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="tw-h-4 tw-w-4 tw-opacity-50 tw-shrink-0" />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  );
});

SelectTrigger.displayName = 'SelectTrigger';
SelectTrigger.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  showIcon: PropTypes.bool,
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

const SelectItem = forwardRef(function SelectItem({ className, children, showCheckIcon = true, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'tw-relative tw-flex tw-w-full tw-cursor-default tw-select-none tw-items-center tw-rounded-md tw-outline-none',
        'tw-h-8 tw-text-base tw-text-text-default tw-py-1.5 tw-pr-2',
        showCheckIcon ? 'tw-pl-[30px]' : 'tw-pl-2',
        'focus:tw-bg-interactive-hover focus:tw-text-text-default',
        'data-[disabled]:tw-pointer-events-none data-[disabled]:tw-opacity-50',
        className
      )}
      {...props}
    >
      {showCheckIcon && (
        <span className="tw-absolute tw-left-2 tw-flex tw-h-3.5 tw-w-3.5 tw-items-center tw-justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className="tw-h-4 tw-w-4 tw-text-text-brand" />
          </SelectPrimitive.ItemIndicator>
        </span>
      )}

      {typeof children === 'string' ? <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText> : children}
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = 'SelectItem';

// ── SelectItemText (for explicit composition in custom item layouts) ───────

const SelectItemText = SelectPrimitive.ItemText;

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
  SelectItemText,
  // Re-exports from shadcn
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};
