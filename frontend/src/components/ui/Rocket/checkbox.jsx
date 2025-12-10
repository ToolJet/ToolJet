import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'tw-grid tw-place-content-center tw-peer tw-h-4 tw-w-4 tw-shrink-0 tw-rounded-sm tw-border tw-border-input tw-transition-transform focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ring active:tw-scale-[0.97] disabled:tw-cursor-not-allowed disabled:tw-opacity-50 data-[state=checked]:tw-bg-primary data-[state=checked]:tw-text-primary-foreground data-[state=checked]:tw-border-border-accent-strong',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('tw-grid tw-place-content-center tw-text-current')}>
      <Check className="tw-h-4 tw-w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
