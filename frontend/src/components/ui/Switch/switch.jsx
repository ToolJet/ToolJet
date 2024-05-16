import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'tw-peer tw-inline-flex tw-h-6 tw-w-11 tw-shrink-0 tw-cursor-pointer tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-background-accent-strong focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50 data-[state=checked]:tw-bg-background-accent-strong data-[state=unchecked]:tw-bg-slider-track',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'tw-pointer-events-none tw-block tw-h-5 tw-w-5 tw-rounded-full tw-bg-page-weak tw-shadow-lg tw-ring-0 tw-transition-transform data-[state=checked]:tw-translate-x-3.5 data-[state=unchecked]:-tw-translate-x-1.5'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
