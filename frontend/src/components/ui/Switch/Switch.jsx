/* eslint-disable import/no-unresolved */
import * as React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';
import { HelperText, SwitchLabel } from './SwitchUtils/SwitchUtils';

const switchVariants = cva('tw-flex', {
  variants: {
    align: {
      left: ``,
      right: `tw-flex-row-reverse tw-justify-between`,
    },
  },
  compoundVariants: [
    {
      align: 'left',
      size: 'default',
      className: 'tw-space-x-[6px]',
    },
    {
      align: 'left',
      size: 'large',
      className: 'tw-space-x-[8px]',
    },
    {
      align: 'right',
      size: 'default',
      className: 'tw-w-[295px]',
    },
    {
      align: 'right',
      size: 'large',
      className: 'tw-w-[278px]',
    },
  ],
  defaultVariants: {
    align: 'left',
    size: 'default',
  },
});

const Switch = React.forwardRef(({ className, align, ...props }, ref) => (
  <div className={cn(switchVariants({ align }), `${!props.helper && 'tw-items-center'}`, className)}>
    <SwitchPrimitives.Root
      className={cn(
        'tw-peer tw-inline-flex tw-mt-[2px] tw-h-[16px] tw-w-[28px] tw-shrink-0 tw-cursor-pointer tw-items-center tw-rounded-[12px] tw-border-transparent tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-background-accent-strong focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-white disabled:tw-cursor-not-allowed disabled:!tw-bg-[#CCD1D5]/30 data-[state=checked]:tw-bg-background-accent-strong data-[state=unchecked]:tw-bg-slider-track'
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
    {props.label && (
      <div className={`tw-flex tw-flex-col ${props.helper && props.size === 'large' && 'tw-space-y-[2px]'}`}>
        <SwitchLabel label={props.label} size={props.size} disabled={props.disabled} />
        <HelperText helper={props.helper} size={props.size} disabled={props.disabled} />
      </div>
    )}
  </div>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
