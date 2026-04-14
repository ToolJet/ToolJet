import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ── RadioGroup ──────────────────────────────────────────────────────────────

const RadioGroup = forwardRef(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="radio-group"
      className={cn('tw-grid tw-gap-2', className)}
      {...props}
    />
  );
});
RadioGroup.displayName = 'RadioGroup';
RadioGroup.propTypes = {
  className: PropTypes.string,
};

// ── RadioGroupItem ──────────────────────────────────────────────────────────

const radioGroupItemVariants = cva(
  [
    // Layout
    'tw-relative tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full',
    // Reset
    'tw-appearance-none tw-outline-none',
    // Default border + bg
    'tw-border-solid tw-border tw-border-border-default',
    'tw-bg-background-surface-layer-01',
    'tw-transition-colors',
    // Checked
    'data-[state=checked]:tw-bg-button-primary data-[state=checked]:tw-border-button-primary',
    // Disabled
    'disabled:tw-cursor-not-allowed',
    'disabled:tw-bg-controls-base-inactive disabled:tw-border-transparent',
    'disabled:data-[state=checked]:tw-bg-controls-base-inactive disabled:data-[state=checked]:tw-border-transparent',
    // Focus ring
    'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-background',
  ],
  {
    variants: {
      size: {
        large: 'tw-size-5',
        default: 'tw-size-4',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const innerDotSizeClasses = {
  large: 'tw-size-2',
  default: 'tw-size-1.5',
};

const RadioGroupItem = forwardRef(function RadioGroupItem({ className, size = 'default', ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-slot="radio-group-item"
      className={cn(radioGroupItemVariants({ size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="tw-flex tw-items-center tw-justify-center"
      >
        <span className={cn('tw-rounded-full tw-bg-text-on-solid', innerDotSizeClasses[size])} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';
RadioGroupItem.propTypes = {
  size: PropTypes.oneOf(['large', 'default']),
  className: PropTypes.string,
};

export { RadioGroup, RadioGroupItem, radioGroupItemVariants };
