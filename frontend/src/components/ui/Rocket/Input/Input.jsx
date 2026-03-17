import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Input as ShadcnInput } from '@/components/ui/Rocket/shadcn/input';

const inputVariants = cva(
  [
    // Resets not covered by shadcn base (preflight is off)
    'tw-appearance-none tw-border-solid tw-outline-none',
    // Base tokens
    'tw-bg-background-surface-layer-01 tw-border-border-default tw-text-text-default tw-shadow-elevation-none',
    'placeholder:tw-text-text-placeholder',
    // Override shadcn focus ring with ToolJet token
    'focus-visible:tw-ring-2 focus-visible:tw-ring-[var(--interactive-focus-outline)] focus-visible:tw-ring-offset-1 !focus-visible:tw-outline-none',
    // Hover
    'hover:tw-border-border-strong',
    // Error (via aria-invalid)
    'aria-[invalid=true]:tw-border-border-danger-strong aria-[invalid=true]:tw-bg-background-error-weak',
    // Disabled
    'disabled:tw-bg-background-surface-layer-02 disabled:tw-text-text-disabled disabled:tw-border-border-disabled',
  ],
  {
    variants: {
      size: {
        large: 'tw-h-10 tw-text-lg tw-px-3 tw-py-2.5',
        default: 'tw-h-8 tw-text-base tw-px-3 tw-py-2',
        small: 'tw-h-7 tw-text-base tw-px-3 tw-py-1.5',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const Input = forwardRef(function Input({ className, size, ...props }, ref) {
  return (
    <ShadcnInput
      ref={ref}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  className: PropTypes.string,
};

export { Input, inputVariants };
