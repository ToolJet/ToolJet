import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputBaseVariants } from './InputUtils/Variants';

export const Input = React.forwardRef(({ className, size, type, multiline, response, rows = 3, ...props }, ref) => {
  const validationClass = response === true ? 'valid-textarea' : response === false ? 'invalid-textarea' : '';

  // Apply both size and validationState variants in Input.jsx
  const baseVariants = inputBaseVariants({
    size,
    validationState: response === true ? 'success' : response === false ? 'error' : 'default',
  });

  return (
    <div className="design-component-inputs">
      {multiline ? (
        <textarea
          className={cn(
            baseVariants,
            `tw-relative tw-peer tw-flex placeholder:tw-text-text-placeholder tw-font-normal disabled:tw-bg-interactive-default tw-w-full tw-border-[1px] tw-border-solid tw-bg-background-surface-layer-01 tw-text-text-default focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-border-accent-strong focus-visible:tw-ring-offset-border-accent-strong focus-visible:tw-border-transparent disabled:tw-cursor-not-allowed ${props.styles}`,
            className,
            validationClass
          )}
          rows={rows}
          ref={ref}
          {...props}
        />
      ) : (
        <input
          type={type}
          className={cn(
            baseVariants,
            `tw-peer tw-flex placeholder:tw-text-text-placeholder tw-font-normal disabled:tw-bg-interactive-default tw-w-full tw-border tw-border-solid tw-bg-background-surface-layer-01 tw-text-text-default focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-border-accent-strong focus-visible:tw-ring-offset-border-accent-strong focus-visible:tw-border-transparent disabled:tw-cursor-not-allowed ${props.styles}`,
            className
          )}
          ref={ref}
          {...props}
        />
      )}
    </div>
  );
});
Input.displayName = 'Input';
