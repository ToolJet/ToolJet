import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { cn } from '@/lib/utils';
import CheckIcon from './CheckIcon';
import RadioIcon from './RadioIcon';
import { cva } from 'class-variance-authority';
import { Label } from '../Label/label';
import IntermediateIcon from './IntermediateIcon';

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

const checkPositionVariants = cva('', {
  variants: {
    align: {
      left: `tw-flex tw-space-x-[12px]`,
      right: `tw-flex tw-flex-row-reverse tw-space-x-[96px] tw-space-x-reverse`,
    },
  },
  defaultVariants: {
    align: 'left',
  },
});

const Checkbox = React.forwardRef(({ className, type, size, intermediate, align, ...props }, ref) => (
  <div className={cn(checkPositionVariants({ align }), `${props.helper ? '' : 'tw-items-center'}`)}>
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        checkVariants({ type, size }),
        `tw-peer tw-flex tw-justify-center tw-items-center tw-shrink-0 tw-border tw-border-solid tw-border-[1px] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-icon-brand focus-visible:data-[state=checked]:tw-ring-offset-2 ${
          props.disabled
            ? 'tw-cursor-not-allowed tw-bg-[#CCD1D5]/30 tw-border-border-weak'
            : 'tw-bg-background-surface-layer-01 tw-border-border-default'
        }`,
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          checkVariants({ type, size }),
          `tw-block tw-flex tw-justify-center tw-items-center ${
            props.disabled ? 'tw-bg-[#ACB2B9]/45' : 'tw-bg-icon-brand'
          }`
        )}
      >
        {intermediate === true && props.disabled === false ? (
          <IntermediateIcon size={size} />
        ) : type === 'radio' ? (
          <RadioIcon size={size} />
        ) : (
          <CheckIcon size={size} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    {props.label && (
      <div
        className={`tw-flex tw-flex-col ${
          props.helper ? (props.size === 'large' ? 'tw-space-y-[4px]' : 'tw-space-y-[2px]') : ''
        }`}
      >
        <Label
          htmlFor="label"
          type="label"
          size={size || 'default'}
          className={`${props.disabled ? '!tw-text-text-disabled' : ''}`}
        >
          {props.label}
        </Label>
        <Label
          htmlFor="helper"
          type="helper"
          size={size || 'default'}
          disabled={props.disabled}
          className={`${props.disabled ? '!tw-text-text-disabled' : ''}`}
        >
          {props.helper}
        </Label>
      </div>
    )}
  </div>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
