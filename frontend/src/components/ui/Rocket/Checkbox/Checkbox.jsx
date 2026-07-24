import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva } from 'class-variance-authority';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Checkbox ────────────────────────────────────────────────────────────────

const checkboxVariants = cva(
  [
    // Layout
    'tw-group tw-peer tw-relative tw-flex tw-shrink-0 tw-items-center tw-justify-center',
    // Reset (preflight off)
    'tw-appearance-none tw-outline-none',
    // Default border + bg
    'tw-border-solid tw-border tw-border-border-default',
    'tw-bg-background-surface-layer-01',
    'tw-transition-colors',
    // Checked + indeterminate
    'data-[state=checked]:tw-bg-button-primary data-[state=checked]:tw-border-button-primary',
    'data-[state=indeterminate]:tw-bg-button-primary data-[state=indeterminate]:tw-border-button-primary',
    // Icon color when checked
    'tw-text-text-on-solid',
    // Disabled
    'disabled:tw-cursor-not-allowed',
    'disabled:tw-bg-controls-base-inactive disabled:tw-border-transparent',
    'disabled:data-[state=checked]:tw-bg-controls-base-inactive disabled:data-[state=checked]:tw-border-transparent',
    'disabled:data-[state=indeterminate]:tw-bg-controls-base-inactive disabled:data-[state=indeterminate]:tw-border-transparent',
    'disabled:tw-text-icon-default',
    // Focus ring
    'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-2',
  ],
  {
    variants: {
      size: {
        large: 'tw-size-5 tw-rounded-[7px]',
        default: 'tw-size-4 tw-rounded-[5px]',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const checkIconSizeClasses = {
  large: 'tw-size-3',
  default: 'tw-size-2.5',
};

const Checkbox = forwardRef(function Checkbox({ className, size = 'default', ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="tw-grid tw-place-content-center"
        forceMount
      >
        {/* Both icons rendered; CSS shows the right one based on data-state */}
        <CheckIcon
          className={cn(
            checkIconSizeClasses[size],
            'tw-stroke-[3]',
            'group-data-[state=indeterminate]:tw-hidden group-data-[state=unchecked]:tw-hidden'
          )}
        />
        <MinusIcon
          className={cn(
            checkIconSizeClasses[size],
            'tw-stroke-[3]',
            'group-data-[state=checked]:tw-hidden group-data-[state=unchecked]:tw-hidden'
          )}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = 'Checkbox';
Checkbox.propTypes = {
  size: PropTypes.oneOf(['large', 'default']),
  checked: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['indeterminate'])]),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export { Checkbox, checkboxVariants };
