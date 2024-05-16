import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';
import { Label } from '../Label/label';
import { cva } from 'class-variance-authority';

const switchVariants = cva('', {
  variants: {
    align: {
      left: `tw-flex tw-space-x-2`,
      right: `tw-flex tw-flex-row-reverse tw-space-x-5 tw-space-x-reverse`,
    },
  },
  defaultVariants: {
    align: 'left',
  },
});

const Switch = React.forwardRef(({ className, align, ...props }, ref) => (
  <div className={cn(switchVariants({ align }), `${props.helper ? '' : 'tw-items-center'}`)}>
    <SwitchPrimitives.Root
      className={cn(
        'tw-peer tw-group tw-inline-flex tw-h-[16px] tw-w-[28px] tw-shrink-0 tw-cursor-pointer tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-background-accent-strong focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50 data-[state=checked]:tw-bg-background-accent-strong data-[state=unchecked]:tw-bg-slider-track',
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'tw-pointer-events-none tw-block tw-h-[12px] tw-w-[12px] tw-rounded-full tw-bg-page-weak tw-shadow-lg tw-ring-0 tw-transition-transform data-[state=checked]:tw-translate-x-1.5 data-[state=unchecked]:-tw-translate-x-1.5'
        )}
      />
    </SwitchPrimitives.Root>
    <div className={`tw-flex tw-flex-col ${props.helper ? 'tw-space-y-2' : ''}`}>
      <Label
        htmlFor="label"
        type="label"
        size={props.size || 'default'}
        className={`${props.disabled ? '!tw-text-text-disabled' : ''}`}
      >
        {props.label}
      </Label>
      <Label
        htmlFor="helper"
        type="helper"
        size={props.size || 'default'}
        disabled={props.disabled}
        className={`${props.disabled ? '!tw-text-text-disabled' : ''}`}
      >
        {props.helper}
      </Label>
    </div>
  </div>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
