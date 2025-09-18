import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputVariants } from './InputUtils/Variants';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useEffect } from 'react';

export const Input = React.forwardRef(
  ({ className, size, type, multiline, response, isValid, isWorkspaceConstant, rows = 3, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const isPasswordField = type === 'password';

    const togglePasswordVisibility = () => {
      if (!props.disabled) {
        setIsPasswordVisible((prev) => !prev);
      }
    };

    useEffect(() => {
      if (isWorkspaceConstant) {
        setIsPasswordVisible(true);
      }
    }, [isWorkspaceConstant]);

    const validationClass = response === true ? 'valid-textarea' : response === false ? 'invalid-textarea' : '';

    const getTextSize = () => {
      switch (size) {
        case 'small':
          return 'tw-text-[12px]/[18px]';
        case 'medium':
          return 'tw-text-[12px]/[18px]';
        case 'large':
          return 'tw-text-[14px]/[20px]';
        default:
          return 'tw-text-[12px]/[18px]';
      }
    };

    const inputStyle = ` ${
      props.disabled ? 'placeholder:tw-text-text-placeholder' : 'placeholder:tw-text-text-default'
    } ${
      isValid === true ? '!tw-border-border-success-strong' : isValid === false ? '!tw-border-border-danger-strong' : ''
    }`;

    return (
      <div className="design-component-inputs">
        {multiline ? (
          <textarea
            className={cn(
              `tw-relative tw-peer tw-flex ${getTextSize()} tw-w-full tw-rounded-[8px] tw-border-[1px] tw-border-solid tw-bg-background-surface-layer-01 tw-py-[7px] tw-text-text-default focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-border-accent-strong focus-visible:tw-ring-offset-border-accent-strong focus-visible:tw-border-transparent disabled:tw-cursor-not-allowed ${
                props.styles
              }`,
              className,
              validationClass
            )}
            rows={rows}
            ref={ref}
            {...props}
          />
        ) : (
          <div className="tw-relative">
            <input
              type={isPasswordField && isPasswordVisible ? 'text' : type}
              className={cn(
                inputVariants({ size }),
                `tw-peer tw-flex ${getTextSize()} tw-w-full tw-rounded-[8px] tw-border tw-border-solid tw-border-border-strong tw-bg-background-surface-layer-01 tw-px-3 tw-py-[7px] tw-text-text-default focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-border-accent-strong focus-visible:tw-ring-offset-border-accent-strong focus-visible:tw-border-transparent disabled:tw-cursor-not-allowed ${
                  props.styles
                }`,
                className,
                inputStyle
              )}
              ref={ref}
              {...props}
            />
            {isPasswordField && (
              <Button
                type="button"
                variant="ghost"
                iconOnly
                className="tw-absolute tw-right-1 tw-top-1/2 tw-transform tw--translate-y-1/2 tw-bg-none tw-border-none tw-cursor-pointer tw-p-1 tw-text-icon-strong hover:tw-text-icon-default focus:tw-outline-none"
                onClick={togglePasswordVisibility}
                disabled={props.disabled}
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {isPasswordVisible ? <EyeOff width="16" height="16" /> : <Eye width="16" height="16" />}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
