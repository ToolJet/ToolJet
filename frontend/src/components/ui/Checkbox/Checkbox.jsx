/* eslint-disable import/no-unresolved */
import * as React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';
// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';
import CheckIcon from './CheckboxUtils/CheckIcon';
import RadioIcon from './CheckboxUtils/RadioIcon';
import IntermediateIcon from './CheckboxUtils/IntermediateIcon';
import { CheckboxLabel, HelperText } from './CheckboxUtils/CheckboxUtils';

const checkVariants = cva('', {
  variants: {
    type: {
      checkbox: `tw-rounded-[5px]`,
      radio: `tw-rounded-[50%]`,
      checkmark: `tw-rounded-[50%]`,
    },
    size: {
      default: `tw-h-[16px] tw-w-[16px]`,
      large: `tw-h-[20px] tw-w-[20px]`,
    },
  },
  compoundVariants: [
    {
      type: 'checkbox',
      size: 'large',
      className: 'tw-rounded-[7px]',
    },
  ],
  defaultVariants: {
    type: 'checkbox',
    size: 'default',
  },
});

const checkPositionVariants = cva('tw-flex', {
  variants: {
    align: {
      left: ``,
      right: `tw-w-full tw-flex-row-reverse tw-justify-between`,
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
      className: 'tw-space-x-[12px]',
    },
  ],
  defaultVariants: {
    align: 'left',
    size: 'default',
  },
});

const Checkbox = React.forwardRef(({ className, type, size, intermediate, align, ...props }, ref) => (
  <div className={cn(checkPositionVariants({ align, size }), `${!props.helper && 'tw-items-center'}`, className)}>
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        checkVariants({ type, size }),
        `tw-peer tw-mt-[2px] tw-flex tw-justify-center tw-items-center tw-shrink-0 tw-border-solid tw-border-[1px] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-icon-brand focus-visible:data-[state=checked]:tw-ring-offset-2 ${
          props.disabled
            ? 'tw-cursor-not-allowed tw-bg-[#CCD1D5]/30 tw-border-border-weak'
            : 'tw-bg-background-surface-layer-01 tw-border-border-default'
        }`
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          checkVariants({ type, size }),
          `tw-flex tw-justify-center tw-items-center ${props.disabled ? 'tw-bg-[#ACB2B9]/45' : 'tw-bg-icon-brand'}`
        )}
      >
        {intermediate === true && props.disabled !== true ? (
          <IntermediateIcon size={size} />
        ) : type === 'radio' ? (
          <RadioIcon size={size} />
        ) : (
          <CheckIcon size={size} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    {props.label && (
      <div className={`tw-flex tw-flex-col ${props.helper && props.size === 'large' && 'tw-space-y-[2px]'}`}>
        <CheckboxLabel label={props.label} size={size} disabled={props.disabled} />
        <HelperText helper={props.helper} size={size} disabled={props.disabled} />
      </div>
    )}
  </div>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
