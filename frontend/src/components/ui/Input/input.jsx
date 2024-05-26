import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from '../Label/label';
import { cva } from 'class-variance-authority';
import ValidationIcon from './ValidationIcon';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import TrailingBtn from './TrailingBtn';
import HelperIcon from './HelperIcon';

const inputVariants = cva('', {
  variants: {
    size: {
      small: `tw-h-[28px]`,
      medium: `tw-h-[32px]`,
      large: `tw-h-[40px]`,
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});

const Input = React.forwardRef(
  (
    {
      className,
      type,
      label,
      size,
      placeholder,
      readOnly,
      helperText,
      validationText,
      response = 'success',
      leadingIcon,
      trailingAction,
      trailingActionDisabled,
      ...props
    },
    ref
  ) => {
    return (
      <div>
        {label && (
          <Label
            htmlFor="label"
            type="label"
            size="default"
            className={`tw-font-medium tw-mb-[2px] ${props.disabled ? 'tw-text-text-disabled' : ''}`}
          >
            {label}
            {props.required && (
              <span
                className={`tw-ml-[2px] tw-relative -tw-top-[1px] ${
                  props.disabled ? 'tw-text-text-disabled' : 'tw-text-text-danger'
                }`}
              >
                *
              </span>
            )}
          </Label>
        )}
        <div className="tw-relative">
          {leadingIcon && (
            <SolidIcon
              name={leadingIcon}
              width="16px"
              height="16px"
              className={`tw-absolute ${
                size === 'small' ? 'tw-top-[6px] tw-left-[10px]' : 'tw-top-[7px] tw-left-[12px]'
              }`}
              fill="var(--icon-default)"
            />
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ size }),
              `tw-peer tw-flex tw-text-[12px]/[18px] tw-w-full tw-rounded-[8px] tw-border-[1px] tw-border-solid tw-bg-background-surface-layer-01 ${
                leadingIcon ? (size === 'small' ? 'tw-pl-[32px]' : 'tw-pl-[34px]') : 'tw-pl-[12px]'
              } ${trailingAction ? (size === 'small' ? 'tw-pr-[40px]' : 'tw-pr-[44px]') : 'tw-pr-[12px]'} ${
                type === 'editable title'
                  ? `tw-border-transparent hover:tw-border-border-default tw-font-medium ${
                      props.disabled ? 'placeholder:tw-text-text-placeholder' : 'placeholder:tw-text-text-default'
                    }`
                  : 'tw-border-border-default placeholder:tw-text-text-placeholder tw-font-normal disabled:tw-bg-[#CCD1D5]/30'
              } ${
                response === 'success'
                  ? 'tw-border-border-success-strong'
                  : response === 'failure'
                  ? 'tw-border-border-danger-strong'
                  : ''
              } tw-py-[7px] file:tw-border-0 file:tw-bg-transparent tw-text-text-default focus-visible:tw-border-[2px] focus-visible:tw-border-border-accent-strong disabled:tw-cursor-not-allowed disabled:tw-border-transparent`,
              className
            )}
            placeholder={props.disabled && readOnly ? readOnly : placeholder}
            ref={ref}
            {...props}
          />
          {type === 'editable title' && (
            <SolidIcon
              name="editable"
              width="16px"
              height="16px"
              className={`tw-hidden peer-focus:tw-hidden peer-disabled:tw-hidden peer-hover:tw-block tw-absolute ${
                size === 'small' ? 'tw-top-[6px] tw-right-[6px]' : 'tw-top-[8px] tw-right-[8px]'
              }`}
              fill="var(--icon-default)"
            />
          )}
          {trailingAction && (
            <TrailingBtn
              size={size}
              type={trailingAction}
              disabled={trailingActionDisabled || props.disabled}
              className={`tw-absolute tw-right-[12px] ${size === 'small' ? 'tw-top-[5px]' : 'tw-top-[4px]'}`}
            />
          )}
        </div>
        {helperText && (
          <div className="tw-flex tw-pl-[2px] tw-items-center tw-gap-[5px] tw-mt-[2px]">
            <HelperIcon />
            <Label
              htmlFor="helper"
              type="helper"
              size="default"
              className={`tw-font-normal ${props.disabled ? 'tw-text-text-disabled' : ''}`}
            >
              {helperText}
            </Label>
          </div>
        )}
        {(response === 'success' || response === 'failure') && !props.disabled && (
          <div className="tw-flex tw-pl-[2px] tw-items-center tw-gap-[5px] tw-mt-[2px]">
            <ValidationIcon result={response} />
            <Label
              htmlFor="validation"
              type="helper"
              size="default"
              className={`tw-font-normal ${response === 'success' ? 'tw-text-text-success' : 'tw-text-text-warning'}`}
            >
              {validationText}
            </Label>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
