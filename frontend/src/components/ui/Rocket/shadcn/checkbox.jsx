import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'tw-peer tw-relative tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[4px] tw-border tw-border-input tw-transition-colors tw-outline-none focus-visible:tw-border-ring focus-visible:tw-ring-2 focus-visible:tw-ring-ring/50 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 aria-invalid:tw-border-destructive aria-invalid:tw-ring-2 aria-invalid:tw-ring-destructive/20 data-[state=checked]:tw-border-primary data-[state=checked]:tw-bg-primary data-[state=checked]:tw-text-primary-foreground data-[state=indeterminate]:tw-border-primary data-[state=indeterminate]:tw-bg-primary data-[state=indeterminate]:tw-text-primary-foreground',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="tw-grid tw-place-content-center tw-text-current tw-transition-none [&>svg]:tw-size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
