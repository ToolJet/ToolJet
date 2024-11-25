import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputVariants } from './InputUtils/Variants';

const Input = React.forwardRef(({ className, size, ...props }, ref) => {
  return (
    <input
      className={cn(
        inputVariants({ size }),
        `tw-peer tw-flex tw-text-[12px]/[18px] tw-w-full tw-rounded-[8px] tw-border-[1px] tw-border-solid tw-bg-background-surface-layer-01 tw-py-[7px] tw-text-text-default focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-border-accent-strong focus-visible:tw-ring-offset-border-accent-strong focus-visible:tw-border-transparent disabled:tw-cursor-not-allowed disabled:tw-border-transparent`,
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
