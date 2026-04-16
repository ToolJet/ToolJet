import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Textarea as ShadcnTextarea } from '@/components/ui/Rocket/shadcn/textarea';

const textareaVariants = cva(
  [
    // Resets not covered by shadcn base (preflight is off)
    'tw-appearance-none tw-border-solid tw-outline-none',
    // Base tokens
    'tw-bg-background-surface-layer-01 tw-border-border-default tw-text-text-default tw-shadow-elevation-none',
    'tw-text-base',
    'placeholder:tw-text-text-placeholder',
    // Override shadcn focus ring with ToolJet token
    'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline !focus-visible:tw-outline-none',
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
        large: 'tw-px-3 tw-py-2.5 tw-text-lg',
        default: 'tw-px-3 tw-py-2 tw-text-base',
        small: 'tw-px-3 tw-py-1.5 tw-text-base',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const Textarea = forwardRef(function Textarea({ className, size, ...props }, ref) {
  return <ShadcnTextarea ref={ref} className={cn(textareaVariants({ size }), className)} {...props} />;
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  className: PropTypes.string,
};

export { Textarea, textareaVariants };
