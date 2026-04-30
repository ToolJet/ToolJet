import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';

function RadioGroup({ className, ...props }) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('tw-grid tw-w-full tw-gap-2', className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'tw-peer tw-relative tw-flex tw-aspect-square tw-size-4 tw-shrink-0 tw-rounded-full tw-border tw-border-input tw-outline-none focus-visible:tw-border-ring focus-visible:tw-ring-2 focus-visible:tw-ring-ring/50 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 data-[state=checked]:tw-border-primary data-[state=checked]:tw-bg-primary data-[state=checked]:tw-text-primary-foreground',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="tw-flex tw-size-4 tw-items-center tw-justify-center"
      >
        <span className="tw-absolute tw-top-1/2 tw-left-1/2 tw-size-2 tw--translate-x-1/2 tw--translate-y-1/2 tw-rounded-full tw-bg-primary-foreground" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
